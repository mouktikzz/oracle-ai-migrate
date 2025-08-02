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
       <section className="h-screen flex items-center justify-center px-4 relative">
         {/* Subtle background pattern */}
         <div className="absolute inset-0 opacity-5">
           <div className="absolute inset-0" style={{
             backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px),
                               radial-gradient(circle at 75% 75%, #8b5cf6 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}></div>
         </div>
         
         {/* Floating icons */}
         <div className="absolute inset-0 pointer-events-none">
           <Database className="absolute top-32 left-20 text-primary/20 w-12 h-12 animate-pulse" />
           <Code className="absolute top-40 right-32 text-blue-500/20 w-10 h-10 animate-bounce" />
           <Bot className="absolute bottom-40 left-32 text-purple-500/20 w-8 h-8 animate-pulse" />
           <BarChart3 className="absolute bottom-32 right-20 text-green-500/20 w-10 h-10 animate-bounce" />
         </div>
         
         <div className="container mx-auto text-center relative z-10">
           <div className="max-w-4xl mx-auto">
             {/* Badge */}
             <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
               <Zap className="w-4 h-4" />
               AI-Powered Migration Platform
             </div>
             
             <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
               Migrate Your Sybase Database to Oracle with{' '}
               <span className="text-primary">AI-Powered Precision</span>
             </h2>
             <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
               Transform your legacy Sybase applications to modern Oracle infrastructure 
               with intelligent code conversion, performance optimization, and seamless deployment.
             </p>
             
             {/* Feature highlights */}
             <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-gray-600">
               <div className="flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-green-500" />
                 <span>95% Conversion Accuracy</span>
               </div>
               <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4 text-blue-500" />
                 <span>80% Time Reduction</span>
               </div>
               <div className="flex items-center gap-2">
                 <Shield className="w-4 h-4 text-purple-500" />
                 <span>Enterprise Security</span>
               </div>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button 
                 onClick={handleGetStarted}
                 size="lg" 
                 className="text-lg px-8 py-4"
               >
                 Start Migration
                 <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
               <Button 
                 variant="outline"
                 size="lg" 
                 className="text-lg px-8 py-4"
                 onClick={() => setShowHelp(true)}
               >
                 Learn More
                 <HelpCircle className="ml-2 h-5 w-5" />
               </Button>
             </div>
           </div>
         </div>
       </section>

      {/* Features Section */}
      <section className="py-8 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
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
                   <Shield className="h-8 w-8 text-primary" />
                   <CardTitle>Security</CardTitle>
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
