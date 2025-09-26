/**
 * Monthly Exam Management Component
 * Organizes exams by month for easier monthly result calculations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Search, Eye, Edit, Trash2, Users, Clock, FileText, Trophy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExamModal } from '@/components/ExamModal';
import { ExamMarks } from '@/components/ExamMarks';
import { ExamResults } from '@/components/ExamResults';
import { format, parseISO, getMonth, getYear } from 'date-fns';

interface MonthlyExam {
  id: string;
  title: string;
  subject: 'science' | 'math';
  examDate: string;
  duration: number;
  totalMarks: number;
  batchId: string;
  createdBy: string;
  examType: string;
  examMode: 'online' | 'offline';
  isActive: boolean;
  batch?: {
    name: string;
    classLevel: string;
  };
}

interface MonthGroup {
  month: number;
  year: number;
  monthName: string;
  exams: MonthlyExam[];
}

export default function MonthlyExamManagement() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [selectedExamForMarks, setSelectedExamForMarks] = useState<any>(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Years for dropdown (current year and past/future 2 years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  
  // Months
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Fetch all exams
  const { data: examResponse = [], isLoading } = useQuery({
    queryKey: ['/api/exams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/exams');
      return Array.isArray(response) ? response : [];
    },
  });

  const exams = Array.isArray(examResponse) ? examResponse : [];

  // Group exams by month and year
  const groupExamsByMonth = (exams: MonthlyExam[]): MonthGroup[] => {
    const groups: { [key: string]: MonthGroup } = {};
    
    exams.forEach(exam => {
      if (!exam.examDate) return;
      
      const examDate = new Date(exam.examDate);
      const month = getMonth(examDate) + 1; // getMonth returns 0-11
      const year = getYear(examDate);
      const key = `${year}-${month}`;
      
      if (!groups[key]) {
        groups[key] = {
          month,
          year,
          monthName: months.find(m => m.value === month)?.label || '',
          exams: []
        };
      }
      
      groups[key].exams.push(exam);
    });
    
    // Sort by year and month (newest first)
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  // Filter exams based on search and subject
  const filteredExams = exams.filter((exam: MonthlyExam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.batch?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || exam.subject === filterSubject;
    const matchesYear = selectedYear ? getYear(new Date(exam.examDate)) === selectedYear : true;
    const matchesMonth = selectedMonth ? getMonth(new Date(exam.examDate)) + 1 === selectedMonth : true;
    
    return matchesSearch && matchesSubject && matchesYear && matchesMonth;
  });

  const monthlyGroups = groupExamsByMonth(filteredExams);

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('DELETE', `/api/exams/${examId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      toast({
        title: "✅ Exam Deleted",
        description: "Exam has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete exam. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getSubjectColor = (subject: string) => {
    return subject === 'science' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const getExamModeColor = (mode: string) => {
    return mode === 'online' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
  };

  if (selectedExamForMarks) {
    return (
      <ExamMarks 
        exam={selectedExamForMarks}
        isOpen={true}
        onClose={() => setSelectedExamForMarks(null)}
      />
    );
  }

  if (selectedExamForResults) {
    return (
      <ExamResults 
        exam={selectedExamForResults}
        isOpen={true}
        onClose={() => setSelectedExamForResults(null)}
        userRole="teacher"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Monthly Exam Management</h1>
          <p className="text-gray-600 mt-2">
            Organize exams by month for easier monthly result calculations
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingExam(null);
            setIsExamModalOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Exam
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Filter & Search Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search Exams</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by title or batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Month</label>
              <Select value={selectedMonth?.toString() || 'all'} onValueChange={(value) => setSelectedMonth(value === 'all' ? null : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div className="font-semibold">{filteredExams.length} exams found</div>
                <div>{monthlyGroups.length} months with exams</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Groups */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">Loading exams...</div>
          </CardContent>
        </Card>
      ) : monthlyGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Found</h3>
            <p className="text-gray-600 mb-6">
              {selectedMonth || selectedYear !== new Date().getFullYear() 
                ? 'No exams found for the selected period. Try adjusting your filters.'
                : 'No exams created yet. Create your first exam to get started.'
              }
            </p>
            <Button 
              onClick={() => {
                setEditingExam(null);
                setIsExamModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        monthlyGroups.map((group) => (
          <Card key={`${group.year}-${group.month}`} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{group.monthName} {group.year}</span>
                  <Badge variant="outline" className="ml-2">
                    {group.exams.length} exam{group.exams.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  For Monthly Results Calculation
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {group.exams.map((exam) => (
                  <div key={exam.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                          <Badge className={getSubjectColor(exam.subject)}>
                            {exam.subject === 'science' ? 'Science' : 'Mathematics'}
                          </Badge>
                          <Badge className={getExamModeColor(exam.examMode)}>
                            {exam.examMode}
                          </Badge>
                          {!exam.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(exam.examDate), 'dd MMM yyyy')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exam.duration} min
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {exam.totalMarks} marks
                          </div>
                          {exam.batch && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {exam.batch.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExamForMarks(exam)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Mark
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExamForResults(exam)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Trophy className="h-4 w-4 mr-1" />
                          Results
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingExam(exam);
                            setIsExamModalOpen(true);
                          }}
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteExamMutation.mutate(exam.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          disabled={deleteExamMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Exam Modal */}
      {isExamModalOpen && (
        <ExamModal
          isOpen={isExamModalOpen}
          editingExam={editingExam}
          onClose={() => {
            setIsExamModalOpen(false);
            setEditingExam(null);
          }}
        />
      )}
    </div>
  );
}