/**
 * Academic Calendar Management Component
 * For teachers to manage working days, holidays, and monthly calendars
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, Save, Clock, CheckCircle, X, Plus, 
  School, Sun, CloudRain, AlertTriangle, Loader2,
  CalendarDays, Users, BookOpen, Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DayRecord {
  day: number;
  isWorking: boolean;
  dayType: string;
  note?: string;
  dayName: string;
}

interface CalendarData {
  summary: {
    year: number;
    month: number;
    totalWorkingDays: number;
    totalHolidays: number;
    isFinalized: boolean;
  } | null;
  dailyRecords: any[];
  year: number;
  month: number;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayTypes = [
  { value: 'regular', label: 'Regular Day', icon: <School className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  { value: 'holiday', label: 'Holiday', icon: <Sun className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  { value: 'exam_day', label: 'Exam Day', icon: <BookOpen className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  { value: 'weather', label: 'Weather Day', icon: <CloudRain className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
  { value: 'emergency', label: 'Emergency', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' }
];

export default function AcademicCalendarManagement() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayNote, setDayNote] = useState('');
  const [dayType, setDayType] = useState('regular');
  
  const { toast } = useToast();

  // Years for dropdown (current year and next 2 years)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);

  useEffect(() => {
    fetchCalendarData();
  }, [selectedYear, selectedMonth]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/academic-calendar/${selectedYear}/${selectedMonth}`,
        { credentials: 'include' }
      );
      const data = await response.json();

      if (data.success) {
        setCalendarData(data.calendar);
        initializeDayRecords(data.calendar);
      } else {
        setError('Failed to load calendar data');
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDayRecords = (calendar: CalendarData) => {
    const year = selectedYear;
    const month = selectedMonth;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const records: DayRecord[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayName = dayNames[date.getDay()];
      
      // Check if we have existing data for this day
      const existingRecord = calendar.dailyRecords?.find(
        (r: any) => new Date(r.date).getDate() === day
      );
      
      // Default: weekdays are working days, weekends are holidays
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      records.push({
        day,
        dayName,
        isWorking: existingRecord ? existingRecord.isWorkingDay : !isWeekend,
        dayType: existingRecord ? existingRecord.dayType : (isWeekend ? 'holiday' : 'regular'),
        note: existingRecord ? existingRecord.notes : ''
      });
    }
    
    setDayRecords(records);
  };

  const toggleWorkingDay = (day: number) => {
    setDayRecords(prev => prev.map(record => 
      record.day === day 
        ? { 
            ...record, 
            isWorking: !record.isWorking,
            dayType: !record.isWorking ? 'regular' : 'holiday'
          }
        : record
    ));
  };

  const editDayDetails = (day: number) => {
    const record = dayRecords.find(r => r.day === day);
    if (record) {
      setEditingDay(day);
      setDayNote(record.note || '');
      setDayType(record.dayType);
    }
  };

  const saveDayDetails = () => {
    if (editingDay) {
      setDayRecords(prev => prev.map(record => 
        record.day === editingDay 
          ? { 
              ...record,
              dayType: dayType,
              note: dayNote,
              isWorking: dayType !== 'holiday'
            }
          : record
      ));
      setEditingDay(null);
      setDayNote('');
      setDayType('regular');
    }
  };

  const saveCalendar = async () => {
    setIsSaving(true);
    setError('');

    try {
      const workingDaysData = dayRecords.map(record => ({
        day: record.day,
        isWorking: record.isWorking,
        dayType: record.dayType,
        note: record.note
      }));

      const response = await fetch(
        `/api/academic-calendar/${selectedYear}/${selectedMonth}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ workingDays: workingDaysData })
        }
      );

      const data = await response.json();

      if (data.success) {
        setCalendarData(data.calendar);
        toast({
          title: "Calendar Saved",
          description: `Academic calendar updated for ${months[selectedMonth - 1]} ${selectedYear}`,
          variant: "default",
        });
        
        // Refresh data
        await fetchCalendarData();
      } else {
        setError(data.error || 'Failed to save calendar');
        toast({
          title: "Error",
          description: data.error || 'Failed to save calendar',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving calendar:', error);
      setError('Failed to save calendar');
      toast({
        title: "Error",
        description: "Failed to save calendar",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDayTypeInfo = (dayType: string) => {
    return dayTypes.find(dt => dt.value === dayType) || dayTypes[0];
  };

  const workingDaysCount = dayRecords.filter(r => r.isWorking).length;
  const holidaysCount = dayRecords.filter(r => !r.isWorking).length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Academic Calendar Management</h1>
          <p className="text-gray-600 mt-2">
            Manage working days, holidays, and monthly schedules
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Monthly Planning System</span>
        </div>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-700">Select Month & Year:</span>
              
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={saveCalendar}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Calendar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Calendar Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{workingDaysCount}</div>
            <div className="text-sm text-gray-500 mt-1">Working Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{holidaysCount}</div>
            <div className="text-sm text-gray-500 mt-1">Holidays</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{dayRecords.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((workingDaysCount / dayRecords.length) * 100)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Working Ratio</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{months[selectedMonth - 1]} {selectedYear} - Daily Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading calendar...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {dayNames.map((dayName) => (
                <div key={dayName} className="p-2 text-center font-semibold text-gray-600 bg-gray-50 rounded">
                  {dayName.slice(0, 3)}
                </div>
              ))}
              
              {/* Calendar Days */}
              {dayRecords.map((record) => {
                const dayTypeInfo = getDayTypeInfo(record.dayType);
                
                return (
                  <div
                    key={record.day}
                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                      record.isWorking 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-red-300 bg-red-50'
                    }`}
                    onClick={() => editDayDetails(record.day)}
                  >
                    <div className="text-center">
                      <div className="font-bold text-lg">{record.day}</div>
                      <div className="text-xs text-gray-500 mb-1">{record.dayName.slice(0, 3)}</div>
                      
                      <Badge className={`text-xs ${dayTypeInfo.color} mb-1`}>
                        <div className="flex items-center space-x-1">
                          {dayTypeInfo.icon}
                          <span>{dayTypeInfo.label}</span>
                        </div>
                      </Badge>
                      
                      <div className="flex justify-center mt-1">
                        {record.isWorking ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      {record.note && (
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {record.note.slice(0, 10)}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend & Day Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {dayTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Badge className={`${type.color} flex items-center space-x-1`}>
                  {type.icon}
                  <span className="text-xs">{type.label}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Edit Dialog */}
      <Dialog open={editingDay !== null} onOpenChange={() => setEditingDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Day {editingDay} - {editingDay ? dayRecords[editingDay - 1]?.dayName : ''}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day Type
              </label>
              <Select value={dayType} onValueChange={setDayType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        {type.icon}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <Textarea
                value={dayNote}
                onChange={(e) => setDayNote(e.target.value)}
                placeholder="Add a note for this day (holiday reason, special event, etc.)"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingDay(null)}>
                Cancel
              </Button>
              <Button onClick={saveDayDetails} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
