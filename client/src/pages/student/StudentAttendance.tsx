import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  CalendarDays,
  Users,
  FlaskConical,
  Monitor,
  TrendingUp
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation } from 'wouter';

interface AttendanceRecord {
  id: string;
  date: string;
  isPresent: boolean;
  subject: 'science' | 'math';
  notes?: string;
  createdAt: string;
}

export default function StudentAttendance() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Fetch student's attendance data with auto-refresh
  const { data: attendanceData = [], isLoading, refetch } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/attendance/${(user as any)?.id}`],
    enabled: !!user && (user as any)?.role === 'student',
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true, // Refresh when user comes back to tab
  });

  // Fetch student's batch information
  const { data: batchData } = useQuery<{
    batch: {
      id: string;
      name: string;
      subject: 'science' | 'math';
      batchCode: string;
    };
    subject: 'science' | 'math';
  }>({
    queryKey: ['/api/student/batch'],
    enabled: !!user && (user as any)?.role === 'student',
  });

  // Generate calendar data for the selected month
  const generateCalendarData = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendanceRecord = attendanceData.find(record => 
        record.date.startsWith(dateStr)
      );
      
      days.push({
        day,
        date: dateStr,
        attendance: attendanceRecord
      });
    }
    
    return days;
  };

  // Calculate attendance statistics
  const getAttendanceStats = () => {
    if (!attendanceData.length) {
      return { totalDays: 0, presentDays: 0, absentDays: 0, attendanceRate: 0 };
    }

    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(record => record.isPresent).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { totalDays, presentDays, absentDays, attendanceRate };
  };

  const stats = getAttendanceStats();
  const calendarDays = generateCalendarData();
  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (isLoading) {
    return (
      <MobileWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="simple-spinner"></div>
          <span className="ml-3">উপস্থিতি তথ্য লোড হচ্ছে...</span>
        </div>
      </MobileWrapper>
    );
  }

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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/student')}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-emerald-400' 
                    : 'hover:bg-gray-100 text-emerald-600'
                  }`}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    উপস্থিতি ক্যালেন্ডার
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    আপনার ক্লাসের উপস্থিতি দেখুন
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-yellow-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  data-testid="button-theme-toggle"
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
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="force-mobile-layout px-3 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Attendance Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-lg'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {stats.attendanceRate}%
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    উপস্থিতির হার
                  </div>
                </CardContent>
              </Card>

              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30' 
                : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 shadow-lg'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {stats.totalDays}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    মোট দিন
                  </div>
                </CardContent>
              </Card>

              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-400/30' 
                : 'bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 shadow-lg'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {stats.presentDays}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    উপস্থিত
                  </div>
                </CardContent>
              </Card>

              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-400/30' 
                : 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 shadow-lg'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {stats.absentDays}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    অনুপস্থিত
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-slate-800/80 border-slate-600' 
              : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    <CalendarDays className="w-5 h-5" />
                    {monthNames[selectedMonth]} {selectedYear}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                      className={isDarkMode ? 'border-slate-600 text-gray-300' : ''}
                      data-testid="button-previous-month"
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextMonth}
                      className={isDarkMode ? 'border-slate-600 text-gray-300' : ''}
                      data-testid="button-next-month"
                    >
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {/* Day headers */}
                  {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map(day => (
                    <div 
                      key={day} 
                      className={`p-2 text-center text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {calendarDays.map((dayData, index) => (
                    <div key={index} className="relative">
                      {dayData ? (
                        <div
                          className={`
                            p-2 text-center text-sm border rounded cursor-pointer transition-all
                            ${dayData.attendance 
                              ? dayData.attendance.isPresent
                                ? isDarkMode 
                                  ? 'bg-green-500/20 border-green-400 text-green-300' 
                                  : 'bg-green-100 border-green-300 text-green-800'
                                : isDarkMode 
                                  ? 'bg-red-500/20 border-red-400 text-red-300' 
                                  : 'bg-red-100 border-red-300 text-red-800'
                              : isDarkMode 
                                ? 'bg-slate-700/30 border-slate-600 text-gray-400' 
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }
                            hover:scale-105
                          `}
                          data-testid={`calendar-day-${dayData.day}`}
                        >
                          <div className="font-medium">{dayData.day}</div>
                          {dayData.attendance && (
                            <div className="absolute -top-1 -right-1">
                              {dayData.attendance.isPresent ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>উপস্থিত</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>অনুপস্থিত</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-4 h-4 rounded border ${isDarkMode ? 'border-slate-600 bg-slate-700/30' : 'border-gray-300 bg-gray-50'}`}></div>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>কোন ক্লাস নেই</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise Attendance */}
            {batchData?.subject && (
              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-slate-800/80 border-slate-600' 
                : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-cyan-700'}`}>
                    {batchData.subject === 'science' ? <FlaskConical className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    {batchData.subject === 'science' ? 'বিজ্ঞান' : 'গণিত'} উপস্থিতি
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {stats.presentDays}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        উপস্থিত দিন
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div className={`text-xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {stats.absentDays}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        অনুপস্থিত দিন
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>উপস্থিতির হার</span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {stats.attendanceRate}%
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${stats.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Attendance Records */}
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-slate-800/80 border-slate-600' 
              : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <TrendingUp className="w-5 h-5" />
                  সাম্প্রতিক উপস্থিতি
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceData.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {attendanceData
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map(record => (
                        <div 
                          key={record.id} 
                          className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}
                          data-testid={`attendance-record-${record.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              record.subject === 'science' 
                                ? isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                                : isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-100 text-cyan-600'
                            }`}>
                              {record.subject === 'science' ? <FlaskConical className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {new Date(record.date).toLocaleDateString('bn-BD')}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {record.subject === 'science' ? 'বিজ্ঞান' : 'গণিত'}
                                {record.notes && ` - ${record.notes}`}
                              </div>
                            </div>
                          </div>
                          <Badge 
                            className={`${
                              record.isPresent
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {record.isPresent ? '✅ উপস্থিত' : '❌ অনুপস্থিত'}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">এখনো কোন উপস্থিতি রেকর্ড নেই</p>
                    <p className="text-xs mt-1">ক্লাস শুরু হলে এখানে উপস্থিতি দেখতে পাবেন</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MobileWrapper>
  );
}
