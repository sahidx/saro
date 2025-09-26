import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  FileText,
  Clock,
  Trophy,
  ExternalLink,
  ImageIcon,
  User,
  CalendarDays,
  BookOpen
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface ExamViewProps {
  params: {
    examId: string;
  };
}

export default function StudentExamView({ params }: ExamViewProps) {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const { examId } = params;

  // Fetch exam details with questions
  const { data: examData, isLoading, error } = useQuery({
    queryKey: [`/api/student/exam/${examId}/view?userId=${user?.id}`],
    enabled: !!user?.id && !!examId,
  });

  const exam = examData?.exam;
  const questions = examData?.questions || [];
  const submission = examData?.submission;

  if (isLoading) {
    return (
      <MobileWrapper>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
        }`}>
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>পরীক্ষা লোড হচ্ছে...</p>
          </div>
        </div>
      </MobileWrapper>
    );
  }

  if (error || !exam) {
    return (
      <MobileWrapper>
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
        }`}>
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className={`text-lg mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              পরীক্ষা খুঁজে পাওয়া যায়নি
            </p>
            <Button onClick={() => setLocation('/student/exams')} variant="outline">
              ফিরে যান
            </Button>
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
                  onClick={() => setLocation('/student/exams')}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-emerald-400' 
                    : 'hover:bg-gray-100 text-emerald-600'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    পরীক্ষার প্রশ্ন
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {exam.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mobile-main-content force-mobile-padding p-4 space-y-4">
          
          {/* Exam Info Card */}
          <Card className={`force-mobile-card ${isDarkMode 
            ? 'bg-slate-800/80 border-slate-600' 
            : 'bg-white border-gray-200 shadow-md'
          }`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {exam.title}
                  </h2>
                  <div className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      বিষয়: {exam.subject === 'Chemistry' ? 'রসায়ন' : 'ICT'}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      {new Date(exam.examDate).toLocaleDateString('bn-BD')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      সময়: {exam.duration} মিনিট | মোট নম্বর: {exam.totalMarks}
                    </div>
                  </div>
                </div>
                <Badge variant={submission ? "default" : "secondary"}>
                  {submission ? 'উত্তর জমা দিয়েছেন' : 'অংশগ্রহণ করেননি'}
                </Badge>
              </div>

              {/* Drive Link or Image Source */}
              {exam.questionSource === 'drive_link' && exam.questionContent && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                      <span className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        প্রশ্নপত্র লিংক
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (exam.questionContent && exam.questionContent.trim()) {
                          window.open(exam.questionContent, '_blank');
                        } else {
                          console.error('No question content available for exam:', exam.id);
                        }
                      }}
                      className="ml-2"
                    >
                      খুলুন
                    </Button>
                  </div>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    গুগল ড্রাইভে প্রশ্নপত্র দেখুন
                  </p>
                </div>
              )}

              {exam.questionSource === 'image_upload' && exam.questionContent && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    <span className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      প্রশ্নপত্রের ছবি
                    </span>
                  </div>
                  <img 
                    src={exam.questionContent} 
                    alt="প্রশ্নপত্র"
                    className="w-full rounded-lg border shadow-sm"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                </div>
              )}

              {submission && (
                <div className={`p-3 rounded-lg ${
                  submission.score ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${
                        submission.score 
                          ? isDarkMode ? 'text-green-300' : 'text-green-700'
                          : isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                      }`}>
                        আপনার ফলাফল
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {submission.score ? 
                          `স্কোর: ${submission.score}/${submission.totalMarks}` :
                          `ম্যানুয়াল নম্বর: ${submission.manualMarks || 'অপেক্ষারত'}/${submission.totalMarks}`
                        }
                      </p>
                    </div>
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  {submission.feedback && (
                    <div className="mt-2">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        শিক্ষকের মন্তব্য:
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Questions */}
          {questions.length > 0 && (
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-slate-800/80 border-slate-600' 
              : 'bg-white border-gray-200 shadow-md'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-cyan-700'}`}>
                  <FileText className="w-5 h-5" />
                  প্রশ্নসমূহ ({questions.length}টি)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question: any, index: number) => (
                  <div key={question.id} className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        প্রশ্ন {index + 1}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {question.marks} নম্বর
                      </Badge>
                    </div>

                    <div className={`mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {question.questionText}
                    </div>

                    {/* Question Image */}
                    {question.questionImage && (
                      <div className="mb-3">
                        <img 
                          src={question.questionImage} 
                          alt={`প্রশ্ন ${index + 1} এর ছবি`}
                          className="w-full rounded-lg border shadow-sm"
                          style={{ maxHeight: '300px', objectFit: 'contain' }}
                        />
                      </div>
                    )}

                    {/* Drive Link */}
                    {question.driveLink && (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              অতিরিক্ত রিসোর্স
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (question.driveLink && question.driveLink.trim()) {
                                window.open(question.driveLink, '_blank');
                              } else {
                                console.error('No drive link available for question:', question.id);
                              }
                            }}
                          >
                            দেখুন
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* MCQ Options */}
                    {question.questionType === 'mcq' && question.options && (
                      <div className="space-y-2">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          বিকল্পসমূহ:
                        </p>
                        {Object.entries(question.options).map(([key, value]: [string, any]) => (
                          <div 
                            key={key} 
                            className={`p-2 rounded border text-sm ${
                              key === question.correctAnswer 
                                ? isDarkMode 
                                  ? 'bg-green-900/30 border-green-400 text-green-300' 
                                  : 'bg-green-50 border-green-300 text-green-700'
                                : isDarkMode 
                                  ? 'bg-slate-800 border-slate-600 text-gray-300' 
                                  : 'bg-white border-gray-300 text-gray-700'
                            }`}
                          >
                            <span className="font-medium">{key.toUpperCase()})</span> {value}
                            {key === question.correctAnswer && (
                              <span className="ml-2 text-xs font-medium">✓ সঠিক উত্তর</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.questionType === 'written' && (
                      <div className={`p-3 rounded border text-sm ${
                        isDarkMode 
                          ? 'bg-slate-800 border-slate-600 text-yellow-300' 
                          : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      }`}>
                        📝 লিখিত প্রশ্ন - আপনার উত্তর খাতায় লিখুন
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {questions.length === 0 && (
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-slate-800/80 border-slate-600' 
              : 'bg-white border-gray-200 shadow-md'
            }`}>
              <CardContent className="p-8 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  এই পরীক্ষার জন্য আলাদা প্রশ্ন তৈরি করা হয়নি
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  উপরে প্রশ্নপত্রের লিংক বা ছবি দেখুন
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </MobileWrapper>
  );
}
