import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Users, 
  Save, 
  MessageSquare,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Send,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Exam {
  id: string;
  title: string;
  subject: string;
  targetClass: string;
  chapter?: string;
  examDate: string;
  duration: number;
  totalMarks: number;
  examType: string;
  examMode: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  phoneNumber?: string;
  parentPhoneNumber?: string;
}

interface StudentMark {
  studentId: string;
  marks: number;
  feedback: string;
}

export default function TeacherGradingInterface() {
  const [, setLocation] = useLocation();
  const [studentMarks, setStudentMarks] = useState<{ [studentId: string]: StudentMark }>({});
  const [smsOptions, setSmsOptions] = useState({
    sendSMS: true,
    sendToStudents: true,
    sendToParents: false,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get exam ID from URL params
  const examId = new URLSearchParams(window.location.search).get('examId');

  if (!examId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>Invalid exam ID</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${examId}`],
    enabled: !!examId,
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Fetch existing submissions/marks
  const { data: existingMarks = [], isLoading: marksLoading } = useQuery({
    queryKey: [`/api/exams/${examId}/marks`],
    enabled: !!examId,
  });

  // Save marks mutation
  const saveMarksMutation = useMutation({
    mutationFn: async (data: { studentMarks: StudentMark[], smsOptions: any }) => {
      const response = await apiRequest('POST', `/api/exams/${examId}/marks`, data);
      if (!response.ok) throw new Error('Failed to save marks');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/exams/${examId}/marks`] });
      toast({
        title: "Success",
        description: result.message || "Marks saved successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save marks. Please try again.",
        variant: "destructive",
      });
      console.error('Error saving marks:', error);
    },
  });

  const updateStudentMark = (studentId: string, field: keyof StudentMark, value: string | number) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        marks: prev[studentId]?.marks || 0,
        feedback: prev[studentId]?.feedback || 'Good effort! Keep practicing for better results.',
        [field]: value,
      },
    }));
  };

  const handleSaveMarks = () => {
    const marksArray = Object.values(studentMarks).filter(mark => mark.marks > 0);
    
    if (marksArray.length === 0) {
      toast({
        title: "No marks to save",
        description: "Please enter marks for at least one student.",
        variant: "destructive",
      });
      return;
    }

    saveMarksMutation.mutate({
      studentMarks: marksArray,
      smsOptions,
    });
  };

  const getSubjectName = (subject: string) => {
    return subject === 'science' ? 'বিজ্ঞান' : 'গণিত';
  };

  const getClassName = (targetClass: string) => {
    return targetClass === '9-10' ? 'নবম-দশম' : 'একাদশ-দ্বাদশ';
  };

  const calculateGrade = (marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B+';
    if (percentage >= 40) return 'B';
    if (percentage >= 33) return 'C';
    return 'F';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'A-':
      case 'B+':
        return 'bg-blue-100 text-blue-800';
      case 'B':
        return 'bg-yellow-100 text-yellow-800';
      case 'C':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const studentsWithMarks = students.filter(student => studentMarks[student.id]?.marks > 0).length;

  if (examLoading || studentsLoading || marksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading grading interface...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>Exam not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/exam-management')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Exams
              </Button>
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-orange-600" />
                <h1 className="text-xl font-bold text-gray-800">Grade Exam</h1>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-800">
              {studentsWithMarks} students graded
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Exam Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {exam.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{getSubjectName(exam.subject)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{getClassName(exam.targetClass)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{exam.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{exam.totalMarks} marks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grading Interface */}
          <Tabs defaultValue="grading">
            <TabsList>
              <TabsTrigger value="grading">Student Grading</TabsTrigger>
              <TabsTrigger value="sms">SMS Options</TabsTrigger>
            </TabsList>

            <TabsContent value="grading" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Grade Students ({students.length})</span>
                    <Button
                      onClick={handleSaveMarks}
                      disabled={saveMarksMutation.isPending || studentsWithMarks === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saveMarksMutation.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save All Marks ({studentsWithMarks})
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students.map((student) => {
                      const currentMark = studentMarks[student.id];
                      const grade = currentMark?.marks ? calculateGrade(currentMark.marks, exam.totalMarks) : '';
                      
                      return (
                        <Card key={student.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            {/* Student Info */}
                            <div className="md:col-span-3">
                              <div className="font-medium">
                                {student.firstName} {student.lastName}
                              </div>
                              {student.studentId && (
                                <div className="text-sm text-gray-600">ID: {student.studentId}</div>
                              )}
                              {student.phoneNumber && (
                                <div className="text-xs text-gray-500">📱 {student.phoneNumber}</div>
                              )}
                            </div>

                            {/* Marks Input */}
                            <div className="md:col-span-2">
                              <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                max={exam.totalMarks}
                                value={currentMark?.marks || ''}
                                onChange={(e) => updateStudentMark(
                                  student.id, 
                                  'marks', 
                                  parseInt(e.target.value) || 0
                                )}
                                className="w-full"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                out of {exam.totalMarks}
                              </div>
                            </div>

                            {/* Grade Display */}
                            <div className="md:col-span-1">
                              {grade && (
                                <Badge className={`${getGradeColor(grade)} border`}>
                                  {grade}
                                </Badge>
                              )}
                            </div>

                            {/* Feedback */}
                            <div className="md:col-span-6">
                              <Textarea
                                placeholder="Enter feedback for student..."
                                value={currentMark?.feedback || ''}
                                onChange={(e) => updateStudentMark(
                                  student.id, 
                                  'feedback', 
                                  e.target.value
                                )}
                                rows={2}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    SMS Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={smsOptions.sendSMS}
                        onChange={(e) => setSmsOptions(prev => ({ 
                          ...prev, 
                          sendSMS: e.target.checked 
                        }))}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">Send SMS notifications after saving marks</span>
                    </label>

                    {smsOptions.sendSMS && (
                      <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={smsOptions.sendToStudents}
                            onChange={(e) => setSmsOptions(prev => ({ 
                              ...prev, 
                              sendToStudents: e.target.checked 
                            }))}
                            className="w-4 h-4"
                          />
                          <span>Send to students</span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={smsOptions.sendToParents}
                            onChange={(e) => setSmsOptions(prev => ({ 
                              ...prev, 
                              sendToParents: e.target.checked 
                            }))}
                            className="w-4 h-4"
                          />
                          <span>Send to parents (if parent phone numbers available)</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription>
                      SMS will be sent to notify about exam results. Make sure you have sufficient SMS credits.
                      Only students with entered marks will receive notifications.
                    </AlertDescription>
                  </Alert>

                  {smsOptions.sendSMS && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">SMS Preview:</h3>
                      <div className="text-blue-700 text-sm space-y-1">
                        {smsOptions.sendToStudents && (
                          <div>📱 <strong>Student:</strong> "Name: Got 85/100 marks in ExamName -Belal Sir"</div>
                        )}
                        {smsOptions.sendToParents && (
                          <div>👨‍👩‍👧‍👦 <strong>Parent:</strong> "Name: 85/100 নম্বর (ExamName পরীক্ষা) -বেলাল স্যার"</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => setLocation('/exam-management')} 
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
            
            <Button
              onClick={handleSaveMarks}
              disabled={saveMarksMutation.isPending || studentsWithMarks === 0}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              {saveMarksMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Marks...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Save Marks & Send SMS ({studentsWithMarks})
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
