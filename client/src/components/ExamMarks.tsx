import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Smartphone, Send, Settings, Phone, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ExamMarksProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
}

interface StudentMark {
  studentId: string;
  marks: number;
  feedback: string;
}

interface SMSOptions {
  sendSMS: boolean;
  sendToParents: boolean;
  sendToStudents: boolean;
}

export function ExamMarks({ exam, isOpen, onClose }: ExamMarksProps) {
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [smsOptions, setSmsOptions] = useState<SMSOptions>({
    sendSMS: true,
    sendToParents: false,
    sendToStudents: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch SMS credits for validation
  const { data: smsCreditsData } = useQuery({
    queryKey: ['/api/user/sms-credits'],
    refetchInterval: 5000,
    enabled: isOpen,
  });

  // Get students for this exam (either by batch or all students)
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    enabled: isOpen,
  });

  // Filter students based on exam's target
  const examStudents = exam?.batchId 
    ? (students as any[]).filter((student: any) => student.batchId === exam.batchId)
    : (students as any[]);

  // Initialize student marks when students data is available
  useState(() => {
    if (examStudents.length > 0 && studentMarks.length === 0) {
      setStudentMarks(
        examStudents.map((student: any) => ({
          studentId: student.id,
          marks: 0,
          feedback: 'Good effort! Keep practicing for better results.'
        }))
      );
    }
  });

  const updateMarksMutation = useMutation({
    mutationFn: async (data: { studentMarks: StudentMark[]; smsOptions: SMSOptions }) => {
      return await apiRequest('POST', `/api/exams/${exam.id}/marks`, data);
    },
    onSuccess: (result: any) => {
      toast({
        title: "✅ Marks Updated Successfully!",
        description: result.message || `Results saved for ${studentMarks.length} students.`,
      });
      // Force refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-results'] });
      queryClient.invalidateQueries({ queryKey: [`/api/exams/${exam.id}`] });
      // Invalidate all student exam queries
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0]?.toString().includes('/api/student/exams')
      });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0]?.toString().includes('/api/student/exam')
      });
      queryClient.refetchQueries(); // Force refetch all queries
      onClose();
    },
    onError: (error: any) => {
      console.error('Mark saving error:', error);
      
      // Handle insufficient SMS credits error specifically
      if (error.message && error.message.includes('Insufficient SMS credits')) {
        toast({
          title: "❌ SMS ব্যালেন্স অপর্যাপ্ত",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "❌ Failed to Update Marks",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkChange = (studentId: string, field: 'marks' | 'feedback', value: string | number) => {
    setStudentMarks(prev => 
      prev.map(mark => 
        mark.studentId === studentId 
          ? { ...mark, [field]: field === 'marks' ? Number(value) : value }
          : mark
      )
    );
  };

  const handleSubmit = () => {
    const validMarks = studentMarks.filter(mark => mark.marks >= 0 && mark.marks <= (exam.totalMarks || 100));
    
    if (validMarks.length === 0) {
      toast({
        title: "No Valid Marks",
        description: "Please enter valid marks for at least one student.",
        variant: "destructive",
      });
      return;
    }

    const currentCredits = (smsCreditsData as any)?.smsCredits || 0;
    
    // Check SMS credits if SMS is enabled
    if (smsOptions.sendSMS) {
      const studentsWithMarks = validMarks.filter(mark => mark.marks > 0);
      let requiredCredits = studentsWithMarks.length; // Student SMS count
      
      // Add parent SMS count if enabled
      if (smsOptions.sendToParents) {
        const studentsWithParents = studentsWithMarks.filter(mark => {
          const student = getStudentInfo(mark.studentId);
          return student && student.parent_phone_number;
        });
        requiredCredits += studentsWithParents.length;
      }
      
      if (currentCredits === 0) {
        toast({
          title: "❌ SMS Balance End",
          description: "আপনার SMS ব্যালেন্স শেষ! Admin এর সাথে যোগাযোগ করুন নতুন SMS এর জন্য।",
          variant: "destructive",
        });
        return;
      }
      
      if (requiredCredits > currentCredits) {
        toast({
          title: "❌ Insufficient SMS Credits",
          description: `আপনার ${requiredCredits} SMS প্রয়োজন (${smsOptions.sendToParents ? 'students + parents' : 'students only'}) কিন্তু ${currentCredits} আছে। Admin এর সাথে যোগাযোগ করুন।`,
          variant: "destructive",
        });
        return;
      }
    }

    updateMarksMutation.mutate({ 
      studentMarks: validMarks, 
      smsOptions 
    });
  };

  const getStudentInfo = (studentId: string) => {
    return examStudents.find((student: any) => student.id === studentId);
  };

  const previewSMS = (studentMark: StudentMark) => {
    const student = getStudentInfo(studentMark.studentId);
    if (!student) return '';

    // Improved SMS format (65 chars max) - teachers cannot edit
    const studentName = `${student.firstName} ${student.lastName}`;
    const scoreText = `Got ${studentMark.marks}/${exam.totalMarks} marks in`;
    const signature = " -Belal Sir";
    const maxExamLength = 65 - studentName.length - scoreText.length - signature.length - 4; // 4 for spaces and colon
    const examName = exam.title.length > maxExamLength ? exam.title.substring(0, maxExamLength) : exam.title;
    return `${studentName}: ${scoreText} ${examName}${signature}`;
  };

  // Filter students based on search
  const filteredStudents = examStudents.filter((student: any) => {
    if (!searchFilter) return true;
    return (
      student.studentId?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      student.firstName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      student.phoneNumber?.includes(searchFilter)
    );
  });

  // Calculate SMS cost - including parents
  const getActiveSMSCount = () => {
    const studentsWithMarks = studentMarks.filter(mark => mark.marks > 0);
    if (!smsOptions.sendSMS) return 0;
    
    let totalSMS = studentsWithMarks.length; // Student SMS count
    
    // Add parent SMS count if enabled
    if (smsOptions.sendToParents) {
      const studentsWithParents = studentsWithMarks.filter(mark => {
        const student = getStudentInfo(mark.studentId);
        return student && student.parent_phone_number;
      });
      totalSMS += studentsWithParents.length;
    }
    
    return totalSMS;
  };
  
  const totalSMSCost = getActiveSMSCount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📝 Exam Marks Entry - {exam?.title}
          </DialogTitle>
          <DialogDescription>
            Enter marks for {exam?.batchId ? `${exam.batchId} batch` : 'all'} students and send SMS notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exam Info */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg text-orange-700">📊 Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="font-semibold">Subject</Label>
                <p>{exam?.subject}</p>
              </div>
              <div>
                <Label className="font-semibold">Total Marks</Label>
                <p>{exam?.totalMarks}</p>
              </div>
              <div>
                <Label className="font-semibold">Exam Date</Label>
                <p>{exam ? new Date(exam.examDate).toLocaleDateString() : ''}</p>
              </div>
              <div>
                <Label className="font-semibold">Target Batch</Label>
                <p>{exam?.batchId || 'All Students'} ({examStudents.length} students)</p>
              </div>
            </CardContent>
          </Card>

          {/* Simple SMS Option */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Send Results via SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4">
                <Label className="font-semibold text-lg text-blue-700">📱 SMS Recipients Selection</Label>
                <p className="text-sm text-gray-600 mt-1">Choose who should receive exam result notifications</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <div>
                      <Label className="font-semibold">Send to Students</Label>
                      <p className="text-xs text-gray-600">
                        {studentMarks.filter(mark => mark.marks > 0).length} students with marks will receive SMS
                      </p>
                      {smsOptions.sendToStudents && (
                        <div className="mt-1 text-xs text-blue-700 font-mono">
                          📞 Numbers: {examStudents.filter(s => s.phoneNumber).map(s => s.phoneNumber).join(', ') || 'No phone numbers'}
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={smsOptions.sendToStudents}
                    onCheckedChange={(checked) => setSmsOptions({...smsOptions, sendToStudents: checked, sendSMS: checked || smsOptions.sendToParents})}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <Label className="font-semibold">Send to Parents</Label>
                      <p className="text-xs text-gray-600">
                        {studentMarks.filter(mark => {
                          if (mark.marks <= 0) return false;
                          const student = getStudentInfo(mark.studentId);
                          return student && student.parent_phone_number;
                        }).length} parents will receive SMS
                      </p>
                      {smsOptions.sendToParents && (
                        <div className="mt-1 text-xs text-green-700 font-mono">
                          📞 Numbers: {examStudents.filter(s => s.parent_phone_number).map(s => s.parent_phone_number).join(', ') || 'No parent numbers'}
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={smsOptions.sendToParents}
                    onCheckedChange={(checked) => setSmsOptions({...smsOptions, sendToParents: checked, sendSMS: smsOptions.sendToStudents || checked})}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                <div className="flex justify-between items-center">
                  <span>📊 SMS Summary:</span>
                  <span className="font-medium">
                    Total: {totalSMSCost} SMS 
                    {smsOptions.sendToParents && " (students + parents)"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Available SMS Credits: {(smsCreditsData as any)?.smsCredits || 0}
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  📱 SMS Format: "Student Name: Got 85/100 ExamName -Belal Sir" (Fixed format, cannot edit)
                </div>
              </div>
              
              {!smsOptions.sendSMS && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  💾 Results will be saved without SMS notifications. You can manually notify students later.
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Cost Info */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">SMS Cost Estimation</span>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-600 text-white">
                    {totalSMSCost} SMS × 1 Credit = {totalSMSCost} Credits
                  </Badge>
                  <p className="text-xs text-green-600 mt-1">From main SMS balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Marks Entry */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Enter Student Marks ({filteredStudents.length} students)
              </h3>
              <div className="flex items-center gap-2 max-w-xs">
                <Label className="text-sm">🔍 Search:</Label>
                <Input
                  placeholder="Student ID, Name, or Phone"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="grid gap-4">
              {filteredStudents.map((student: any, index: number) => {
                const studentMark = studentMarks.find(mark => mark.studentId === student.id);
                return (
                  <Card key={student.id} className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="grid md:grid-cols-5 gap-4 items-start">
                        <div className="md:col-span-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-blue-600 text-white text-xs font-mono">
                              {student.studentId}
                            </Badge>
                          </div>
                          <Label className="font-semibold text-gray-700 text-sm">
                            {student.firstName} {student.lastName}
                          </Label>
                          <p className="text-xs text-gray-500">
                            📱 {student.phoneNumber || 'No phone'}
                          </p>
                          <p className="text-xs text-green-600">
                            🏫 Batch: {student.batchId || exam?.batchId || 'All Students'}
                          </p>
                        </div>
                        
                        <div className="md:col-span-1">
                          <Label htmlFor={`marks-${student.id}`}>Marks (out of {exam?.totalMarks})</Label>
                          <Input
                            id={`marks-${student.id}`}
                            type="number"
                            min="0"
                            max={exam?.totalMarks}
                            value={studentMark?.marks || 0}
                            onChange={(e) => handleMarkChange(student.id, 'marks', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Fixed SMS Format (Cannot Edit)</Label>
                          <div className="p-3 bg-gray-100 border rounded text-sm">
                            <div className="text-gray-600 font-mono">
                              {(() => {
                                const studentName = `${student.firstName} ${student.lastName}`;
                                const scoreText = `Got ${studentMark?.marks || 0}/${exam?.totalMarks} marks in`;
                                const signature = " -Belal Sir";
                                const maxExamLength = 65 - studentName.length - scoreText.length - signature.length - 4;
                                const examName = exam?.title.length > maxExamLength ? exam.title.substring(0, maxExamLength) : exam?.title;
                                return `${studentName}: ${scoreText} ${examName}${signature}`;
                              })()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              📏 Length: {previewSMS(studentMark || { studentId: student.id, marks: studentMark?.marks || 0, feedback: '' }).length} chars (Max: 65)
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-1">
                          <Label>Character Count</Label>
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <div className="font-mono text-green-700">
                              {studentMark ? previewSMS(studentMark).length : 0}/65 chars
                            </div>
                            <div className="text-green-600 mt-1">
                              ✅ Under SMS limit
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              📊 Total students: {examStudents.length} | 
              ✅ Marks entered: {studentMarks.filter(mark => mark.marks > 0).length} |
              💸 SMS cost: {totalSMSCost} credits
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={updateMarksMutation.isPending || studentMarks.filter(mark => mark.marks > 0).length === 0}
                className={smsOptions.sendSMS ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
              >
                <Send className="w-4 h-4 mr-2" />
                {updateMarksMutation.isPending ? 'Updating...' : (smsOptions.sendSMS ? `Save Marks & Send ${totalSMSCost} SMS` : 'Save Marks Only')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}