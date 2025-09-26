import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  User,
  Star,
  Award,
  CheckCircle2,
  Moon,
  Sun,
  Home
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface StudentResultProps {
  id: string;
  studentName: string;
  marks: number;
  percentage: number;
  grade: string;
  rank: number;
  feedback?: string;
}

export default function StudentResults() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const { examId } = useParams<{ examId: string }>();

  // Fetch exam details and results
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId,
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: [`/api/exams/${examId}/results`],
    enabled: !!examId,
    refetchOnMount: true,
  });

  const exam = examData;
  const results = resultsData?.results || [];
  const currentUserResult = Array.isArray(results) ? results.find((r: any) => r.id === user?.id) : null;

  // Dynamic grade color function using grading scheme from API
  const getDynamicGradeColor = (grade: string, gradingScheme: any) => {
    if (!gradingScheme?.gradeRanges) {
      // Fallback to default colors if no scheme available
      switch (grade) {
        case 'A+': return 'bg-green-500 text-white';
        case 'A': return 'bg-blue-500 text-white';
        case 'A-': return 'bg-cyan-500 text-white';
        case 'B': return 'bg-yellow-500 text-white';
        case 'C': return 'bg-orange-500 text-white';
        case 'D': return 'bg-red-400 text-white';
        default: return 'bg-red-600 text-white'; // F
      }
    }
    
    // Use grading scheme color
    const gradeRange = gradingScheme.gradeRanges.find((g: any) => g.letter === grade);
    return gradeRange?.color || 'bg-gray-500 text-white';
  };

  // Dynamic performance message using grading scheme
  const getDynamicPerformanceMessage = (percentage: number, gradingScheme: any) => {
    if (!gradingScheme?.gradeRanges) {
      // Fallback messages
      if (percentage >= 80) return '🎉 অসাধারণ! চমৎকার ফলাফল! (A+ - GPA 5.0)';
      if (percentage >= 70) return '👏 খুবই ভালো! অভিনন্দন! (A - GPA 4.0)';
      if (percentage >= 60) return '👍 ভালো ফলাফল! আরো চেষ্টা করুন। (A- - GPA 3.5)';
      if (percentage >= 50) return '📊 গ্রহণযোগ্য ফলাফল! আরো চেষ্টা করুন। (B - GPA 3.0)';
      if (percentage >= 40) return '📚 পাস! আরো অধ্যয়ন প্রয়োজন। (C - GPA 2.0)';
      if (percentage >= 33) return '⚠️ মোটামুটি! আরো পড়াশোনা করুন। (D - GPA 1.0)';
      return '💪 আরো চেষ্টা করুন। পরবর্তীতে ভালো করবেন। (F - GPA 0.0)';
    }
    
    // Find appropriate grade based on percentage
    const sortedGrades = [...gradingScheme.gradeRanges].sort((a, b) => b.minPercent - a.minPercent);
    for (const grade of sortedGrades) {
      if (percentage >= grade.minPercent && percentage <= grade.maxPercent) {
        return `${grade.description} (${grade.letter} - GPA ${grade.gpa})`;
      }
    }
    
    // Fallback to lowest grade
    const lowestGrade = sortedGrades[sortedGrades.length - 1];
    return `${lowestGrade.description} (${lowestGrade.letter} - GPA ${lowestGrade.gpa})`;
  };

  if (examLoading || resultsLoading) {
    return (
      <MobileWrapper>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
        }`}>
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              ফলাফল লোড হচ্ছে...
            </p>
          </div>
        </div>
      </MobileWrapper>
    );
  }

  if (!exam || !currentUserResult) {
    return (
      <MobileWrapper>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
        }`}>
          <div className="text-center space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-red-500" />
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              ফলাফল পাওয়া যায়নি
            </h2>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি বা খুঁজে পাওয়া যায়নি।
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/student/exams')}
                className={`w-full max-w-xs ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                পরীক্ষায় ফিরে যান
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/student')}
                className="w-full max-w-xs"
              >
                <Home className="w-4 h-4 mr-2" />
                হোম পেজে যান
              </Button>
            </div>
          </div>
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
        
        {/* Mobile Header */}
        <header className={`sticky top-0 z-50 ${isDarkMode 
          ? 'bg-slate-800/95 backdrop-blur-sm border-b border-green-400/30' 
          : 'bg-white/95 backdrop-blur-sm border-b border-green-200 shadow-sm'
        }`}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/student/exams')}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-green-400' 
                    : 'hover:bg-gray-100 text-green-600'
                  }`}
                  data-testid="button-back-exams"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                    পরীক্ষার ফলাফল
                  </h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {exam?.title || 'পরীক্ষা'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-9 h-9 ${isDarkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  data-testid="button-theme-toggle"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/student')}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-green-400' 
                    : 'hover:bg-gray-100 text-green-600'
                  }`}
                  data-testid="button-home"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-6 space-y-6">
          
          {/* Exam Info Card */}
          <Card className={`${isDarkMode 
            ? 'bg-slate-800/50 border-gray-700' 
            : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-center ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                <Trophy className="w-6 h-6 mx-auto mb-2" />
                পরীক্ষার তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`grid grid-cols-2 gap-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>{exam?.examDate ? new Date(exam.examDate).toLocaleDateString('bn-BD') : 'তারিখ নেই'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>{exam?.duration || 0} মিনিট</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  <span>{exam?.subject === 'chemistry' ? 'রসায়ন' : 'ICT'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>পূর্ণমান: {exam?.totalMarks || 100}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Result Summary */}
          <Card className={`${isDarkMode 
            ? 'bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-400/30' 
            : 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
          } shadow-lg`}>
            <CardHeader className="text-center pb-4">
              <CardTitle className={`flex items-center justify-center gap-2 text-xl ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <Target className="w-6 h-6" />
                আপনার ফলাফল
              </CardTitle>
              <p className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {currentUserResult ? getDynamicPerformanceMessage(currentUserResult.percentage, resultsData?.gradingScheme) : 'ফলাফল প্রস্তুত করা হচ্ছে...'}
              </p>
            </CardHeader>
            {currentUserResult && (
              <CardContent className="grid grid-cols-4 gap-3 text-center">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {currentUserResult.marks}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>নম্বর</div>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    #{currentUserResult.rank}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>র‍্যাঙ্ক</div>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {currentUserResult.percentage}%
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>শতকরা</div>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} border`}>
                  <Badge className={`${getDynamicGradeColor(currentUserResult.grade, resultsData?.gradingScheme)} text-lg px-3 py-1 font-bold`}>
                    {currentUserResult.grade}
                  </Badge>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>গ্রেড</div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* All Students Ranking */}
          <Card className={`${isDarkMode ? 'bg-slate-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                <Trophy className="w-6 h-6" />
                সকল শিক্ষার্থীর ফলাফল
              </CardTitle>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                মেধা তালিকা - র‍্যাঙ্ক অনুযায়ী সাজানো
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                {results.map((result: any, index: number) => (
                  <div 
                    key={result.id}
                    className={`flex items-center justify-between p-4 border-b last:border-b-0 ${
                      result.id === user?.id 
                        ? (isDarkMode 
                            ? 'bg-blue-500/20 border-blue-400/30' 
                            : 'bg-blue-50 border-blue-200')
                        : (isDarkMode ? 'border-gray-700' : 'border-gray-100')
                    } ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank with Medal */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 
                          ? 'bg-yellow-500 text-white' 
                          : index === 1 
                            ? 'bg-gray-400 text-white'
                            : index === 2
                              ? 'bg-orange-500 text-white'
                              : (isDarkMode ? 'bg-slate-600 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${result.rank}`}
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${
                          result.id === user?.id ? 'font-bold' : ''
                        }`}>
                          {result.firstName} {result.lastName}
                          {result.id === user?.id && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                            }`}>আপনি</span>
                          )}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          আইডি: {result.studentId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Marks */}
                      <div className="text-center">
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {result.marks}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          /{exam?.totalMarks || 100}
                        </div>
                      </div>

                      {/* Percentage */}
                      <div className="text-center">
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {result.percentage}%
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>শতকরা</div>
                      </div>

                      {/* Grade */}
                      <div className="text-center">
                        <Badge className={`${getDynamicGradeColor(result.grade, resultsData?.gradingScheme)} font-bold px-3 py-1`}>
                          {result.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Teacher Feedback (if exists) */}
          {currentUserResult?.feedback && (
            <Card className={`${isDarkMode 
              ? 'bg-blue-500/10 border border-blue-400/30' 
              : 'bg-blue-50 border border-blue-200'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-lg ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  <Star className="w-5 h-5" />
                  শিক্ষকের মন্তব্য
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                  "{currentUserResult?.feedback}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="space-y-3 pb-6">
            <Button 
              onClick={() => setLocation('/student/exams')}
              className={`w-full py-3 ${isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              } shadow-lg`}
              data-testid="button-back-to-exams"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              অন্যান্য পরীক্ষা দেখুন
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation('/student')}
              className={`w-full py-3 ${isDarkMode 
                ? 'border-gray-600 hover:bg-slate-800' 
                : 'border-gray-300 hover:bg-gray-50'
              }`}
              data-testid="button-student-home"
            >
              <Home className="w-4 h-4 mr-2" />
              স্টুডেন্ট ড্যাশবোর্ডে যান
            </Button>
          </div>
        </main>
      </div>
    </MobileWrapper>
  );
}
