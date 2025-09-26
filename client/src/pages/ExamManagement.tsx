import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { SimpleExamModal } from '@/components/SimpleExamModal';
import { ExamMarkEntry } from '@/components/ExamMarkEntry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { FileText, Calendar, Clock, Users, Edit, Trash, Eye, BookOpen, Settings, GraduationCap, CalendarDays, FolderOpen, Plus, Calculator } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, getMonth, getYear, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Exam {
  id: string;
  title: string;
  subject: string;
  targetClass?: string;
  chapter?: string;
  examDate: string;
  duration: number;
  examType: string;
  examMode: string;
  totalMarks?: number;
  isActive: boolean;
  createdAt: string;
}

export default function ExamManagement() {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [markEntryExamId, setMarkEntryExamId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch exams
  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('DELETE', `/api/exams/${examId}`);
      if (!response.ok) throw new Error('Failed to delete exam');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      toast({
        title: "Success",
        description: "Exam deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete exam. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting exam:', error);
    },
  });

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleDeleteExam = (examId: string) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      deleteExamMutation.mutate(examId);
    }
  };

  const handleGradeExam = (examId: string) => {
    setLocation(`/teacher/exam-grading?examId=${examId}`);
  };

  const handleEnterMarks = (examId: string) => {
    setMarkEntryExamId(examId);
  };

  const handleModalClose = () => {
    setIsExamModalOpen(false);
    setEditingExam(null);
  };

  const handleMarkEntryClose = () => {
    setMarkEntryExamId(null);
  };

  // Filter exams by mode
  const regularExams = exams.filter(exam => exam.examMode === 'regular' || exam.examMode === 'offline');
  const onlineExams = exams.filter(exam => exam.examMode === 'online');

  // State for monthly view
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'all' | 'monthly'>('monthly');

  // Group exams by month
  const groupExamsByMonth = (examList: Exam[]) => {
    const monthGroups: { [key: string]: Exam[] } = {};
    
    examList.forEach(exam => {
      if (!exam.examDate) return;
      
      const examDate = parseISO(exam.examDate);
      const examYear = getYear(examDate);
      const examMonth = getMonth(examDate);
      
      if (examYear === selectedYear) {
        const monthKey = `${examYear}-${examMonth}`;
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(exam);
      }
    });
    
    return monthGroups;
  };

  const monthlyRegularExams = groupExamsByMonth(regularExams);
  const monthlyOnlineExams = groupExamsByMonth(onlineExams);

  // Get available years
  const availableYears = Array.from(new Set(exams.map(exam => 
    exam.examDate ? getYear(parseISO(exam.examDate)) : new Date().getFullYear()
  ))).sort((a, b) => b - a);

  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const getSubjectName = (subject: string) => {
    return subject === 'science' ? '🔬 বিজ্ঞান' : '➗ গণিত';
  };

  const getClassName = (targetClass?: string) => {
    if (!targetClass) return '';
    return targetClass === '9-10' ? 'নবম-দশম' : 'একাদশ-দ্বাদশ';
  };

  const renderMonthlyExamGroups = (monthlyExams: { [key: string]: Exam[] }, examMode: string) => {
    const sortedMonths = Object.keys(monthlyExams).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return monthB - monthA; // Latest month first
    });

    if (sortedMonths.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedYear} সালে কোন {examMode === 'regular' ? 'নিয়মিত' : 'অনলাইন'} পরীক্ষা নেই
            </h3>
            <p className="text-gray-600 mb-4">
              এই বছরের জন্য {examMode === 'regular' ? 'নিয়মিত' : 'অনলাইন'} পরীক্ষা তৈরি করুন।
            </p>
            <Button onClick={() => setIsExamModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              পরীক্ষা তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Accordion type="multiple" className="space-y-4">
        {sortedMonths.map(monthKey => {
          const [year, monthIndex] = monthKey.split('-').map(Number);
          const monthExams = monthlyExams[monthKey];
          const monthName = monthNames[monthIndex];
          
          return (
            <AccordionItem 
              key={monthKey} 
              value={monthKey}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-semibold">{monthName} {year}</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {monthExams.length} টি পরীক্ষা
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {monthExams.map(renderExamCard)}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  const renderExamCard = (exam: Exam) => (
    <Card key={exam.id} className="hover:shadow-lg transition-shadow" data-testid={`exam-card-${exam.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2" data-testid={`exam-title-${exam.id}`}>
              {exam.title}
            </CardTitle>
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Badge 
                variant={exam.subject === 'science' ? 'default' : 'secondary'}
                data-testid={`exam-subject-${exam.id}`}
              >
                {getSubjectName(exam.subject)}
              </Badge>
              <Badge 
                variant={exam.examMode === 'online' ? 'default' : 'outline'}
                className={exam.examMode === 'online' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
              >
                {exam.examMode === 'online' ? '📱 Online' : '📝 Regular'}
              </Badge>
              <Badge 
                variant={exam.isActive ? 'default' : 'outline'}
                className={exam.isActive ? 'bg-secondary' : ''}
                data-testid={`exam-status-${exam.id}`}
              >
                {exam.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleEditExam(exam)}
              data-testid={`edit-exam-${exam.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDeleteExam(exam.id)}
              data-testid={`delete-exam-${exam.id}`}
              disabled={deleteExamMutation.isPending}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exam.targetClass && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <GraduationCap className="w-4 h-4" />
              <span>{getClassName(exam.targetClass)}</span>
            </div>
          )}
          {exam.chapter && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>{exam.chapter}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span data-testid={`exam-date-${exam.id}`}>
              {format(new Date(exam.examDate), 'MMM dd, yyyy at h:mm a')}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span data-testid={`exam-duration-${exam.id}`}>
              {exam.duration} minutes
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span className="capitalize" data-testid={`exam-type-${exam.id}`}>
              {exam.examType === 'mcq' ? 'MCQ' : exam.examType === 'written' ? 'Written' : exam.examType === 'practical' ? 'Practical' : 'Mixed'}
            </span>
          </div>
          {exam.totalMarks && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Total: {exam.totalMarks} marks</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => handleEditExam(exam)}
            data-testid={`view-exam-${exam.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            onClick={() => handleEnterMarks(exam.id)}
            data-testid={`marks-exam-${exam.id}`}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Enter Marks
          </Button>
          {exam.examMode === 'regular' && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleGradeExam(exam.id)}
              data-testid={`grade-exam-${exam.id}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Grade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Exam Management"
          subtitle="Create and manage your Science & Math exams"
          onCreateExam={() => setIsExamModalOpen(true)}
          showCreateButton={true}
        />
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No Exams Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first exam! Choose between online MCQ exams with automatic grading or regular exams with manual grading.
              </p>
              <Button 
                onClick={() => setIsExamModalOpen(true)}
                size="lg"
                data-testid="create-first-exam-button"
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <FileText className="w-5 h-5 mr-2" />
                Create Your First Exam
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* View Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <Select value={viewMode} onValueChange={(value: 'all' | 'monthly') => setViewMode(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">📅 মাসিক ভিউ</SelectItem>
                      <SelectItem value="all">📋 সব পরীক্ষা</SelectItem>
                    </SelectContent>
                  </Select>

                  {viewMode === 'monthly' && (
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <Button 
                  onClick={() => setIsExamModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  নতুন পরীক্ষা
                </Button>
              </div>

              {viewMode === 'monthly' ? (
                <Tabs defaultValue="regular" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="regular" className="space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>নিয়মিত পরীক্ষা ({Object.values(monthlyRegularExams).flat().length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="online" className="space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>অনলাইন পরীক্ষা ({Object.values(monthlyOnlineExams).flat().length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="regular" className="space-y-4">
                    {renderMonthlyExamGroups(monthlyRegularExams, 'regular')}
                  </TabsContent>

                  <TabsContent value="online" className="space-y-4">
                    {renderMonthlyExamGroups(monthlyOnlineExams, 'online')}
                  </TabsContent>
                </Tabs>
              ) : (
                <Tabs defaultValue="regular" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="regular" className="space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>নিয়মিত পরীক্ষা ({regularExams.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="online" className="space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>অনলাইন পরীক্ষা ({onlineExams.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="regular" className="space-y-4">
                    {regularExams.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">কোন নিয়মিত পরীক্ষা নেই</h3>
                          <p className="text-gray-600 mb-4">
                            ম্যানুয়াল গ্রেডিং সহ ঐতিহ্যবাহী লিখিত/প্রযুক্তিগত পরীক্ষার জন্য নিয়মিত পরীক্ষা তৈরি করুন।
                          </p>
                          <Button onClick={() => setIsExamModalOpen(true)}>
                            নিয়মিত পরীক্ষা তৈরি করুন
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularExams.map(renderExamCard)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="online" className="space-y-4">
                    {onlineExams.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">কোন অনলাইন পরীক্ষা নেই</h3>
                          <p className="text-gray-600 mb-4">
                            স্বয়ংক্রিয় গ্রেডিং সহ MCQ পরীক্ষার জন্য অনলাইন পরীক্ষা তৈরি করুন।
                          </p>
                          <Button onClick={() => setIsExamModalOpen(true)}>
                            অনলাইন পরীক্ষা তৈরি করুন
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {onlineExams.map(renderExamCard)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </main>

      <SimpleExamModal 
        isOpen={isExamModalOpen} 
        onClose={handleModalClose}
        editingExam={editingExam}
      />
      
      {markEntryExamId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Enter Exam Marks</h2>
              <Button variant="ghost" onClick={handleMarkEntryClose}>✕</Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ExamMarkEntry
                examId={markEntryExamId}
                onClose={handleMarkEntryClose}
                enableSMS={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
