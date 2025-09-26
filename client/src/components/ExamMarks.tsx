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
          marks: null, // Start with null marks, not 0 or empty string
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
      // Check if SMS was skipped due to insufficient balance
      if (result.smsSkipped) {
        toast({
          title: "🔴 নম্বর সংরক্ষিত - SMS পাঠানো হয়নি",
          description: `${result.marksSaved || studentMarks.length} students এর নম্বর সেভ হয়েছে। SMS ব্যালেন্স অপর্যাপ্ত! অ্যাডমিনের সাথে যোগাযোগ করুন।`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Marks Updated Successfully!",
          description: result.message || `Results saved for ${studentMarks.length} students.`,
          variant: "default",
        });
      }
      
      // Force refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-results'] });
      queryClient.invalidateQueries({ queryKey: [`/api/exams/${exam.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams/results-status'] });
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

  const handleMarkChange = (studentId: string, field: 'marks' | 'feedback', value: string | number | null) => {
    setStudentMarks(prev => 
      prev.map(mark => 
        mark.studentId === studentId 
          ? { ...mark, [field]: field === 'marks' ? (value === null ? null : Number(value)) : value }
          : mark
      )
    );
  };

  const handleSubmit = () => {
    // Check if all marks are filled (no empty strings, null, undefined, but 0 is valid)
    const allMarksFilled = studentMarks.every(mark => 
      mark.marks !== '' && 
      mark.marks !== null && 
      mark.marks !== undefined && 
      String(mark.marks).trim() !== '' &&
      Number(mark.marks) >= 0
    );
    
    if (!allMarksFilled) {
      toast({
        title: "❌ Incomplete Marks Entry",
        description: "দয়া করে সব ছাত্রের নম্বর দিন। খালি রাখা যাবে না।",
        variant: "destructive",
      });
      return;
    }
    
    const validMarks = studentMarks.filter(mark => Number(mark.marks) >= 0 && Number(mark.marks) <= (exam.totalMarks || 100));
    
    if (validMarks.length === 0) {
      toast({
        title: "No Valid Marks",
        description: "Please enter valid marks for at least one student.",
        variant: "destructive",
      });
      return;
    }

    const currentCredits = (smsCreditsData as any)?.smsCredits || 0;
    
    // Check SMS credits if SMS is enabled - but still allow marks saving
    let willSkipSMS = false;
    let smsSkipMessage = '';
    
    if (smsOptions.sendSMS) {
      let requiredCredits = 0;
      
      // Calculate SMS count correctly - ADDITIVE when both selected (include 0 marks)
      const allStudentsWithMarks = validMarks; // Include students with 0 marks too
      
      if (smsOptions.sendToStudents) {
        // Student SMS count (including 0 marks)
        requiredCredits += allStudentsWithMarks.length;
      }
      
      if (smsOptions.sendToParents) {
        // Parent SMS count (separate from students, including 0 marks)
        const studentsWithParents = allStudentsWithMarks.filter(mark => {
          const student = getStudentInfo(mark.studentId);
          return student && student.parentPhoneNumber;
        });
        requiredCredits += studentsWithParents.length;
      }
      
      if (currentCredits === 0 || requiredCredits > currentCredits) {
        willSkipSMS = true;
        if (currentCredits === 0) {
          smsSkipMessage = 'আপনার SMS ব্যালেন্স শেষ! নম্বর সংরক্ষিত হয়েছে কিন্তু SMS পাঠানো হয়নি।';
        } else {
          smsSkipMessage = `${requiredCredits} SMS প্রয়োজন কিন্তু ${currentCredits} আছে। নম্বর সংরক্ষিত হয়েছে কিন্তু SMS পাঠানো হয়নি।`;
        }
      }
    }

    // Submit marks with modified SMS options if balance insufficient
    const finalSMSOptions = willSkipSMS ? { ...smsOptions, sendSMS: false } : smsOptions;
    
    updateMarksMutation.mutate({ 
      studentMarks: validMarks, 
      smsOptions: finalSMSOptions 
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

  // Calculate SMS cost - including parents (FIXED LOGIC) 
  const getActiveSMSCount = () => {
    // Count students with any marks entered (including 0, but not null/empty)
    const studentsWithMarks = studentMarks.filter(mark => 
      mark.marks !== null && 
      mark.marks !== undefined && 
      mark.marks !== '' && 
      String(mark.marks).trim() !== '' &&
      Number(mark.marks) >= 0  // Include 0 marks as valid
    );
    
    if (!smsOptions.sendSMS || studentsWithMarks.length === 0) return 0;
    
    let totalSMS = 0;
    
    // Fixed SMS counting logic - ADDITIVE when both selected (include 0 marks)
    if (smsOptions.sendToStudents) {
      // Student SMS count - all students with marks (including 0)
      totalSMS += studentsWithMarks.length;
    }
    
    if (smsOptions.sendToParents) {
      // Parent SMS count - students with marks AND parent phone numbers (including 0)
      const studentsWithParents = studentsWithMarks.filter(mark => {
        const student = getStudentInfo(mark.studentId);
        return student && student.parentPhoneNumber;
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
                        {studentMarks.filter(mark => mark.marks !== null && mark.marks !== undefined && mark.marks !== '' && Number(mark.marks) >= 0).length} students with marks will receive SMS
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
                          if (mark.marks === null || mark.marks === undefined || mark.marks === '' || Number(mark.marks) < 0) return false;
                          const student = getStudentInfo(mark.studentId);
                          return student && student.parentPhoneNumber;
                        }).length} parents will receive SMS
                      </p>
                      {smsOptions.sendToParents && (
                        <div className="mt-1 text-xs text-green-700 font-mono">
                          📞 Numbers: {examStudents.filter(s => s.parentPhoneNumber).map(s => s.parentPhoneNumber).join(', ') || 'No parent numbers'}
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
                <div className={`mt-1 text-xs font-semibold ${
                  ((smsCreditsData as any)?.smsCredits || 0) === 0 ? 'text-red-600' : 
                  ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost ? 'text-orange-600' : 
                  'text-green-600'
                }`}>
                  Available SMS Credits: {(smsCreditsData as any)?.smsCredits || 0}
                  {((smsCreditsData as any)?.smsCredits || 0) === 0 && (
                    <span className="ml-2 text-red-600">⚠️ No Balance!</span>
                  )}
                  {((smsCreditsData as any)?.smsCredits || 0) > 0 && ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && (
                    <span className="ml-2 text-orange-600">⚠️ Insufficient!</span>
                  )}
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

          {/* SMS Balance Warning - Show when insufficient */}
          {((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0 && (
            <Card className="bg-red-50 border-red-300 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <MessageSquare className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 text-lg">🔴 SMS Balance Insufficient!</h3>
                    <p className="text-red-700 text-sm mt-1">
                      Need: <span className="font-bold">{totalSMSCost} SMS</span>, Available: <span className="font-bold">{(smsCreditsData as any)?.smsCredits || 0} SMS</span>
                    </p>
                    <p className="text-red-600 text-sm font-semibold mt-2">
                      💾 Marks will be saved but SMS will NOT be sent. Contact admin for SMS credits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMS Cost Info */}
          <Card className={`${
            ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0 ? 
            'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className={`w-5 h-5 ${
                    ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0 ? 
                    'text-orange-600' : 'text-green-600'
                  }`} />
                  <span className={`font-semibold ${
                    ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0 ? 
                    'text-orange-700' : 'text-green-700'
                  }`}>SMS Cost Estimation</span>
                </div>
                <div className="text-right">
                  <Badge className={`${
                    ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0 ? 
                    'bg-orange-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {totalSMSCost} SMS × 1 Credit = {totalSMSCost} Credits
                  </Badge>
                  <p className={`text-xs mt-1 ${
                    ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0 ? 
                    'text-orange-600' : 'text-green-600'
                  }`}>From main SMS balance</p>
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
                            step="1"
                            value={studentMark?.marks === null || studentMark?.marks === undefined ? '' : studentMark?.marks}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow valid numbers or empty string
                              if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                                handleMarkChange(student.id, 'marks', value === '' ? null : Number(value));
                              }
                            }}
                            onKeyPress={(e) => {
                              // Only allow numbers, backspace, delete, tab, escape, enter
                              if (!/[\d\.\-\+eE]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="Required: Enter marks (0-100)"
                            className="w-full"
                            required
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
              ✅ Marks entered: {studentMarks.filter(mark => mark.marks !== null && mark.marks !== undefined && mark.marks !== '' && Number(mark.marks) >= 0).length} |
              💸 SMS cost: {totalSMSCost} credits
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={updateMarksMutation.isPending || !studentMarks.every(mark => 
                  mark.marks !== '' && 
                  mark.marks !== null && 
                  mark.marks !== undefined && 
                  Number(mark.marks) >= 0 && 
                  String(mark.marks).trim() !== ''
                )}
                className={
                  !studentMarks.every(mark => 
                    mark.marks !== '' && 
                    mark.marks !== null && 
                    mark.marks !== undefined && 
                    Number(mark.marks) >= 0 && 
                    String(mark.marks).trim() !== ''
                  )
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : (smsOptions.sendSMS ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")
                }
                title={!studentMarks.every(mark => 
                  mark.marks !== '' && 
                  mark.marks !== null && 
                  mark.marks !== undefined && 
                  Number(mark.marks) >= 0 && 
                  String(mark.marks).trim() !== ''
                ) ? 'দয়া করে সব ছাত্রের নম্বর দিন' : ''}
              >
                <Send className="w-4 h-4 mr-2" />
                {updateMarksMutation.isPending 
                  ? 'Saving Marks...' 
                  : !studentMarks.every(mark => 
                      mark.marks !== '' && 
                      mark.marks !== null && 
                      mark.marks !== undefined && 
                      mark.marks !== 0 && 
                      String(mark.marks).trim() !== ''
                    )
                    ? '🔒 সব নম্বর দিন প্রথমে'
                    : ((smsCreditsData as any)?.smsCredits || 0) < totalSMSCost && totalSMSCost > 0
                    ? `🔴 Save Marks (SMS Skipped - No Balance)`
                    : (smsOptions.sendSMS ? `Save Marks & Send ${totalSMSCost} SMS` : 'Save Marks Only')
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
