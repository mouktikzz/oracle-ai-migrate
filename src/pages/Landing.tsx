import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  FileText, 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  ArrowRight, 
  History, 
  HelpCircle,
  Bot,
  BarChart3,
  Settings,
  Eye,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Code,
  MessageSquare,
  Cpu,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Help from '@/components/Help';
import UserDropdown from '@/components/UserDropdown';
import { ChatbotToggle } from '@/components/ChatbotToggle';

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showHelp, setShowHelp] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate('/migration');
    } else {
      navigate('/auth');
    }
  };

  const handleGoToHistory = () => {
    if (user) {
      navigate('/history', { state: { fromLanding: true } });
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-gray-900">Sybase to Oracle Migration</h1>
            </div>
            <div className="flex items-center space-x-3">
              {user && <ChatbotToggle variant="header" isVisible={true} isCollapsed={false} />}
              {user ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGoToHistory}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowHelp(true)}
                    className="flex items-center gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </Button>
                  <UserDropdown />
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Migrate Your Sybase Database to Oracle with{' '}
              <span className="text-primary">AI-Powered Precision</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform your legacy Sybase applications to modern Oracle infrastructure 
              with intelligent code conversion, automated testing, performance optimization, and seamless deployment.
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="text-lg px-8 py-4"
              >
                Start Migration
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced Migration Platform Features
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools for enterprise-grade database migration with AI assistance and performance optimization
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Cpu className="h-8 w-8 text-primary" />
                  <CardTitle>AI-Powered Conversion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Advanced AI models automatically convert Sybase SQL to Oracle PL/SQL 
                  with high accuracy, intelligent error detection, and performance optimization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bot className="h-8 w-8 text-primary" />
                  <CardTitle>AI Chatbot Assistant</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Intelligent chatbot provides real-time guidance, answers questions, 
                  and helps troubleshoot conversion issues throughout the migration process.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <CardTitle>Performance Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Comprehensive performance analysis with code complexity reduction, 
                  execution time optimization, and scalability scoring for converted code.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Eye className="h-8 w-8 text-primary" />
                  <CardTitle>Dev Review System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Collaborative review workflow with issue tracking, 
                  manual fixes, and approval processes for quality assurance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Settings className="h-8 w-8 text-primary" />
                  <CardTitle>Admin Panel</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Comprehensive admin dashboard for user management, system monitoring, 
                  migration statistics, and platform configuration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-primary" />
                  <CardTitle>Smart Caching</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Intelligent caching system reduces conversion time and costs 
                  while maintaining high accuracy for repeated conversions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle>Comprehensive Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Detailed reports on data type mappings, performance improvements, 
                  potential issues with suggested fixes, and conversion statistics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <CardTitle>Enterprise Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Enterprise-grade security with user isolation, encrypted data handling, 
                  comprehensive audit trails, and role-based access control.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <CardTitle>Faster Migration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Reduce migration time from months to weeks with automated conversion, 
                  intelligent code optimization, and streamlined workflows.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle>Team Collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Multi-user support with project sharing, version control, 
                  collaborative review processes, and team management features.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-primary" />
                  <CardTitle>Direct Deployment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Seamless deployment to Oracle databases with automated testing, 
                  rollback capabilities, and deployment logging.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <CardTitle>Comment System</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Built-in commenting system for code review, collaboration, 
                  and documentation of conversion decisions and changes.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Migration Success Metrics
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Proven results from our AI-powered migration platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-12 w-12 text-green-600" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">95%</h4>
              <p className="text-gray-600">Conversion Accuracy</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">80%</h4>
              <p className="text-gray-600">Time Reduction</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Code className="h-12 w-12 text-purple-600" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">60%</h4>
              <p className="text-gray-600">Code Optimization</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">99.9%</h4>
              <p className="text-gray-600">Uptime Reliability</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Database?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of developers who have successfully migrated to Oracle with our AI-powered platform
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-4"
          >
            Start Your Migration Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-gray-500 text-sm border-t bg-white/80 mt-8">
        © 2025 Migration Platform. All rights reserved. Developed by CosmoAgents | <a href="https://www.github.com/steezyneo/oracle-ai-migrate" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>GitHub</a>
      </footer>
    </div>
  );
};

export default Landing;
