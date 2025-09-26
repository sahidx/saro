import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  LogOut, 
  GraduationCap, 
  Moon, 
  Sun,
  ArrowLeft,
  FlaskConical,
  Monitor
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { ResponsiveIconGrid, getStudentIcons } from '@/components/ResponsiveIconGrid';
import { useDeviceRatio } from '@/hooks/useDeviceRatio';
import { useLocation } from 'wouter';

export default function StudentHome() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const deviceRatio = useDeviceRatio();
  const [, setLocation] = useLocation();

  const { logout } = useAuth();
  
  // Fetch student's batch information including subject
  const { data: batchData, isLoading: batchLoading } = useQuery<{
    batch: {
      id: string;
      name: string;
      subject: 'chemistry' | 'ict';
      batchCode: string;
      classTime: string;
      classDays: string;
    } | null;
    subject: 'chemistry' | 'ict' | null;
    message?: string;
  }>({
    queryKey: ['/api/student/batch'],
    enabled: !!user && (user as any)?.role === 'student',
  });

  // Fetch student's recent exam results
  const { data: recentResults = [] } = useQuery<any[]>({
    queryKey: [`/api/student/recent-results?userId=${(user as any)?.id}`],
    enabled: !!(user as any)?.id,
  });
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get subject display info
  const getSubjectInfo = () => {
    if (batchLoading) return { name: 'লোড হচ্ছে...', icon: GraduationCap };
    
    if (!batchData?.subject) {
      return { name: 'Chemistry & ICT Care', icon: GraduationCap };
    }

    switch (batchData.subject) {
      case 'chemistry':
        return { name: 'রসায়ন বিভাগ', icon: FlaskConical };
      case 'ict':
        return { name: 'ICT বিভাগ', icon: Monitor };
      default:
        return { name: 'Chemistry & ICT Care', icon: GraduationCap };
    }
  };

  const subjectInfo = getSubjectInfo();

  return (
    <MobileWrapper>
      <div className={`min-h-screen ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
      } transition-colors duration-300`}>
        
        {/* Header */}
        <header className={`sticky top-0 z-50 force-mobile-header ${isDarkMode 
          ? 'bg-slate-800/95 backdrop-blur-sm border-b border-emerald-400/30' 
          : 'bg-white/95 backdrop-blur-sm border-b border-emerald-200 shadow-sm'
        }`}>
          <div className="mobile-header-content force-mobile-padding px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' 
                  : batchData?.subject === 'chemistry' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : batchData?.subject === 'ict'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    : 'bg-gradient-to-r from-orange-500 to-red-400'
                } shadow-lg`}>
                  {React.createElement(subjectInfo.icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {(user as any)?.firstName || 'Student'} ছাত্র/ছাত্রী
                  </h1>
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : batchData?.subject === 'chemistry' ? 'text-green-600' : batchData?.subject === 'ict' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {subjectInfo.name}
                    </p>
                    {batchData?.batch && (
                      <Badge variant="outline" className={`text-xs ${isDarkMode ? 'border-emerald-400 text-emerald-400' : 'border-gray-300 text-gray-600'}`} data-testid="batch-info">
                        {batchData.batch.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mobile-emergency-override">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`responsive-button w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-yellow-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  data-testid="theme-toggle"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-red-400' 
                    : 'hover:bg-gray-100 text-red-600'
                  }`}
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="force-mobile-layout px-3 py-4">
          {/* All Features Grid - Full Page Display */}
          <div className={`mb-6 p-4 rounded-2xl ${isDarkMode 
            ? 'bg-slate-800/50 border border-emerald-400/30' 
            : 'bg-white border border-emerald-200 shadow-lg'
          }`}>
            <div className="mb-3">
              <h2 className={`text-lg font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                সকল ফিচার
              </h2>
              <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                যেকোনো ফিচারে ক্লিক করুন
              </p>
            </div>
            <ResponsiveIconGrid 
              items={getStudentIcons(setLocation)}
              isDarkMode={isDarkMode}
              activeTab="overview"
            />
          </div>

          {/* Welcome Content */}
          <div className="space-y-6 px-1">
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-400/30' 
              : 'bg-gradient-to-br from-emerald-50 to-purple-50 border border-emerald-200 shadow-lg'
            }`}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  স্বাগতম, {(user as any)?.firstName || 'ছাত্র/ছাত্রী'}!
                </h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Chemistry & ICT Care এ আপনাকে স্বাগতম
                </p>
                <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/80'}`}>
                    <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      📚 আজকের লক্ষ্য
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      উপরের আইকনগুলো ব্যবহার করে পড়াশোনা শুরু করুন
                    </p>
                  </div>
                  
                  {/* Recent Exam Results */}
                  {Array.isArray(recentResults) && recentResults.length > 0 && (
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-blue-50/80'}`}>
                      <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        📊 সাম্প্রতিক ফলাফল
                      </h3>
                      <div className="space-y-2">
                        {recentResults.slice(0, 3).map((result: any) => (
                          <div 
                            key={result.id} 
                            className={`text-sm p-3 rounded cursor-pointer transition-all hover:shadow-md ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600' : 'bg-white/60 hover:bg-white/80'}`}
                            onClick={() => setLocation('/student/exams')}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {result.examTitle}
                              </span>
                              <Badge className={`${(result.marks || result.manualMarks || 0) >= (result.totalMarks * 0.6) ? 'bg-green-600' : 'bg-orange-600'} text-white`}>
                                {result.marks || result.manualMarks || 0}/{result.totalMarks}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex justify-between">
                              <span>{result.examSubject} • {result.examDate ? new Date(result.examDate).toLocaleDateString() : 'No date'}</span>
                              <span className="text-blue-600">👆 ক্লিক করুন</span>
                            </div>
                            {result.feedback && (
                              <div className="text-xs text-gray-600 mt-1 italic">
                                💬 {result.feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setLocation('/student/exams')}
                      >
                        সব ফলাফল দেখুন
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MobileWrapper>
  );
}
