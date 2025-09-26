/**
 * Enhanced Attendance Management System
 * Uses academic calendar to determine working days and mark attendance accordingly
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, Users, CheckCircle, X, Clock, 
  UserCheck, UserX, Loader2, Save, AlertCircle,
  CalendarDays, School, Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  batchId: string;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  attendanceStatus: 'present' | 'excused' | 'absent';
  subject: string;
  notes?: string;
}

interface WorkingDay {
  date: string;
  dayName: string;
  isWorkingDay: boolean;
  dayType: string;
  notes?: string;
}

// Function to get available subjects based on class level
const getSubjectsForClass = (_classLevel: string | number): string[] => {
  // Simplified: only two core subjects after refactor
  return ['science', 'math'];
};

const subjects = ['science', 'math'];

export default function EnhancedAttendanceManagement() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedBatchData, setSelectedBatchData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('science');
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'excused' | 'absent'>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dayInfo, setDayInfo] = useState<WorkingDay | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      const batchData = batches.find(batch => batch.id === selectedBatch);
      setSelectedBatchData(batchData);
      
      // Reset subject if not available for this class level
      const availableSubjectsForBatch = getSubjectsForClass(batchData?.classLevel || '6');
      if (!availableSubjectsForBatch.includes(selectedSubject)) {
        setSelectedSubject(availableSubjectsForBatch[0] || 'science');
      }
      
      fetchStudents();
    }
  }, [selectedBatch, batches]);

  useEffect(() => {
    checkWorkingDay();
    if (selectedBatch && selectedDate) {
      fetchExistingAttendance();
    }
  }, [selectedDate, selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/teacher/dashboard', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.batches) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches');
    }
  };

  const fetchStudents = async () => {
    if (!selectedBatch) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/students', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        // Filter students by batch
        const batchStudents = data.students.filter((student: any) => 
          student.batchId === selectedBatch
        );
        setStudents(batchStudents);
        
        // Initialize attendance state
        const initialAttendance: Record<string, 'present' | 'excused' | 'absent'> = {};
        batchStudents.forEach((student: Student) => {
          initialAttendance[student.id] = 'present'; // Default to present
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWorkingDay = async () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    try {
      const response = await fetch(
        `/api/academic-calendar/${year}/${month}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success && data.calendar.dailyRecords) {
        const dayRecord = data.calendar.dailyRecords.find((record: any) => {
          const recordDate = new Date(record.date);
          return recordDate.toDateString() === date.toDateString();
        });
        
        if (dayRecord) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          setDayInfo({
            date: selectedDate,
            dayName: dayNames[date.getDay()],
            isWorkingDay: dayRecord.isWorkingDay,
            dayType: dayRecord.dayType,
            notes: dayRecord.notes
          });
        } else {
          // Default working day check (weekdays are working days)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          setDayInfo({
            date: selectedDate,
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
            isWorkingDay: !isWeekend,
            dayType: isWeekend ? 'holiday' : 'regular',
            notes: 'Calendar not configured for this day'
          });
        }
      }
    } catch (error) {
      console.error('Error checking working day:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await fetch(
        `/api/attendance/${selectedBatch}/${selectedDate}/${selectedSubject}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.attendance) {
          const existingAttendance: Record<string, 'present' | 'excused' | 'absent'> = {};
          const existingNotes: Record<string, string> = {};
          
          data.attendance.forEach((record: any) => {
            existingAttendance[record.studentId] = record.attendanceStatus || 'present';
            if (record.notes) {
              existingNotes[record.studentId] = record.notes;
            }
          });
          
          setAttendance(prev => ({ ...prev, ...existingAttendance }));
          setAttendanceNotes(prev => ({ ...prev, ...existingNotes }));
        }
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
    }
  };

  const setStudentAttendance = (studentId: string, status: 'present' | 'excused' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, 'present' | 'excused' | 'absent'> = {};
    students.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
  };

  const markAllExcused = () => {
    const newAttendance: Record<string, 'present' | 'excused' | 'absent'> = {};
    students.forEach(student => {
      newAttendance[student.id] = 'excused';
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance: Record<string, 'present' | 'excused' | 'absent'> = {};
    students.forEach(student => {
      newAttendance[student.id] = 'absent';
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    if (!dayInfo?.isWorkingDay) {
      toast({
        title: "Cannot Save",
        description: "Cannot mark attendance for non-working days",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        batchId: selectedBatch,
        date: selectedDate,
        subject: selectedSubject,
        attendanceStatus: attendance[student.id] || 'absent',
        notes: attendanceNotes[student.id] || ''
      }));

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          attendanceRecords,
          date: selectedDate,
          batchId: selectedBatch,
          subject: selectedSubject
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Attendance Saved",
          description: `Attendance marked for ${students.length} students`,
          variant: "default",
        });
      } else {
        setError(data.error || 'Failed to save attendance');
        toast({
          title: "Error",
          description: data.error || 'Failed to save attendance',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      setError('Failed to save attendance');
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDayTypeColor = (dayType: string) => {
    switch (dayType) {
      case 'regular': return 'bg-green-100 text-green-800';
      case 'holiday': return 'bg-red-100 text-red-800';
      case 'exam_day': return 'bg-blue-100 text-blue-800';
      case 'weather': return 'bg-gray-100 text-gray-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const excusedCount = Object.values(attendance).filter(status => status === 'excused').length;
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length;

  // Get available subjects for the selected batch
  const availableSubjects = selectedBatchData 
    ? getSubjectsForClass(selectedBatchData.classLevel || '6')
  : ['science', 'math'];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">✅ Smart Attendance System</h1>
          <p className="text-gray-600 mt-2">
            Calendar-based attendance marking with working day validation
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarDays className="h-4 w-4" />
          <span>Academic Calendar Integration</span>
        </div>
      </div>

      {/* Controls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="h-5 w-5" />
            <span>Attendance Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch
              </label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} - Class {batch.classLevel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject ({selectedBatchData ? `Class ${selectedBatchData.classLevel}` : ''})
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject === 'science' ? 'Science' : 'Math'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBatchData && (
                <p className="text-xs text-gray-500 mt-1">
                  Available for Class {selectedBatchData.classLevel}: {availableSubjects.map(s => s === 'science' ? 'Science' : 'Math').join(', ')}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button 
                onClick={markAllPresent} 
                size="sm" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!dayInfo?.isWorkingDay}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                All Present
              </Button>
              <Button 
                onClick={markAllExcused} 
                size="sm" 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                disabled={!dayInfo?.isWorkingDay}
              >
                <Clock className="h-4 w-4 mr-2" />
                All Excused
              </Button>
              <Button 
                onClick={markAllAbsent} 
                size="sm" 
                variant="outline"
                className="w-full"
                disabled={!dayInfo?.isWorkingDay}
              >
                <UserX className="h-4 w-4 mr-2" />
                All Absent
              </Button>
            </div>
          </div>

          {/* Day Information */}
          {dayInfo && (
            <div className={`p-4 rounded-lg border ${
              dayInfo.isWorkingDay 
                ? 'border-green-300 bg-green-50' 
                : 'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">
                      {dayInfo.dayName}, {new Date(dayInfo.date).toLocaleDateString()}
                    </div>
                    <Badge className={getDayTypeColor(dayInfo.dayType)}>
                      {dayInfo.dayType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {dayInfo.isWorkingDay ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    dayInfo.isWorkingDay ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {dayInfo.isWorkingDay ? 'Working Day' : 'Holiday/Non-Working Day'}
                  </span>
                </div>
              </div>
              {dayInfo.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Note:</strong> {dayInfo.notes}
                </div>
              )}
              {!dayInfo.isWorkingDay && (
                <div className="mt-2 text-sm text-red-700">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  Attendance cannot be marked for non-working days
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Attendance Summary */}
      {students.length > 0 && dayInfo?.isWorkingDay && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{students.length}</div>
              <div className="text-sm text-gray-500 mt-1">Total Students</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-500 mt-1">Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{excusedCount}</div>
              <div className="text-sm text-gray-500 mt-1">Excused</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-500 mt-1">Absent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Present Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Attendance List */}
      {selectedBatch && dayInfo && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Mark Attendance - {new Date(selectedDate).toLocaleDateString()}</span>
            </CardTitle>
            {dayInfo.isWorkingDay && (
              <Button 
                onClick={saveAttendance}
                disabled={isSaving || students.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </Button>
            )}
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading students...</span>
            </div>
          ) : !dayInfo.isWorkingDay ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Cannot mark attendance for non-working days</p>
              <p className="text-sm mt-2">Please select a working day or update the academic calendar</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students found in this batch</p>
              <p className="text-sm mt-2">Please select a different batch or add students</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const studentStatus = attendance[student.id] || 'absent';
                const getCardStyles = () => {
                  switch (studentStatus) {
                    case 'present': return 'border-green-300 bg-green-50';
                    case 'excused': return 'border-yellow-300 bg-yellow-50';
                    case 'absent': return 'border-red-300 bg-red-50';
                    default: return 'border-gray-300 bg-gray-50';
                  }
                };

                return (
                  <div 
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${getCardStyles()}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                        <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Present Button */}
                      <Button
                        onClick={() => setStudentAttendance(student.id, 'present')}
                        variant={studentStatus === 'present' ? "default" : "outline"}
                        size="sm"
                        className={
                          studentStatus === 'present'
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "border-green-300 text-green-600 hover:bg-green-50"
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Present
                      </Button>

                      {/* Excused Button */}
                      <Button
                        onClick={() => setStudentAttendance(student.id, 'excused')}
                        variant={studentStatus === 'excused' ? "default" : "outline"}
                        size="sm"
                        className={
                          studentStatus === 'excused'
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                        }
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Excused
                      </Button>

                      {/* Absent Button */}
                      <Button
                        onClick={() => setStudentAttendance(student.id, 'absent')}
                        variant={studentStatus === 'absent' ? "default" : "outline"}
                        size="sm"
                        className={
                          studentStatus === 'absent'
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "border-red-300 text-red-600 hover:bg-red-50"
                        }
                      >
                        <X className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
