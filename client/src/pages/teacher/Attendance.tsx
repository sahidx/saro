import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft, 
  CalendarCheck, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Save,
  Calendar,
  Clock,
  User
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  phoneNumber?: string;
  parentPhoneNumber?: string;
  batchId: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  batchCode: string;
  currentStudents: number;
}

interface AttendanceRecord {
  studentId: string;
  isPresent: boolean;
  notes?: string;
}

export default function Attendance() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: AttendanceRecord }>({});
  const [sendSMS, setSendSMS] = useState<boolean>(true);
  
  // Fetch batches
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
  });

  // Fetch students for selected batch
  const { data: students = [], refetch: refetchStudents } = useQuery<Student[]>({
    queryKey: [`/api/batches/${selectedBatch}/students`],
    enabled: !!selectedBatch,
  });

  // Fetch SMS credits for validation
  const { data: smsCreditsData } = useQuery({
    queryKey: ['/api/user/sms-credits'],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch existing attendance for selected date and batch
  const { data: existingAttendance = [] } = useQuery<any[]>({
    queryKey: ['/api/attendance/batch', selectedBatch, selectedDate],
    enabled: !!selectedBatch && !!selectedDate,
  });

  // Initialize attendance records when students or existing attendance changes
  useEffect(() => {
    if (students.length > 0) {
      const records: { [key: string]: AttendanceRecord } = {};
      
      students.forEach(student => {
        const existing = existingAttendance.find((att: any) => att.studentId === student.id);
        records[student.id] = {
          studentId: student.id,
          isPresent: existing ? existing.isPresent : true, // Default to present
          notes: existing ? existing.notes || '' : ''
        };
      });
      
      setAttendanceRecords(records);
    }
  }, [students, existingAttendance]);

  // Use all batches directly
  const filteredBatches = batches || [];

  // Take attendance mutation
  const takeAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/attendance/take', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success! ✅",
        description: data.message || "Attendance recorded successfully",
      });
      
      // Show attendance summary
      if (data.summary) {
        toast({
          title: "📊 Attendance Summary",
          description: `Total: ${data.summary.total} | Present: ${data.summary.present} | Absent: ${data.summary.absent}`,
        });
      }
      
      // Show SMS results if available
      if (data.smsResults) {
        const { totalSent, totalFailed } = data.smsResults;
        if (totalSent > 0) {
          toast({
            title: "📱 SMS Notifications Sent",
            description: `Successfully sent ${totalSent} SMS${totalFailed > 0 ? `, ${totalFailed} failed` : ''}`,
          });
        } else if (totalFailed > 0) {
          toast({
            title: "⚠️ SMS Failed",
            description: `Failed to send ${totalFailed} SMS notifications. Check your SMS balance.`,
            variant: "destructive",
          });
        }
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      
      // Clear attendance records for fresh start
      setAttendanceRecords({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
      console.error('Error recording attendance:', error);
    },
  });

  const handleAttendanceChange = (studentId: string, field: 'isPresent', value: boolean) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSubmit = () => {
    if (!selectedBatch) {
      toast({
        title: "Missing Information",
        description: "Please select a batch",
        variant: "destructive",
      });
      return;
    }

    const attendanceData = Object.values(attendanceRecords);
    const currentCredits = (smsCreditsData as any)?.smsCredits || 0;
    
    // Check SMS credits if SMS is enabled
    if (sendSMS) {
      // Count students with parent phone numbers (only they will receive SMS)
      const studentsWithParentNumbers = students.filter(student => student.parentPhoneNumber);
      const requiredCredits = studentsWithParentNumbers.length;
      
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
          description: `আপনার ${requiredCredits} SMS প্রয়োজন কিন্তু ${currentCredits} আছে। Admin এর সাথে যোগাযোগ করুন।`,
          variant: "destructive",
        });
        return;
      }
    }
    
    const selectedBatchObj = batches?.find(b => b.id === selectedBatch);
    
    // Show SMS preview if SMS is enabled
    if (sendSMS) {
      const studentsWithParentNumbers = students.filter(student => student.parentPhoneNumber);
      toast({
        title: "📱 Sending SMS Notifications",
        description: `Attendance SMS will be sent to ${studentsWithParentNumbers.length} parents. Required credits: ${studentsWithParentNumbers.length}`,
      });
    }
    
    takeAttendanceMutation.mutate({
      batchId: selectedBatch,
      subject: selectedBatchObj?.subject || '',
      date: selectedDate,
      attendanceData,
      sendSMS
    });
  };

  const markAllPresent = () => {
    const updatedRecords = { ...attendanceRecords };
    Object.keys(updatedRecords).forEach(studentId => {
      updatedRecords[studentId].isPresent = true;
    });
    setAttendanceRecords(updatedRecords);
  };

  const markAllAbsent = () => {
    const updatedRecords = { ...attendanceRecords };
    Object.keys(updatedRecords).forEach(studentId => {
      updatedRecords[studentId].isPresent = false;
    });
    setAttendanceRecords(updatedRecords);
  };

  // Calculate statistics
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceRecords).filter(record => record.isPresent).length;
  const absentCount = totalStudents - presentCount;

  const isDarkMode = false; // Get from theme context

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header - Mobile Optimized with Sticky */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-slate-900/80 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center space-x-1 hover:bg-orange-50 dark:hover:bg-slate-700 px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarCheck className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-orange-600'}`} />
            <h1 className={`text-base sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="hidden sm:inline">Take Attendance</span>
              <span className="sm:hidden">Attendance</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:p-6">
        {/* Mobile Batch Info Banner */}
        {selectedBatch && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg sm:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  {batches?.find(b => b.id === selectedBatch)?.name}
                </h3>
                <p className="text-sm text-blue-700">
                  {batches?.find(b => b.id === selectedBatch)?.subject} • {selectedDate}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {students.length} students
              </Badge>
            </div>
          </div>
        )}

        {/* Selection Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 sm:mb-6">
          {/* Batch Selection */}
          <Card className="border border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">Select Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedBatch}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Choose batch" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBatches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} - {batch.subject} ({batch.currentStudents} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card className="border border-green-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-green-200 h-12 text-base"
              />
            </CardContent>
          </Card>

          {/* SMS Toggle & Balance */}
          <Card className="border border-purple-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
                SMS Notifications
                {smsCreditsData ? (
                  <Badge className="ml-2 bg-purple-100 text-purple-800">
                    {(smsCreditsData as any)?.smsCredits || 0} SMS
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms"
                      checked={sendSMS}
                      onCheckedChange={(checked) => setSendSMS(checked === true)}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="sms" className="text-sm font-medium cursor-pointer">
                      Send to parents
                    </Label>
                  </div>
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                
                {/* SMS Cost Estimate */}
                {sendSMS && selectedBatch && students.length > 0 && (
                  <div className="text-xs bg-purple-50 p-2 rounded">
                    <div className="flex justify-between items-center">
                      <span>SMS Required:</span>
                      <span className="font-medium">
                        {students.filter(s => s.parentPhoneNumber).length} SMS
                      </span>
                    </div>
                    {smsCreditsData ? (
                      <div className="flex justify-between items-center mt-1">
                        <span>Balance After:</span>
                        <span className={`font-medium ${
                          ((smsCreditsData as any)?.smsCredits || 0) - students.filter(s => s.parentPhoneNumber).length >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {((smsCreditsData as any)?.smsCredits || 0) - students.filter(s => s.parentPhoneNumber).length} SMS
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards - Mobile Optimized */}
        {selectedBatch && students.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{totalStudents}</div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-800 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{presentCount}</div>
              </CardContent>
            </Card>

            <Card className="border border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-800 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Absent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{absentCount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions - Mobile Optimized */}
        {selectedBatch && students.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
            <Button
              onClick={markAllPresent}
              className="bg-green-600 hover:bg-green-700 text-white py-4 font-medium rounded-lg shadow-lg active:scale-95 transition-all"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              All Present
            </Button>
            <Button
              onClick={markAllAbsent}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 py-4 font-medium rounded-lg shadow-lg active:scale-95 transition-all border-2"
              size="lg"
            >
              <XCircle className="w-5 h-5 mr-2" />
              All Absent
            </Button>
          </div>
        )}

        {/* Student Attendance List - Mobile Optimized */}
        {selectedBatch && students.length > 0 && (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <User className="w-5 h-5 mr-2" />
                Student Attendance ({students.length} students)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {students.map(student => (
                  <div key={student.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                    {/* Student Info - Mobile Friendly */}
                    <div className="flex flex-col space-y-3">
                      {/* Top Row: Student Details */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-lg">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex flex-col sm:flex-row sm:space-x-4">
                              <span>ID: {student.studentId}</span>
                              {student.phoneNumber && (
                                <span className="flex items-center mt-1 sm:mt-0">
                                  📱 <span className="ml-1 font-mono">{student.phoneNumber}</span>
                                </span>
                              )}
                            </div>
                            {student.parentPhoneNumber && (
                              <div className="flex items-center mt-1 text-blue-600">
                                👨‍👩‍👧‍👦 <span className="ml-1 font-mono">{student.parentPhoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Badge - Always Visible */}
                        <Badge 
                          className={`text-sm px-3 py-1 ${
                            attendanceRecords[student.id]?.isPresent
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {attendanceRecords[student.id]?.isPresent ? '✅ Present' : '❌ Absent'}
                        </Badge>
                      </div>
                      
                      {/* Mobile Optimized Present/Absent Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          size="lg"
                          onClick={() => handleAttendanceChange(student.id, 'isPresent', true)}
                          className={`w-full text-base py-4 font-medium rounded-lg transition-all duration-200 active:scale-95 ${
                            attendanceRecords[student.id]?.isPresent
                              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg border-2 border-green-500'
                              : 'bg-gray-200 text-gray-600 hover:bg-green-100 border-2 border-gray-300 hover:border-green-300'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Present
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => handleAttendanceChange(student.id, 'isPresent', false)}
                          className={`w-full text-base py-4 font-medium rounded-lg transition-all duration-200 active:scale-95 ${
                            !attendanceRecords[student.id]?.isPresent
                              ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg border-2 border-red-500'
                              : 'bg-gray-200 text-gray-600 hover:bg-red-100 border-2 border-gray-300 hover:border-red-300'
                          }`}
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          Absent
                        </Button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button - Mobile Optimized */}
              <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white/90 backdrop-blur-sm pb-safe">
                <Button
                  onClick={handleSubmit}
                  disabled={takeAttendanceMutation.isPending || !selectedBatch}
                  size="lg"
                  className="w-full py-5 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[60px]"
                >
                  <Save className="w-6 h-6 mr-3" />
                  <span className="text-center">
                    {takeAttendanceMutation.isPending 
                      ? 'Saving Attendance...' 
                      : (
                        <>
                          <span className="block sm:inline">Save Attendance</span>
                          {sendSMS && <span className="block sm:inline sm:ml-1">& Send SMS</span>}
                        </>
                      )
                    }
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {selectedBatch && students.length === 0 && (
          <Card className="border border-gray-200 text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                No students are enrolled in this batch yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!selectedBatch && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="py-6">
              <div className="text-center">
                <CalendarCheck className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">Take Attendance</h3>
                <p className="text-blue-700 mb-4">
                  Select subject and batch to start taking attendance for your Science & Math classes.
                </p>
                <div className="text-sm text-blue-600">
                  <p>✅ Mark students as Present or Absent</p>
                  <p>📱 Send SMS notifications to parents automatically</p>
                  <p>📝 Add optional notes for each student</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
