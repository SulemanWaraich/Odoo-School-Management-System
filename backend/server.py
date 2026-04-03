from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, File, UploadFile, Query
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import requests
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# Object Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "school-management"
storage_key = None

# Create the main app
app = FastAPI(title="School Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ================== MODELS ==================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "student"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    picture: Optional[str] = None
    created_at: Optional[str] = None

class StudentCreate(BaseModel):
    user_id: str
    student_id: str
    grade: str
    section: str
    parent_contact: Optional[str] = None
    address: Optional[str] = None

class TeacherCreate(BaseModel):
    user_id: str
    employee_id: str
    department: str
    qualification: Optional[str] = None
    phone: Optional[str] = None

class CourseCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    grade: str
    teacher_id: Optional[str] = None

class EnrollmentCreate(BaseModel):
    student_id: str
    course_id: str

class AttendanceCreate(BaseModel):
    student_id: str
    course_id: str
    date: str
    status: str  # present, absent, late, excused

class AttendanceBulkCreate(BaseModel):
    course_id: str
    date: str
    records: List[dict]  # [{student_id, status}]

class AssignmentCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    due_date: str
    max_score: int = 100

class SubmissionCreate(BaseModel):
    assignment_id: str
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    notes: Optional[str] = None

class WeeklyProgressCreate(BaseModel):
    student_id: str
    course_id: str
    week_start: str
    remarks: str
    performance_score: Optional[int] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "all"  # all, student, teacher
    course_id: Optional[str] = None

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    # Also check session_token for Google OAuth
    session_token = request.cookies.get("session_token")
    if not token and session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    user.pop("password_hash", None)
                    return user
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles):
    async def role_checker(request: Request):
        user = await get_current_user(request)
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ================== STORAGE HELPERS ==================

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ================== AUTH ENDPOINTS ==================

@api_router.post("/auth/register")
async def register(data: UserCreate, response: Response):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": data.name,
        "role": data.role,
        "password_hash": hashed,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create student/teacher profile if applicable
    if data.role == "student":
        student_doc = {
            "id": f"std_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "student_id": f"STD{uuid.uuid4().hex[:6].upper()}",
            "grade": "",
            "section": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.students.insert_one(student_doc)
    elif data.role == "teacher":
        teacher_doc = {
            "id": f"tch_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "employee_id": f"TCH{uuid.uuid4().hex[:6].upper()}",
            "department": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.teachers.insert_one(teacher_doc)
    
    access_token = create_access_token(user_id, email, data.role)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": data.name, "role": data.role}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force lockout
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_time = attempt.get("lockout_until")
        if lockout_time:
            if isinstance(lockout_time, str):
                lockout_time = datetime.fromisoformat(lockout_time)
            if lockout_time.tzinfo is None:
                lockout_time = lockout_time.replace(tzinfo=timezone.utc)
            if lockout_time > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"lockout_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = user.get("user_id", str(user.get("_id")))
    access_token = create_access_token(user_id, email, user["role"])
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    refresh = request.cookies.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(refresh, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(user["user_id"], user["email"], user["role"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# Google OAuth session endpoint
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth to get session data
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=30
        )
        resp.raise_for_status()
        session_data = resp.json()
    except Exception as e:
        logger.error(f"OAuth session error: {e}")
        raise HTTPException(status_code=400, detail="Invalid session")
    
    email = session_data.get("email", "").lower()
    name = session_data.get("name", "")
    picture = session_data.get("picture", "")
    session_token = session_data.get("session_token")
    
    # Find or create user
    user = await db.users.find_one({"email": email})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "student",  # Default role for new OAuth users
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        
        # Create student profile
        student_doc = {
            "id": f"std_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "student_id": f"STD{uuid.uuid4().hex[:6].upper()}",
            "grade": "",
            "section": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.students.insert_one(student_doc)
    else:
        user_id = user.get("user_id", str(user.get("_id")))
        # Update picture if changed
        if picture and picture != user.get("picture"):
            await db.users.update_one({"email": email}, {"$set": {"picture": picture}})
    
    # Store session
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "session_token": session_token,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    user_data = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user_data

# ================== ADMIN ENDPOINTS ==================

# Users management
@api_router.get("/admin/users")
async def get_users(request: Request, role: Optional[str] = None):
    user = await require_role("admin")(request)
    query = {} if not role else {"role": role}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    await require_role("admin")(request)
    body = await request.json()
    new_role = body.get("role")
    
    if new_role not in ["admin", "teacher", "student"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"role": new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated"}

# Extended User Management
@api_router.get("/admin/users/all")
async def get_all_users_detailed(request: Request, search: Optional[str] = None, role: Optional[str] = None, status: Optional[str] = None):
    await require_role("admin")(request)
    
    query = {}
    if role and role != "all":
        query["role"] = role
    if status == "active":
        query["is_active"] = {"$ne": False}
    elif status == "inactive":
        query["is_active"] = False
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/status")
async def toggle_user_status(user_id: str, request: Request):
    await require_role("admin")(request)
    body = await request.json()
    is_active = body.get("is_active", True)
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"is_active": is_active}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User status updated"}

@api_router.post("/admin/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, request: Request):
    await require_role("admin")(request)
    body = await request.json()
    new_password = body.get("password")
    
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    hashed = hash_password(new_password)
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"password_hash": hashed}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password reset successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    current_user = await require_role("admin")(request)
    
    if current_user["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete associated profiles
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
        if student:
            await db.students.delete_one({"user_id": user_id})
            await db.enrollments.delete_many({"student_id": student["id"]})
            await db.attendance_records.delete_many({"student_id": student["id"]})
            await db.submissions.delete_many({"student_id": student["id"]})
            await db.weekly_progress.delete_many({"student_id": student["id"]})
    elif user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user_id}, {"_id": 0})
        if teacher:
            await db.teachers.delete_one({"user_id": user_id})
            await db.courses.update_many({"teacher_id": teacher["id"]}, {"$set": {"teacher_id": None}})
    
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.post("/admin/users/create")
async def admin_create_user(request: Request):
    await require_role("admin")(request)
    body = await request.json()
    
    email = body.get("email", "").lower()
    name = body.get("name", "")
    role = body.get("role", "student")
    password = body.get("password", "")
    
    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Email, name, and password are required")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(password)
    
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "password_hash": hashed,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create profile based on role
    if role == "student":
        extra_data = body.get("student_data", {})
        student_doc = {
            "id": f"std_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "student_id": extra_data.get("student_id", f"STD{uuid.uuid4().hex[:6].upper()}"),
            "grade": extra_data.get("grade", ""),
            "section": extra_data.get("section", ""),
            "parent_contact": extra_data.get("parent_contact", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.students.insert_one(student_doc)
    elif role == "teacher":
        extra_data = body.get("teacher_data", {})
        teacher_doc = {
            "id": f"tch_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "employee_id": extra_data.get("employee_id", f"TCH{uuid.uuid4().hex[:6].upper()}"),
            "department": extra_data.get("department", ""),
            "qualification": extra_data.get("qualification", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.teachers.insert_one(teacher_doc)
    
    return {"id": user_id, "email": email, "name": name, "role": role}

# ================== SETUP WIZARD ENDPOINTS ==================

class SchoolProfileCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    principal: Optional[str] = None
    logo_url: Optional[str] = None

class AcademicTermCreate(BaseModel):
    name: str
    start_date: str
    end_date: str
    is_current: bool = False

@api_router.get("/setup/status")
async def get_setup_status(request: Request):
    await require_role("admin")(request)
    
    school = await db.school_profile.find_one({}, {"_id": 0})
    terms = await db.academic_terms.count_documents({})
    courses = await db.courses.count_documents({})
    teachers = await db.teachers.count_documents({})
    students = await db.students.count_documents({})
    
    return {
        "has_school_profile": school is not None,
        "has_academic_terms": terms > 0,
        "has_courses": courses > 0,
        "has_teachers": teachers > 0,
        "has_students": students > 0,
        "school_profile": school,
        "counts": {
            "terms": terms,
            "courses": courses,
            "teachers": teachers,
            "students": students
        }
    }

@api_router.post("/setup/school-profile")
async def create_school_profile(data: SchoolProfileCreate, request: Request):
    await require_role("admin")(request)
    
    existing = await db.school_profile.find_one({})
    
    profile_doc = {
        "name": data.name,
        "address": data.address,
        "phone": data.phone,
        "email": data.email,
        "principal": data.principal,
        "logo_url": data.logo_url,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.school_profile.update_one({}, {"$set": profile_doc})
    else:
        profile_doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.school_profile.insert_one(profile_doc)
    
    return {"message": "School profile saved"}

@api_router.get("/setup/school-profile")
async def get_school_profile(request: Request):
    await get_current_user(request)
    profile = await db.school_profile.find_one({}, {"_id": 0})
    return profile or {}

@api_router.get("/academic-terms")
async def get_academic_terms(request: Request):
    await get_current_user(request)
    terms = await db.academic_terms.find({}, {"_id": 0}).sort("start_date", -1).to_list(100)
    return terms

@api_router.post("/academic-terms")
async def create_academic_term(data: AcademicTermCreate, request: Request):
    await require_role("admin")(request)
    
    if data.is_current:
        await db.academic_terms.update_many({}, {"$set": {"is_current": False}})
    
    term_doc = {
        "id": f"term_{uuid.uuid4().hex[:8]}",
        "name": data.name,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "is_current": data.is_current,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.academic_terms.insert_one(term_doc)
    
    return {"id": term_doc["id"], "message": "Academic term created"}

@api_router.delete("/academic-terms/{term_id}")
async def delete_academic_term(term_id: str, request: Request):
    await require_role("admin")(request)
    result = await db.academic_terms.delete_one({"id": term_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Term not found")
    return {"message": "Term deleted"}

@api_router.post("/setup/bulk-import/students")
async def bulk_import_students(request: Request):
    await require_role("admin")(request)
    body = await request.json()
    students_data = body.get("students", [])
    
    created = 0
    errors = []
    
    for idx, s in enumerate(students_data):
        try:
            email = s.get("email", "").lower()
            name = s.get("name", "")
            
            if not email or not name:
                errors.append(f"Row {idx+1}: Missing email or name")
                continue
            
            existing = await db.users.find_one({"email": email})
            if existing:
                errors.append(f"Row {idx+1}: Email {email} already exists")
                continue
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            password = s.get("password", "student123")
            hashed = hash_password(password)
            
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": "student",
                "password_hash": hashed,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await db.students.insert_one({
                "id": f"std_{uuid.uuid4().hex[:8]}",
                "user_id": user_id,
                "student_id": s.get("student_id", f"STD{uuid.uuid4().hex[:6].upper()}"),
                "grade": s.get("grade", ""),
                "section": s.get("section", ""),
                "parent_contact": s.get("parent_contact", ""),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            created += 1
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")
    
    return {"created": created, "errors": errors}

@api_router.post("/setup/bulk-import/teachers")
async def bulk_import_teachers(request: Request):
    await require_role("admin")(request)
    body = await request.json()
    teachers_data = body.get("teachers", [])
    
    created = 0
    errors = []
    
    for idx, t in enumerate(teachers_data):
        try:
            email = t.get("email", "").lower()
            name = t.get("name", "")
            
            if not email or not name:
                errors.append(f"Row {idx+1}: Missing email or name")
                continue
            
            existing = await db.users.find_one({"email": email})
            if existing:
                errors.append(f"Row {idx+1}: Email {email} already exists")
                continue
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            password = t.get("password", "teacher123")
            hashed = hash_password(password)
            
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": "teacher",
                "password_hash": hashed,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            await db.teachers.insert_one({
                "id": f"tch_{uuid.uuid4().hex[:8]}",
                "user_id": user_id,
                "employee_id": t.get("employee_id", f"TCH{uuid.uuid4().hex[:6].upper()}"),
                "department": t.get("department", ""),
                "qualification": t.get("qualification", ""),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            created += 1
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")
    
    return {"created": created, "errors": errors}

@api_router.post("/setup/quick-courses")
async def quick_create_courses(request: Request):
    await require_role("admin")(request)
    body = await request.json()
    courses_data = body.get("courses", [])
    
    created = 0
    errors = []
    
    for idx, c in enumerate(courses_data):
        try:
            name = c.get("name", "")
            code = c.get("code", "")
            
            if not name or not code:
                errors.append(f"Row {idx+1}: Missing name or code")
                continue
            
            existing = await db.courses.find_one({"code": code})
            if existing:
                errors.append(f"Row {idx+1}: Course code {code} already exists")
                continue
            
            await db.courses.insert_one({
                "id": f"crs_{uuid.uuid4().hex[:8]}",
                "name": name,
                "code": code,
                "description": c.get("description", ""),
                "grade": c.get("grade", ""),
                "teacher_id": c.get("teacher_id"),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            created += 1
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")
    
    return {"created": created, "errors": errors}

@api_router.post("/setup/bulk-enroll")
async def bulk_enroll_students(request: Request):
    await require_role("admin")(request)
    body = await request.json()
    course_id = body.get("course_id")
    student_ids = body.get("student_ids", [])
    
    if not course_id or not student_ids:
        raise HTTPException(status_code=400, detail="Course ID and student IDs required")
    
    enrolled = 0
    for student_id in student_ids:
        existing = await db.enrollments.find_one({"student_id": student_id, "course_id": course_id})
        if not existing:
            await db.enrollments.insert_one({
                "id": f"enr_{uuid.uuid4().hex[:8]}",
                "student_id": student_id,
                "course_id": course_id,
                "enrolled_at": datetime.now(timezone.utc).isoformat()
            })
            enrolled += 1
    
    return {"enrolled": enrolled}

# ================== REPORTS ENDPOINTS ==================

@api_router.get("/reports/attendance")
async def attendance_report(
    request: Request,
    course_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = "json"
):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if course_id:
        query["course_id"] = course_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    # Filter for teacher's courses only
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            query["course_id"] = {"$in": course_ids}
    
    records = await db.attendance_records.find(query, {"_id": 0}).to_list(10000)
    
    # Get student and course names
    student_map = {}
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for s in students:
        user_data = await db.users.find_one({"user_id": s["user_id"]}, {"_id": 0, "password_hash": 0})
        student_map[s["id"]] = {"name": user_data["name"] if user_data else "Unknown", "student_id": s["student_id"]}
    
    course_map = {}
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    for c in courses:
        course_map[c["id"]] = c["name"]
    
    # Calculate summary
    summary = {
        "total_records": len(records),
        "present": len([r for r in records if r["status"] == "present"]),
        "absent": len([r for r in records if r["status"] == "absent"]),
        "late": len([r for r in records if r["status"] == "late"]),
        "excused": len([r for r in records if r["status"] == "excused"]),
    }
    
    # Enrich records
    enriched = []
    for r in records:
        enriched.append({
            **r,
            "student_name": student_map.get(r["student_id"], {}).get("name", "Unknown"),
            "student_code": student_map.get(r["student_id"], {}).get("student_id", ""),
            "course_name": course_map.get(r["course_id"], "Unknown")
        })
    
    return {"summary": summary, "records": enriched}

@api_router.get("/reports/assignments")
async def assignment_report(
    request: Request,
    course_id: Optional[str] = None
):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if course_id:
        query["course_id"] = course_id
    
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            query["course_id"] = {"$in": course_ids}
    
    assignments = await db.assignments.find(query, {"_id": 0}).to_list(1000)
    
    # Get course names
    course_map = {}
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    for c in courses:
        course_map[c["id"]] = c["name"]
    
    # Get submission stats per assignment
    report = []
    for a in assignments:
        submissions = await db.submissions.find({"assignment_id": a["id"]}, {"_id": 0}).to_list(1000)
        
        # Get enrolled students count
        enrollments = await db.enrollments.find({"course_id": a["course_id"]}, {"_id": 0}).to_list(1000)
        total_students = len(enrollments)
        
        report.append({
            **a,
            "course_name": course_map.get(a["course_id"], "Unknown"),
            "total_students": total_students,
            "submitted_count": len(submissions),
            "pending_count": total_students - len(submissions),
            "submission_rate": round((len(submissions) / total_students * 100) if total_students > 0 else 0, 1)
        })
    
    summary = {
        "total_assignments": len(report),
        "total_submissions": sum([r["submitted_count"] for r in report]),
        "avg_submission_rate": round(sum([r["submission_rate"] for r in report]) / len(report) if report else 0, 1)
    }
    
    return {"summary": summary, "assignments": report}

@api_router.get("/reports/progress")
async def progress_report(
    request: Request,
    course_id: Optional[str] = None,
    student_id: Optional[str] = None
):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if course_id:
        query["course_id"] = course_id
    if student_id:
        query["student_id"] = student_id
    
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            query["course_id"] = {"$in": course_ids}
    
    progress = await db.weekly_progress.find(query, {"_id": 0}).sort("week_start", -1).to_list(1000)
    
    # Get student and course names
    student_map = {}
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for s in students:
        user_data = await db.users.find_one({"user_id": s["user_id"]}, {"_id": 0, "password_hash": 0})
        student_map[s["id"]] = user_data["name"] if user_data else "Unknown"
    
    course_map = {}
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    for c in courses:
        course_map[c["id"]] = c["name"]
    
    # Calculate summary
    scores = [p["performance_score"] for p in progress if p.get("performance_score")]
    summary = {
        "total_records": len(progress),
        "avg_score": round(sum(scores) / len(scores) if scores else 0, 1),
        "highest_score": max(scores) if scores else 0,
        "lowest_score": min(scores) if scores else 0
    }
    
    # Enrich records
    enriched = []
    for p in progress:
        enriched.append({
            **p,
            "student_name": student_map.get(p["student_id"], "Unknown"),
            "course_name": course_map.get(p["course_id"], "Unknown")
        })
    
    return {"summary": summary, "records": enriched}

@api_router.get("/reports/class-summary")
async def class_summary_report(request: Request, course_id: str):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get enrolled students
    enrollments = await db.enrollments.find({"course_id": course_id}, {"_id": 0}).to_list(1000)
    student_ids = [e["student_id"] for e in enrollments]
    
    students_data = []
    for sid in student_ids:
        student = await db.students.find_one({"id": sid}, {"_id": 0})
        if not student:
            continue
        user_data = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0, "password_hash": 0})
        
        # Attendance stats
        attendance = await db.attendance_records.find({"student_id": sid, "course_id": course_id}, {"_id": 0}).to_list(1000)
        total_att = len(attendance)
        present = len([a for a in attendance if a["status"] == "present"])
        att_percentage = round((present / total_att * 100) if total_att > 0 else 0, 1)
        
        # Assignment stats
        assignments = await db.assignments.find({"course_id": course_id}, {"_id": 0}).to_list(1000)
        assignment_ids = [a["id"] for a in assignments]
        submissions = await db.submissions.find({"student_id": sid, "assignment_id": {"$in": assignment_ids}}, {"_id": 0}).to_list(1000)
        
        # Progress stats
        progress = await db.weekly_progress.find({"student_id": sid, "course_id": course_id}, {"_id": 0}).to_list(100)
        scores = [p["performance_score"] for p in progress if p.get("performance_score")]
        avg_score = round(sum(scores) / len(scores) if scores else 0, 1)
        
        students_data.append({
            "student_id": student["student_id"],
            "name": user_data["name"] if user_data else "Unknown",
            "grade": student.get("grade", ""),
            "section": student.get("section", ""),
            "attendance_percentage": att_percentage,
            "assignments_submitted": len(submissions),
            "assignments_total": len(assignments),
            "avg_progress_score": avg_score
        })
    
    # Course summary
    summary = {
        "course_name": course["name"],
        "course_code": course["code"],
        "total_students": len(students_data),
        "avg_attendance": round(sum([s["attendance_percentage"] for s in students_data]) / len(students_data) if students_data else 0, 1),
        "avg_progress_score": round(sum([s["avg_progress_score"] for s in students_data]) / len(students_data) if students_data else 0, 1)
    }
    
    return {"summary": summary, "students": students_data}

@api_router.get("/reports/student-performance/{student_id}")
async def student_performance_report(student_id: str, request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        # Allow student to view their own report
        if user["role"] == "student":
            student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
            if not student or student["id"] != student_id:
                raise HTTPException(status_code=403, detail="Access denied")
        else:
            raise HTTPException(status_code=403, detail="Access denied")
    
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    user_data = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0, "password_hash": 0})
    
    # Get enrolled courses
    enrollments = await db.enrollments.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    course_ids = [e["course_id"] for e in enrollments]
    
    courses_data = []
    for cid in course_ids:
        course = await db.courses.find_one({"id": cid}, {"_id": 0})
        if not course:
            continue
        
        # Attendance
        attendance = await db.attendance_records.find({"student_id": student_id, "course_id": cid}, {"_id": 0}).to_list(1000)
        total_att = len(attendance)
        present = len([a for a in attendance if a["status"] == "present"])
        
        # Assignments
        assignments = await db.assignments.find({"course_id": cid}, {"_id": 0}).to_list(100)
        assignment_ids = [a["id"] for a in assignments]
        submissions = await db.submissions.find({"student_id": student_id, "assignment_id": {"$in": assignment_ids}}, {"_id": 0}).to_list(100)
        
        # Progress
        progress = await db.weekly_progress.find({"student_id": student_id, "course_id": cid}, {"_id": 0}).sort("week_start", -1).to_list(10)
        scores = [p["performance_score"] for p in progress if p.get("performance_score")]
        
        courses_data.append({
            "course_id": cid,
            "course_name": course["name"],
            "course_code": course["code"],
            "attendance_percentage": round((present / total_att * 100) if total_att > 0 else 0, 1),
            "attendance_present": present,
            "attendance_total": total_att,
            "assignments_submitted": len(submissions),
            "assignments_total": len(assignments),
            "progress_scores": scores,
            "avg_progress_score": round(sum(scores) / len(scores) if scores else 0, 1)
        })
    
    # Overall summary
    all_scores = []
    for c in courses_data:
        all_scores.extend(c["progress_scores"])
    
    summary = {
        "student_id": student["student_id"],
        "name": user_data["name"] if user_data else "Unknown",
        "email": user_data["email"] if user_data else "",
        "grade": student.get("grade", ""),
        "section": student.get("section", ""),
        "total_courses": len(courses_data),
        "overall_attendance": round(sum([c["attendance_percentage"] for c in courses_data]) / len(courses_data) if courses_data else 0, 1),
        "overall_progress_score": round(sum(all_scores) / len(all_scores) if all_scores else 0, 1)
    }
    
    return {"summary": summary, "courses": courses_data}

@api_router.get("/reports/export/{report_type}")
async def export_report(report_type: str, request: Request, course_id: Optional[str] = None, format: str = "csv"):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    if report_type == "attendance":
        data = await attendance_report(request, course_id)
        records = data["records"]
        
        if format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["date", "student_name", "student_code", "course_name", "status"])
            writer.writeheader()
            for r in records:
                writer.writerow({
                    "date": r["date"],
                    "student_name": r["student_name"],
                    "student_code": r["student_code"],
                    "course_name": r["course_name"],
                    "status": r["status"]
                })
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
            )
    
    elif report_type == "assignments":
        data = await assignment_report(request, course_id)
        assignments = data["assignments"]
        
        if format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["title", "course_name", "due_date", "total_students", "submitted_count", "submission_rate"])
            writer.writeheader()
            for a in assignments:
                writer.writerow({
                    "title": a["title"],
                    "course_name": a["course_name"],
                    "due_date": a["due_date"],
                    "total_students": a["total_students"],
                    "submitted_count": a["submitted_count"],
                    "submission_rate": f"{a['submission_rate']}%"
                })
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=assignments_report.csv"}
            )
    
    elif report_type == "progress":
        data = await progress_report(request, course_id)
        records = data["records"]
        
        if format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["week_start", "student_name", "course_name", "performance_score", "remarks"])
            writer.writeheader()
            for r in records:
                writer.writerow({
                    "week_start": r["week_start"],
                    "student_name": r["student_name"],
                    "course_name": r["course_name"],
                    "performance_score": r.get("performance_score", ""),
                    "remarks": r.get("remarks", "")
                })
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=progress_report.csv"}
            )
    
    raise HTTPException(status_code=400, detail="Invalid report type or format")

# ================== STUDENT ENDPOINTS ==================

@api_router.get("/students")
async def get_students(request: Request):
    user = await get_current_user(request)
    if user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    pipeline = [
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "user_id", "as": "user"}},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "user._id": 0, "user.password_hash": 0}}
    ]
    students = await db.students.aggregate(pipeline).to_list(1000)
    return students

@api_router.get("/students/{student_id}")
async def get_student(student_id: str, request: Request):
    await get_current_user(request)
    
    pipeline = [
        {"$match": {"id": student_id}},
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "user_id", "as": "user"}},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "user._id": 0, "user.password_hash": 0}}
    ]
    students = await db.students.aggregate(pipeline).to_list(1)
    if not students:
        raise HTTPException(status_code=404, detail="Student not found")
    return students[0]

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, request: Request):
    user = await require_role("admin")(request)
    body = await request.json()
    
    update_data = {k: v for k, v in body.items() if k in ["grade", "section", "parent_contact", "address"]}
    if update_data:
        await db.students.update_one({"id": student_id}, {"$set": update_data})
    
    return {"message": "Student updated"}

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, request: Request):
    await require_role("admin")(request)
    
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.students.delete_one({"id": student_id})
    await db.users.delete_one({"user_id": student["user_id"]})
    await db.enrollments.delete_many({"student_id": student_id})
    
    return {"message": "Student deleted"}

# ================== TEACHER ENDPOINTS ==================

@api_router.get("/teachers")
async def get_teachers(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    pipeline = [
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "user_id", "as": "user"}},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "user._id": 0, "user.password_hash": 0}}
    ]
    teachers = await db.teachers.aggregate(pipeline).to_list(1000)
    return teachers

@api_router.get("/teachers/{teacher_id}")
async def get_teacher(teacher_id: str, request: Request):
    await get_current_user(request)
    
    pipeline = [
        {"$match": {"id": teacher_id}},
        {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "user_id", "as": "user"}},
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "user._id": 0, "user.password_hash": 0}}
    ]
    teachers = await db.teachers.aggregate(pipeline).to_list(1)
    if not teachers:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teachers[0]

@api_router.put("/teachers/{teacher_id}")
async def update_teacher(teacher_id: str, request: Request):
    await require_role("admin")(request)
    body = await request.json()
    
    update_data = {k: v for k, v in body.items() if k in ["department", "qualification", "phone"]}
    if update_data:
        await db.teachers.update_one({"id": teacher_id}, {"$set": update_data})
    
    return {"message": "Teacher updated"}

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, request: Request):
    await require_role("admin")(request)
    
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    await db.teachers.delete_one({"id": teacher_id})
    await db.users.delete_one({"user_id": teacher["user_id"]})
    await db.courses.update_many({"teacher_id": teacher_id}, {"$set": {"teacher_id": None}})
    
    return {"message": "Teacher deleted"}

# ================== COURSE ENDPOINTS ==================

@api_router.get("/courses")
async def get_courses(request: Request):
    user = await get_current_user(request)
    
    pipeline = [
        {"$lookup": {"from": "teachers", "localField": "teacher_id", "foreignField": "id", "as": "teacher"}},
        {"$unwind": {"path": "$teacher", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "users", "localField": "teacher.user_id", "foreignField": "user_id", "as": "teacher_user"}},
        {"$unwind": {"path": "$teacher_user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "teacher._id": 0, "teacher_user._id": 0, "teacher_user.password_hash": 0}}
    ]
    
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            pipeline.insert(0, {"$match": {"teacher_id": teacher["id"]}})
    elif user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if student:
            enrollments = await db.enrollments.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [e["course_id"] for e in enrollments]
            pipeline.insert(0, {"$match": {"id": {"$in": course_ids}}})
    
    courses = await db.courses.aggregate(pipeline).to_list(1000)
    return courses

@api_router.post("/courses")
async def create_course(data: CourseCreate, request: Request):
    await require_role("admin")(request)
    
    existing = await db.courses.find_one({"code": data.code})
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    course_doc = {
        "id": f"crs_{uuid.uuid4().hex[:8]}",
        "name": data.name,
        "code": data.code,
        "description": data.description,
        "grade": data.grade,
        "teacher_id": data.teacher_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.courses.insert_one(course_doc)
    
    return {"id": course_doc["id"], "message": "Course created"}

@api_router.get("/courses/{course_id}")
async def get_course(course_id: str, request: Request):
    await get_current_user(request)
    
    pipeline = [
        {"$match": {"id": course_id}},
        {"$lookup": {"from": "teachers", "localField": "teacher_id", "foreignField": "id", "as": "teacher"}},
        {"$unwind": {"path": "$teacher", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "users", "localField": "teacher.user_id", "foreignField": "user_id", "as": "teacher_user"}},
        {"$unwind": {"path": "$teacher_user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "teacher._id": 0, "teacher_user._id": 0, "teacher_user.password_hash": 0}}
    ]
    courses = await db.courses.aggregate(pipeline).to_list(1)
    if not courses:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses[0]

@api_router.put("/courses/{course_id}")
async def update_course(course_id: str, request: Request):
    await require_role("admin")(request)
    body = await request.json()
    
    update_data = {k: v for k, v in body.items() if k in ["name", "description", "grade", "teacher_id"]}
    if update_data:
        await db.courses.update_one({"id": course_id}, {"$set": update_data})
    
    return {"message": "Course updated"}

@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str, request: Request):
    await require_role("admin")(request)
    
    await db.courses.delete_one({"id": course_id})
    await db.enrollments.delete_many({"course_id": course_id})
    await db.assignments.delete_many({"course_id": course_id})
    await db.attendance_records.delete_many({"course_id": course_id})
    
    return {"message": "Course deleted"}

# ================== ENROLLMENT ENDPOINTS ==================

@api_router.get("/enrollments")
async def get_enrollments(request: Request, course_id: Optional[str] = None, student_id: Optional[str] = None):
    await get_current_user(request)
    
    query = {}
    if course_id:
        query["course_id"] = course_id
    if student_id:
        query["student_id"] = student_id
    
    enrollments = await db.enrollments.find(query, {"_id": 0}).to_list(1000)
    return enrollments

@api_router.post("/enrollments")
async def create_enrollment(data: EnrollmentCreate, request: Request):
    await require_role("admin")(request)
    
    existing = await db.enrollments.find_one({"student_id": data.student_id, "course_id": data.course_id})
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")
    
    enrollment_doc = {
        "id": f"enr_{uuid.uuid4().hex[:8]}",
        "student_id": data.student_id,
        "course_id": data.course_id,
        "enrolled_at": datetime.now(timezone.utc).isoformat()
    }
    await db.enrollments.insert_one(enrollment_doc)
    
    return {"id": enrollment_doc["id"], "message": "Enrollment created"}

@api_router.delete("/enrollments/{enrollment_id}")
async def delete_enrollment(enrollment_id: str, request: Request):
    await require_role("admin")(request)
    
    result = await db.enrollments.delete_one({"id": enrollment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    return {"message": "Enrollment deleted"}

# ================== ATTENDANCE ENDPOINTS ==================

@api_router.get("/attendance")
async def get_attendance(
    request: Request,
    course_id: Optional[str] = None,
    student_id: Optional[str] = None,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    user = await get_current_user(request)
    
    query = {}
    if course_id:
        query["course_id"] = course_id
    if student_id:
        query["student_id"] = student_id
    if date:
        query["date"] = date
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    # Filter by role
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if student:
            query["student_id"] = student["id"]
    elif user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            query["course_id"] = {"$in": course_ids}
    
    records = await db.attendance_records.find(query, {"_id": 0}).to_list(10000)
    return records

@api_router.post("/attendance")
async def create_attendance(data: AttendanceCreate, request: Request):
    user = await require_role("admin", "teacher")(request)
    
    # Check if teacher owns the course
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        course = await db.courses.find_one({"id": data.course_id}, {"_id": 0})
        if not course or course.get("teacher_id") != teacher.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Update or create attendance record
    existing = await db.attendance_records.find_one({
        "student_id": data.student_id,
        "course_id": data.course_id,
        "date": data.date
    })
    
    if existing:
        await db.attendance_records.update_one(
            {"id": existing["id"]},
            {"$set": {"status": data.status}}
        )
        return {"id": existing["id"], "message": "Attendance updated"}
    
    record_doc = {
        "id": f"att_{uuid.uuid4().hex[:8]}",
        "student_id": data.student_id,
        "course_id": data.course_id,
        "date": data.date,
        "status": data.status,
        "marked_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.attendance_records.insert_one(record_doc)
    
    return {"id": record_doc["id"], "message": "Attendance recorded"}

@api_router.post("/attendance/bulk")
async def create_bulk_attendance(data: AttendanceBulkCreate, request: Request):
    user = await require_role("admin", "teacher")(request)
    
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        course = await db.courses.find_one({"id": data.course_id}, {"_id": 0})
        if not course or course.get("teacher_id") != teacher.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    for record in data.records:
        existing = await db.attendance_records.find_one({
            "student_id": record["student_id"],
            "course_id": data.course_id,
            "date": data.date
        })
        
        if existing:
            await db.attendance_records.update_one(
                {"id": existing["id"]},
                {"$set": {"status": record["status"]}}
            )
        else:
            record_doc = {
                "id": f"att_{uuid.uuid4().hex[:8]}",
                "student_id": record["student_id"],
                "course_id": data.course_id,
                "date": data.date,
                "status": record["status"],
                "marked_by": user["user_id"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.attendance_records.insert_one(record_doc)
    
    return {"message": "Bulk attendance recorded"}

# ================== ASSIGNMENT ENDPOINTS ==================

@api_router.get("/assignments")
async def get_assignments(request: Request, course_id: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if course_id:
        query["course_id"] = course_id
    
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if student:
            enrollments = await db.enrollments.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [e["course_id"] for e in enrollments]
            query["course_id"] = {"$in": course_ids}
    elif user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            query["course_id"] = {"$in": course_ids}
    
    pipeline = [
        {"$match": query},
        {"$lookup": {"from": "courses", "localField": "course_id", "foreignField": "id", "as": "course"}},
        {"$unwind": {"path": "$course", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "course._id": 0}}
    ]
    
    assignments = await db.assignments.aggregate(pipeline).to_list(1000)
    return assignments

@api_router.post("/assignments")
async def create_assignment(data: AssignmentCreate, request: Request):
    user = await require_role("admin", "teacher")(request)
    
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        course = await db.courses.find_one({"id": data.course_id}, {"_id": 0})
        if not course or course.get("teacher_id") != teacher.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    assignment_doc = {
        "id": f"asg_{uuid.uuid4().hex[:8]}",
        "course_id": data.course_id,
        "title": data.title,
        "description": data.description,
        "due_date": data.due_date,
        "max_score": data.max_score,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.assignments.insert_one(assignment_doc)
    
    return {"id": assignment_doc["id"], "message": "Assignment created"}

@api_router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: str, request: Request):
    await get_current_user(request)
    
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@api_router.put("/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, request: Request):
    user = await require_role("admin", "teacher")(request)
    body = await request.json()
    
    update_data = {k: v for k, v in body.items() if k in ["title", "description", "due_date", "max_score"]}
    if update_data:
        await db.assignments.update_one({"id": assignment_id}, {"$set": update_data})
    
    return {"message": "Assignment updated"}

@api_router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str, request: Request):
    await require_role("admin", "teacher")(request)
    
    await db.assignments.delete_one({"id": assignment_id})
    await db.submissions.delete_many({"assignment_id": assignment_id})
    
    return {"message": "Assignment deleted"}

# ================== SUBMISSION ENDPOINTS ==================

@api_router.get("/submissions")
async def get_submissions(request: Request, assignment_id: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if assignment_id:
        query["assignment_id"] = assignment_id
    
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if student:
            query["student_id"] = student["id"]
    elif user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            assignments = await db.assignments.find({"course_id": {"$in": course_ids}}, {"_id": 0}).to_list(1000)
            assignment_ids = [a["id"] for a in assignments]
            query["assignment_id"] = {"$in": assignment_ids}
    
    pipeline = [
        {"$match": query},
        {"$lookup": {"from": "students", "localField": "student_id", "foreignField": "id", "as": "student"}},
        {"$unwind": {"path": "$student", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "users", "localField": "student.user_id", "foreignField": "user_id", "as": "student_user"}},
        {"$unwind": {"path": "$student_user", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "student._id": 0, "student_user._id": 0, "student_user.password_hash": 0}}
    ]
    
    submissions = await db.submissions.aggregate(pipeline).to_list(1000)
    return submissions

@api_router.post("/submissions")
async def create_submission(data: SubmissionCreate, request: Request):
    user = await get_current_user(request)
    
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit")
    
    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    assignment = await db.assignments.find_one({"id": data.assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check existing submission
    existing = await db.submissions.find_one({
        "assignment_id": data.assignment_id,
        "student_id": student["id"]
    })
    
    if existing:
        # Update existing submission
        await db.submissions.update_one(
            {"id": existing["id"]},
            {"$set": {
                "file_path": data.file_path,
                "file_name": data.file_name,
                "notes": data.notes,
                "submitted_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"id": existing["id"], "message": "Submission updated"}
    
    submission_doc = {
        "id": f"sub_{uuid.uuid4().hex[:8]}",
        "assignment_id": data.assignment_id,
        "student_id": student["id"],
        "file_path": data.file_path,
        "file_name": data.file_name,
        "notes": data.notes,
        "status": "submitted",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(submission_doc)
    
    return {"id": submission_doc["id"], "message": "Submission created"}

@api_router.post("/submissions/upload")
async def upload_submission_file(
    request: Request,
    file: UploadFile = File(...)
):
    user = await get_current_user(request)
    
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can upload")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/submissions/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    return {"path": result["path"], "filename": file.filename}

@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request, auth: str = Query(None)):
    # Verify authentication
    try:
        if auth:
            # Handle query param auth for direct file access
            request.cookies["access_token"] = auth
        await get_current_user(request)
    except:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")

# ================== WEEKLY PROGRESS ENDPOINTS ==================

@api_router.get("/progress")
async def get_progress(
    request: Request,
    student_id: Optional[str] = None,
    course_id: Optional[str] = None
):
    user = await get_current_user(request)
    
    query = {}
    if student_id:
        query["student_id"] = student_id
    if course_id:
        query["course_id"] = course_id
    
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if student:
            query["student_id"] = student["id"]
    elif user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if teacher:
            courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [c["id"] for c in courses]
            query["course_id"] = {"$in": course_ids}
    
    pipeline = [
        {"$match": query},
        {"$lookup": {"from": "students", "localField": "student_id", "foreignField": "id", "as": "student"}},
        {"$unwind": {"path": "$student", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "users", "localField": "student.user_id", "foreignField": "user_id", "as": "student_user"}},
        {"$unwind": {"path": "$student_user", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "courses", "localField": "course_id", "foreignField": "id", "as": "course"}},
        {"$unwind": {"path": "$course", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "student._id": 0, "student_user._id": 0, "student_user.password_hash": 0, "course._id": 0}},
        {"$sort": {"week_start": -1}}
    ]
    
    progress = await db.weekly_progress.aggregate(pipeline).to_list(1000)
    return progress

@api_router.post("/progress")
async def create_progress(data: WeeklyProgressCreate, request: Request):
    user = await require_role("admin", "teacher")(request)
    
    if user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
        course = await db.courses.find_one({"id": data.course_id}, {"_id": 0})
        if not course or course.get("teacher_id") != teacher.get("id"):
            raise HTTPException(status_code=403, detail="Not authorized for this course")
    
    # Check for existing progress entry
    existing = await db.weekly_progress.find_one({
        "student_id": data.student_id,
        "course_id": data.course_id,
        "week_start": data.week_start
    })
    
    if existing:
        await db.weekly_progress.update_one(
            {"id": existing["id"]},
            {"$set": {"remarks": data.remarks, "performance_score": data.performance_score}}
        )
        return {"id": existing["id"], "message": "Progress updated"}
    
    progress_doc = {
        "id": f"prg_{uuid.uuid4().hex[:8]}",
        "student_id": data.student_id,
        "course_id": data.course_id,
        "week_start": data.week_start,
        "remarks": data.remarks,
        "performance_score": data.performance_score,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.weekly_progress.insert_one(progress_doc)
    
    return {"id": progress_doc["id"], "message": "Progress recorded"}

# ================== ANNOUNCEMENT ENDPOINTS ==================

@api_router.get("/announcements")
async def get_announcements(request: Request):
    user = await get_current_user(request)
    
    query = {"$or": [{"target_role": "all"}, {"target_role": user["role"]}]}
    
    if user["role"] == "student":
        student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if student:
            enrollments = await db.enrollments.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
            course_ids = [e["course_id"] for e in enrollments]
            query = {"$or": [
                {"target_role": "all", "course_id": None},
                {"target_role": "student", "course_id": None},
                {"course_id": {"$in": course_ids}}
            ]}
    
    announcements = await db.announcements.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return announcements

@api_router.post("/announcements")
async def create_announcement(data: AnnouncementCreate, request: Request):
    await require_role("admin", "teacher")(request)
    user = await get_current_user(request)
    
    announcement_doc = {
        "id": f"ann_{uuid.uuid4().hex[:8]}",
        "title": data.title,
        "content": data.content,
        "target_role": data.target_role,
        "course_id": data.course_id,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.announcements.insert_one(announcement_doc)
    
    return {"id": announcement_doc["id"], "message": "Announcement created"}

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, request: Request):
    await require_role("admin")(request)
    
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return {"message": "Announcement deleted"}

# ================== DASHBOARD STATS ==================

@api_router.get("/stats/admin")
async def get_admin_stats(request: Request):
    await require_role("admin")(request)
    
    total_students = await db.students.count_documents({})
    total_teachers = await db.teachers.count_documents({})
    total_courses = await db.courses.count_documents({})
    total_assignments = await db.assignments.count_documents({})
    
    # Attendance stats for today
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_attendance = await db.attendance_records.find({"date": today}, {"_id": 0}).to_list(10000)
    present_count = len([a for a in today_attendance if a["status"] == "present"])
    absent_count = len([a for a in today_attendance if a["status"] == "absent"])
    
    # Pending submissions
    pending_submissions = await db.submissions.count_documents({"status": "submitted"})
    
    # Weekly progress stats
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    weekly_progress_count = await db.weekly_progress.count_documents({"week_start": {"$gte": week_start}})
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "total_assignments": total_assignments,
        "today_present": present_count,
        "today_absent": absent_count,
        "pending_submissions": pending_submissions,
        "weekly_progress_count": weekly_progress_count
    }

@api_router.get("/stats/teacher")
async def get_teacher_stats(request: Request):
    user = await require_role("teacher")(request)
    
    teacher = await db.teachers.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    courses = await db.courses.find({"teacher_id": teacher["id"]}, {"_id": 0}).to_list(1000)
    course_ids = [c["id"] for c in courses]
    
    total_courses = len(courses)
    
    # Get enrolled students count
    enrollments = await db.enrollments.find({"course_id": {"$in": course_ids}}, {"_id": 0}).to_list(10000)
    student_ids = list(set([e["student_id"] for e in enrollments]))
    total_students = len(student_ids)
    
    # Today's attendance
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_attendance = await db.attendance_records.find({
        "course_id": {"$in": course_ids},
        "date": today
    }, {"_id": 0}).to_list(10000)
    
    # Active assignments
    active_assignments = await db.assignments.count_documents({
        "course_id": {"$in": course_ids},
        "due_date": {"$gte": today}
    })
    
    # Pending submissions
    assignments = await db.assignments.find({"course_id": {"$in": course_ids}}, {"_id": 0}).to_list(1000)
    assignment_ids = [a["id"] for a in assignments]
    pending_submissions = await db.submissions.count_documents({
        "assignment_id": {"$in": assignment_ids},
        "status": "submitted"
    })
    
    return {
        "total_courses": total_courses,
        "total_students": total_students,
        "today_attendance_count": len(today_attendance),
        "active_assignments": active_assignments,
        "pending_submissions": pending_submissions,
        "courses": courses
    }

@api_router.get("/stats/student")
async def get_student_stats(request: Request):
    user = await get_current_user(request)
    
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Access denied")
    
    student = await db.students.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    # Get enrolled courses
    enrollments = await db.enrollments.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
    course_ids = [e["course_id"] for e in enrollments]
    total_courses = len(course_ids)
    
    # Attendance stats
    attendance = await db.attendance_records.find({"student_id": student["id"]}, {"_id": 0}).to_list(10000)
    total_attendance = len(attendance)
    present_count = len([a for a in attendance if a["status"] == "present"])
    attendance_percentage = round((present_count / total_attendance * 100) if total_attendance > 0 else 0, 1)
    
    # Pending assignments
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assignments = await db.assignments.find({
        "course_id": {"$in": course_ids},
        "due_date": {"$gte": today}
    }, {"_id": 0}).to_list(1000)
    
    submissions = await db.submissions.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
    submitted_ids = [s["assignment_id"] for s in submissions]
    pending_assignments = len([a for a in assignments if a["id"] not in submitted_ids])
    
    # Recent progress
    recent_progress = await db.weekly_progress.find(
        {"student_id": student["id"]},
        {"_id": 0}
    ).sort("week_start", -1).to_list(5)
    
    return {
        "total_courses": total_courses,
        "attendance_percentage": attendance_percentage,
        "pending_assignments": pending_assignments,
        "recent_progress": recent_progress,
        "student": student
    }

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('CORS_ORIGINS', '*'))
origins = frontend_url.split(',') if ',' in frontend_url else [frontend_url]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins if origins != ['*'] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.students.create_index("user_id")
    await db.students.create_index("id", unique=True)
    await db.teachers.create_index("user_id")
    await db.teachers.create_index("id", unique=True)
    await db.courses.create_index("id", unique=True)
    await db.courses.create_index("code", unique=True)
    await db.enrollments.create_index([("student_id", 1), ("course_id", 1)], unique=True)
    await db.attendance_records.create_index([("student_id", 1), ("course_id", 1), ("date", 1)])
    await db.assignments.create_index("id", unique=True)
    await db.submissions.create_index([("assignment_id", 1), ("student_id", 1)])
    await db.weekly_progress.create_index([("student_id", 1), ("course_id", 1), ("week_start", 1)])
    await db.login_attempts.create_index("identifier")
    await db.user_sessions.create_index("user_id")
    
    # Initialize storage
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@school.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "name": "Admin",
            "role": "admin",
            "password_hash": hashed,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated")
    
    # Create test credentials file
    try:
        Path("/app/memory").mkdir(parents=True, exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user
- POST /api/auth/session - Google OAuth session
""")
    except Exception as e:
        logger.error(f"Failed to write test credentials: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
