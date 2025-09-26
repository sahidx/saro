import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BookOpen, 
  Users, 
  Calendar, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Play,
  Eye,
  Trophy
} from 'lucide-react';

interface OnlineExam {
  id: string;
  title: string;
  subject: string;
  class: string;
  chapter?: string;
  duration: number;
  totalMarks: number;
  examDate: string;
  isActive: boolean;
  hasAttempted?: boolean;
  score?: number;
  grade?: string;
}

export default function StudentExams() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'online' | 'regular'>('online');

  // Fetch online exams
  const { data: onlineExams = [], isLoading: onlineLoading, error: onlineError } = useQuery<OnlineExam[]>({
    queryKey: ['/api/student/online-exams'],
  });

  // Fetch regular exams
  const { data: regularExams = [], isLoading: regularLoading, error: regularError } = useQuery<OnlineExam[]>({
    queryKey: ['/api/student/exams'],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubjectName = (subject: string) => {
    switch (subject) {
      case 'mathematics':
        return 'গণিত';
      case 'science':
        return 'বিজ্ঞান';
      case 'chemistry':
        return 'রসায়ন';
      case 'ict':
        return 'তথ্য ও যোগাযোগ প্রযুক্তি';
      default:
        return subject;
    }
  };

  const getClassName = (classLevel: string) => {
    return classLevel === '9-10' ? 'নবম-দশম' : 'একাদশ-দ্বাদশ';
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800';
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'A-':
      case 'B+':
        return 'bg-blue-100 text-blue-800';
      case 'B':
      case 'B-':
        return 'bg-yellow-100 text-yellow-800';
      case 'C+':
      case 'C':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const isLoading = onlineLoading || regularLoading;
  const error = onlineError || regularError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/student')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">My Exams</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('online')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'online'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Online MCQ Exams
              </button>
              <button
                onClick={() => setActiveTab('regular')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'regular'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Regular Exams
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exams...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error loading exams. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Online Exams Tab */}
            {activeTab === 'online' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Online MCQ Exams</h2>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {onlineExams.length} Available
                  </Badge>
                </div>

                {onlineExams.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Online Exams Available</h3>
                      <p className="text-gray-600">There are no online MCQ exams available at the moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {onlineExams.map((exam) => (
                      <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-2">{exam.title}</CardTitle>
                            <Badge className="bg-green-100 text-green-800">Online</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BookOpen className="w-4 h-4" />
                              <span>{getSubjectName(exam.subject)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{getClassName(exam.class)}</span>
                            </div>
                            {exam.chapter && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen className="w-4 h-4" />
                                <span>{exam.chapter}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{exam.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(exam.examDate)}</span>
                            </div>
                          </div>

                          {exam.hasAttempted ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Your Score:</span>
                                <Badge className={getGradeColor(exam.grade)}>
                                  {exam.score}/{exam.totalMarks} ({exam.grade})
                                </Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => setLocation(`/student/online-exam-results?examId=${exam.id}`)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Trophy className="w-4 h-4 mr-2" />
                                  View Results
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => setLocation(`/student/online-exam-view?examId=${exam.id}`)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Exam
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Regular Exams Tab */}
            {activeTab === 'regular' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Regular Exams</h2>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    {regularExams.length} Available
                  </Badge>
                </div>

                {regularExams.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Regular Exams Available</h3>
                      <p className="text-gray-600">There are no regular exams available at the moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularExams.map((exam) => (
                      <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-2">{exam.title}</CardTitle>
                            <Badge className="bg-blue-100 text-blue-800">Regular</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BookOpen className="w-4 h-4" />
                              <span>{getSubjectName(exam.subject)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{getClassName(exam.class)}</span>
                            </div>
                            {exam.chapter && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <BookOpen className="w-4 h-4" />
                                <span>{exam.chapter}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(exam.examDate)}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={() => setLocation(`/student/exam/${exam.id}/view`)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Exam
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
