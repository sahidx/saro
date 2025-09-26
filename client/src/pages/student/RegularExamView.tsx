import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuestionPaperViewer from '@/components/QuestionPaperViewer';
import { 
  Clock, 
  BookOpen, 
  Users, 
  Calendar, 
  ArrowLeft, 
  AlertCircle,
  Download,
  FileText,
  Eye,
  ExternalLink,
  ZoomIn
} from 'lucide-react';

interface RegularExam {
  id: string;
  title: string;
  subject: string;
  targetClass: string;
  chapter?: string;
  examDate?: string;
  duration: number;
  totalMarks: number;
  examType: string;
  instructions?: string;
  questionContent?: string;
  questionSource?: string;
  questionPaperImage?: string;
  hasResult?: boolean;
  score?: number;
  feedback?: string;
  grade?: string;
}

export default function RegularExamView() {
  const [, setLocation] = useLocation();
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Get exam ID from URL params
  const examId = new URLSearchParams(window.location.search).get('examId');

  if (!examId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid exam ID</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch exam details
  const { data: exam, isLoading } = useQuery<RegularExam>({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId,
  });

  const getSubjectName = (subject: string) => {
    return subject === 'science' ? 'বিজ্ঞান' : 'গণিত';
  };

  const getClassName = (classLevel: string) => {
    return classLevel === '9-10' ? 'নবম-দশম' : 'একাদশ-দ্বাদশ';
  };

  const getExamTypeName = (examType: string) => {
    switch (examType) {
      case 'written': return 'লিখিত পরীক্ষা';
      case 'practical': return 'ব্যবহারিক পরীক্ষা';
      case 'mixed': return 'মিশ্র পরীক্ষা';
      default: return examType;
    }
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

  const handleViewQuestionPaper = () => {
    // Handle new questionPaperImage field (simplified format)
    if (exam?.questionPaperImage) {
      setIsViewerOpen(true);
      return;
    }

    // Handle legacy questionContent field
    if (exam?.questionSource === 'drive_link' && exam.questionContent) {
      // Open Google Drive link in new tab
      window.open(exam.questionContent, '_blank');
    } else if (exam?.questionSource === 'file_upload' && exam.questionContent) {
      // For uploaded files, create a blob URL and download
      if (exam.questionContent.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = exam.questionContent;
        link.download = `${exam.title}_question_paper`;
        link.click();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Exam not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/student/exams')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Exams
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Regular Exam</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Exam Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {exam.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{getSubjectName(exam.subject)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{getClassName(exam.targetClass)}</span>
                  </div>
                  {exam.chapter && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>Chapter: {exam.chapter}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {exam.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Total Marks: {exam.totalMarks}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{getExamTypeName(exam.examType)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exam.examDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Exam Date: {new Date(exam.examDate).toLocaleString('bn-BD', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                )}
                <Badge className="bg-orange-100 text-orange-800 w-fit">Regular Exam</Badge>
              </div>

              {exam.instructions && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
                  <p className="text-blue-700 text-sm whitespace-pre-wrap">{exam.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Paper */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Question Paper
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exam.questionPaperImage || exam.questionContent ? (
                <div className="text-center space-y-4">
                  <div className="text-gray-600">
                    {exam.questionPaperImage 
                      ? 'Question paper image is ready for viewing'
                      : exam.questionSource === 'drive_link' 
                        ? 'Question paper is available via Google Drive link'
                        : 'Question paper file is available for download'
                    }
                  </div>
                  <Button
                    onClick={handleViewQuestionPaper}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {exam.questionPaperImage ? (
                      <>
                        <ZoomIn className="w-4 h-4 mr-2" />
                        View Question Paper
                      </>
                    ) : exam.questionSource === 'drive_link' ? (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Question Paper
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Question Paper
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No question paper has been uploaded yet</p>
                </div>
              )}

              {/* Preview thumbnail for new image format */}
              {exam.questionPaperImage && (
                <div className="mt-4 text-center">
                  <img
                    src={exam.questionPaperImage}
                    alt="Question Paper Preview"
                    className="max-w-sm h-auto rounded-lg border mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsViewerOpen(true)}
                  />
                  <p className="text-xs text-gray-500 mt-2">Click to view in full screen with zoom</p>
                </div>
              )}

              {/* Legacy image preview */}
              {exam.questionSource === 'file_upload' && exam.questionContent?.startsWith('data:image') && !exam.questionPaperImage && (
                <div className="mt-4">
                  <img
                    src={exam.questionContent}
                    alt="Question Paper"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam Status / Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Exam Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exam.hasResult ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your exam has been graded by the teacher. Check your results below.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{exam.score}/{exam.totalMarks}</div>
                      <div className="text-sm text-gray-600">Marks Obtained</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {exam.score && exam.totalMarks ? Math.round((exam.score / exam.totalMarks) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Percentage</div>
                    </div>
                    <div className="text-center">
                      <Badge className={`${getGradeColor(exam.grade)} text-xl px-4 py-2`}>
                        {exam.grade}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">Grade</div>
                    </div>
                  </div>

                  {exam.feedback && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">Teacher's Feedback:</h3>
                      <p className="text-green-700 text-sm">{exam.feedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is a regular exam that will be graded manually by your teacher. 
                    Results will be available here once the teacher completes the grading process.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button onClick={() => setLocation('/student/exams')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
            {exam.hasResult && (
              <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
                Print Results
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Question Paper Viewer */}
      <QuestionPaperViewer
        imageUrl={exam?.questionPaperImage}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        examTitle={exam?.title || 'Question Paper'}
      />
    </div>
  );
}
