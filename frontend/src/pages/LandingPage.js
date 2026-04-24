import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Users, BookOpen, BarChart3, Calendar, FileText, AlertCircle,
  CheckCircle, Zap, Globe, ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Complete User Management',
      description: 'Manage students, teachers, and admin accounts with role-based access control'
    },
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create, organize, and manage courses with detailed curriculum tracking'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Automated timetable management with Google Calendar integration'
    },
    {
      icon: FileText,
      title: 'Assignment Tracking',
      description: 'Create assignments, collect submissions, and grade with file uploads'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Track student performance with comprehensive reports and insights'
    },
    {
      icon: AlertCircle,
      title: 'Attendance System',
      description: 'Mark attendance, generate reports, and monitor attendance patterns'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '500+' },
    { label: 'Courses', value: '50+' },
    { label: 'Students', value: '2000+' },
    { label: 'Teachers', value: '100+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SchoolHub</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-gray-700"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Modern <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">School Management</span> System
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your educational institution with our comprehensive management solution. Built for admins, teachers, and students.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg"
              >
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-6 text-lg"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl transform rotate-3"></div>
            <div className="relative bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-gray-700">Intuitive Dashboard</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700">Role-Based Access</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-gray-700">Real-Time Updates</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700">Mobile Responsive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-indigo-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600">Everything you need to manage your school efficiently</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-16 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your account and set up your school profile' },
              { step: '2', title: 'Configure', description: 'Add students, teachers, and courses to your system' },
              { step: '3', title: 'Manage', description: 'Start managing attendance, assignments, and grades' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your School?</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join hundreds of schools already using SchoolHub to streamline their operations.
          </p>
          <Button
            onClick={() => navigate('/register')}
            className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-6 text-lg font-semibold"
          >
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg"></div>
              <span className="font-semibold text-white">SchoolHub</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2024 SchoolHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
