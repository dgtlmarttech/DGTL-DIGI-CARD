'use client'
import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Settings,
  Users,
  Clock,
  Activity,
  Loader2,
  TestTube,
  Zap,
  FileText,
  User,
  AtSign,
  Crown
} from 'lucide-react';

const MailerControl = () => {
  const [testMail, setTestMail] = useState({
    to: '',
    userName: '',
    type: 'premium_2_days_before_discount'
  });
  
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isMailerLoading, setIsMailerLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [mailerResult, setMailerResult] = useState(null);

  // Email template types
  const templateTypes = [
    { value: 'premium_2_days_before_discount', label: 'Premium - 2 Days Before (Discount)', category: 'Premium' },
    { value: 'premium_2_days_after_discount', label: 'Premium - 2 Days After (Discount)', category: 'Premium' },
    { value: 'premium_10_days_after_discount', label: 'Premium - 10 Days After (Discount)', category: 'Premium' },
    { value: 'premium_10_days_before_discount', label: 'Premium - 10 Days Before (Discount)', category: 'Premium' }
  ];

  const handleTestMailChange = (field, value) => {
    setTestMail(prev => ({ ...prev, [field]: value }));
  };

  const handleSendTestMail = async () => {
    setIsTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-mailer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMail),
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.success ? 'Test email sent successfully!' : result.error,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to send test email: ' + error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleActivateMailer = async () => {
    setIsMailerLoading(true);
    setMailerResult(null);

    try {
      const response = await fetch('/api/mailer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      setMailerResult({
        success: result.success,
        message: result.success 
          ? `Mailer activated successfully! ${result.emailsSent} emails sent.`
          : result.error,
        emailsSent: result.emailsSent || 0,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      setMailerResult({
        success: false,
        message: 'Failed to activate mailer: ' + error.message,
        emailsSent: 0,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsMailerLoading(false);
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const ResultCard = ({ result, icon: Icon, title }) => {
    if (!result) return null;

    return (
      <div className={`p-4 rounded-lg border-2 ${
        result.success 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            result.success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Icon className={`w-4 h-4 ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {title} {result.success ? 'Success' : 'Error'}
            </h4>
            <p className={`mt-1 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </p>
            {result.emailsSent !== undefined && (
              <p className="text-sm text-gray-600 mt-2">
                Emails processed: {result.emailsSent}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {result.timestamp}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Control Center</h1>
              <p className="text-gray-600">Test email templates and manage automated campaigns</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Mail Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TestTube className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Send Test Email</h2>
            </div>

            <div className="space-y-6 text-black">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={testMail.to}
                    onChange={(e) => handleTestMailChange('to', e.target.value)}
                    placeholder="test@example.com"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {testMail.to && !isValidEmail(testMail.to) && (
                  <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
                )}
              </div>

              {/* User Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Name (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={testMail.userName}
                    onChange={(e) => handleTestMailChange('userName', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Template Type Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template Type *
                </label>
                <div className="relative">
                  <select
                    value={testMail.type}
                    onChange={(e) => handleTestMailChange('type', e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                  >
                    {templateTypes.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Send Test Button */}
              <button
                onClick={handleSendTestMail}
                disabled={isTestLoading || !testMail.to || !isValidEmail(testMail.to)}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {isTestLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>

              {/* Test Result */}
              <ResultCard 
                result={testResult} 
                icon={testResult?.success ? CheckCircle2 : XCircle}
                title="Test Email"
              />
            </div>
          </div>

          {/* Mailer Activation Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Activate Mailer</h2>
            </div>

            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Automated Email Campaign</h3>
                    <p className="text-blue-800 mb-4">
                      This will manually trigger the automated mailer system to send scheduled emails based on user premium statuses.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                      <li>Premium renewal reminders (2 days before, 2 days after, 10 days after)</li>
                      <li>Discount offers for eligible users</li>
                      <li>Duplicate prevention - won't send the same email twice</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mailer Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Target Users</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Auto-detected</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Last Run</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Manual trigger only</p>
                </div>
              </div>

              {/* Activate Button */}
              <button
                onClick={handleActivateMailer}
                disabled={isMailerLoading}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {isMailerLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Activate Mailer</span>
                  </>
                )}
              </button>

              {/* Mailer Result */}
              <ResultCard 
                result={mailerResult} 
                icon={mailerResult?.success ? CheckCircle2 : XCircle}
                title="Mailer Activation"
              />
            </div>
          </div>
        </div>

        {/* Email Templates Reference */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Available Email Templates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* Trial templates section removed */}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Crown className="w-5 h-5 text-purple-600" />
                <span>Premium Templates</span>
              </h3>
              <div className="space-y-2">
                {templateTypes.filter(t => t.category === 'Premium').map((template) => (
                  <div key={template.value} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-900">{template.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailerControl;
