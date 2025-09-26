import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { format } from 'date-fns';
import { BookOpen, Users, Trophy, Save, Calculator, CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phoneNumber?: string;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  totalMarks: number;
  batchId: string;
  questionPaperImage?: string;
}

interface StudentMark {
  studentId: string;
  marks: number;
  feedback: string;
}

interface ExamMarkEntryProps {
  examId: string;
  onClose: () => void;
  enableSMS?: boolean;
}

export function ExamMarkEntry({ examId, onClose, enableSMS = false }: ExamMarkEntryProps) {
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  const [sendToStudents, setSendToStudents] = useState(true);
  const [sendToParents, setSendToParents] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${examId}`],
  });

  // Fetch students in the exam's batch
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/batches/${exam?.batchId}/students`],
    enabled: !!exam?.batchId,
  });

  // Fetch existing marks if any
  const { data: existingMarks = [] } = useQuery({
    queryKey: [`/api/exams/${examId}/marks`],
    enabled: !!examId,
  });

  // Initialize student marks array when students data is loaded
  useEffect(() => {
    if (students.length > 0 && studentMarks.length === 0) {
      const initialMarks = students.map(student => {
        // Check if there are existing marks for this student
        const existingMark = existingMarks.find((mark: any) => mark.studentId === student.id);
        return {
          studentId: student.id,
          marks: existingMark?.marks || 0,
          feedback: existingMark?.feedback || '',
        };
      });
      setStudentMarks(initialMarks);
    }
  }, [students, existingMarks, studentMarks.length]);

  // Save marks mutation
  const saveMarksMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await apiRequest('POST', `/api/exams/${examId}/marks`, payload);
      if (!response.ok) throw new Error('Failed to save marks');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Marks Saved Successfully',
        description: 'Student marks have been recorded and calculated.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/exams/${examId}/marks`] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: '❌ Failed to Save Marks',
        description: 'There was an error saving the marks. Please try again.',
        variant: 'destructive',
      });
      console.error('Error saving marks:', error);
    },
  });

  const handleMarkChange = (studentId: string, marks: number) => {
    setStudentMarks(prev => 
      prev.map(mark => 
        mark.studentId === studentId 
          ? { ...mark, marks: Math.max(0, Math.min(marks, exam?.totalMarks || 100)) }
          : mark
      )
    );
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setStudentMarks(prev => 
      prev.map(mark => 
        mark.studentId === studentId 
          ? { ...mark, feedback }
          : mark
      )
    );
  };

  const handleSaveMarks = () => {
    setIsSaving(true);
    // Only save marks for students who have been given marks (> 0)
    const marksToSave = studentMarks.filter(mark => mark.marks > 0);
    const payload = {
      studentMarks: marksToSave,
      sendSMS: enableSMS && sendSMS,
      sendToStudents,
      sendToParents,
    };
    saveMarksMutation.mutate(payload);
  };

  const calculateGrade = (marks: number, totalMarks: number) => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-500' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-400' };
    if (percentage >= 70) return { grade: 'A-', color: 'bg-blue-500' };
    if (percentage >= 60) return { grade: 'B', color: 'bg-blue-400' };
    if (percentage >= 50) return { grade: 'C', color: 'bg-yellow-500' };
    if (percentage >= 40) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  const marksEntered = studentMarks.filter(mark => mark.marks > 0).length;
  const totalStudents = students.length;

  if (examLoading || studentsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Exam not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {exam.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Subject:</span>
              <p className="font-medium capitalize">{exam.subject}</p>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-medium">{format(new Date(exam.examDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Marks:</span>
              <p className="font-medium">{exam.totalMarks}</p>
            </div>
            <div>
              <span className="text-gray-600">Students:</span>
              <p className="font-medium flex items-center gap-1">
                <Users className="w-4 h-4" />
                {totalStudents}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <span className="font-medium">Marks Entered: {marksEntered}/{totalStudents}</span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(marksEntered / totalStudents) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Marks Entry */}
      <div className="space-y-4">
        {students.map((student, index) => {
          const studentMark = studentMarks.find(mark => mark.studentId === student.id);
          const marks = studentMark?.marks || 0;
          const feedback = studentMark?.feedback || '';
          const { grade, color } = calculateGrade(marks, exam.totalMarks);
          const percentage = ((marks / exam.totalMarks) * 100).toFixed(1);

          return (
            <Card key={student.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Student Info */}
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Marks Input */}
                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      min="0"
                      max={exam.totalMarks}
                      placeholder="Marks"
                      value={marks || ''}
                      onChange={(e) => handleMarkChange(student.id, parseInt(e.target.value) || 0)}
                      className="text-center font-medium"
                    />
                  </div>

                  {/* Grade & Percentage */}
                  <div className="md:col-span-2 text-center">
                    {marks > 0 && (
                      <div className="space-y-1">
                        <Badge className={`${color} text-white`}>
                          {grade}
                        </Badge>
                        <p className="text-sm text-gray-600">{percentage}%</p>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  <div className="md:col-span-4">
                    <Textarea
                      placeholder="Optional feedback..."
                      value={feedback}
                      onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                      className="min-h-[60px] text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1 text-center">
                    {marks > 0 && (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SMS Options */}
      {enableSMS && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SMS Notification Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sendSMS" 
                checked={sendSMS}
                onCheckedChange={(checked) => setSendSMS(!!checked)}
              />
              <label htmlFor="sendSMS" className="text-sm font-medium">
                Send SMS notifications for exam results
              </label>
            </div>
            {sendSMS && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendToStudents" 
                    checked={sendToStudents}
                    onCheckedChange={(checked) => setSendToStudents(!!checked)}
                  />
                  <label htmlFor="sendToStudents" className="text-sm">
                    Send to students
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendToParents" 
                    checked={sendToParents}
                    onCheckedChange={(checked) => setSendToParents(!!checked)}
                  />
                  <label htmlFor="sendToParents" className="text-sm">
                    Send to parents
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveMarks}
          disabled={isSaving || marksEntered === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : `Save ${marksEntered} Marks`}
        </Button>
      </div>

      {/* Question Paper Preview */}
      {exam.questionPaperImage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Paper</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={exam.questionPaperImage} 
              alt="Question Paper"
              className="max-w-full h-auto rounded-lg border"
              loading="lazy"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}