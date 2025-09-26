import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Clock, Users, Calendar, FileText, Search, Eye, Edit, Trash2, Trophy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExamModal } from '@/components/ExamModal';
import { ExamMarks } from '@/components/ExamMarks';
import { QuestionViewer } from '@/components/QuestionViewer';
import { ExamResults } from '@/components/ExamResults';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Exams() {
  const [, navigate] = useLocation();
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [selectedExamForMarks, setSelectedExamForMarks] = useState<any>(null);
  const [selectedExamForViewing, setSelectedExamForViewing] = useState<any>(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [examToDelete, setExamToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check URL parameters to redirect to online exam creation page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'online-exam') {
      console.log('Redirecting to online exam creation page...');
      navigate('/teacher/online-exam-creation');
    }
  }, [navigate]);

  // Fetch exams with Science & Math filtering
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['/api/exams'],
  });

  // Function to check if exam has marks entered
  const { data: examResultsStatus = {}, isLoading: isLoadingResults } = useQuery({
    queryKey: ['/api/exams/results-status'],
    enabled: exams.length > 0,
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('DELETE', `/api/exams/${examId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      toast({
        title: "Success",
        description: "Exam deleted successfully!",
      });
      setExamToDelete(null);
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

  const handleDeleteExam = (exam: any) => {
    setExamToDelete(exam);
  };

  const confirmDeleteExam = () => {
    if (examToDelete) {
      deleteExamMutation.mutate(examToDelete.id);
    }
  };

  // Filter exams for Science and Math only
  const filteredExams = (exams as any[]).filter((exam: any) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || 
                          exam.subject.toLowerCase() === filterSubject.toLowerCase();
    
    // Only show Science and Math exams (case-insensitive)
    const validSubject = ['science', 'math'].includes(exam.subject.toLowerCase());
    
    return matchesSearch && matchesSubject && validSubject;
  });

  const getExamStatus = (exam: any) => {
    const now = new Date();
    const examDate = new Date(exam.examDate);
    
    if (now < examDate) return { status: "Upcoming", color: "bg-blue-500" };
    if (now.toDateString() === examDate.toDateString()) return { status: "Today", color: "bg-green-500" };
    return { status: "Completed", color: "bg-gray-500" };
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'science': return '🧪';
      case 'math': return '�';
      default: return '📚';
    }
  };

  const isDarkMode = false; // Get from theme context if available

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 hover:bg-orange-50 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-orange-600'}`} />
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Exam Management - Science & Math Only
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsExamModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              data-testid="button-create-exam"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Science/Math Exam
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {/* Filters */}
        <Card className="mb-6 bg-white/80 border-orange-200/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-orange-700">Filter Exams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search Exams</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by title or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-exam"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Subject</label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger data-testid="select-filter-subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="science">🧪 Science</SelectItem>
                    <SelectItem value="math">� Math</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <Card className="text-center py-12 bg-white/80 border-orange-200/50">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Science or Math Exams Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterSubject !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first exam for Science or Math'}
              </p>
              <Button 
                onClick={() => setIsExamModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam: any) => {
              const status = getExamStatus(exam);
              return (
                <Card 
                  key={exam.id} 
                  className="bg-white/90 border-orange-200/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  data-testid={`exam-card-${exam.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 text-gray-800 line-clamp-2">
                          {getSubjectIcon(exam.subject)} {exam.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className="bg-orange-100 text-orange-700 border-orange-200"
                          >
                            {exam.subject === 'science' ? 'Science' : 'Math'}
                          </Badge>
                          <Badge 
                            className={`${status.color} text-white`}
                            data-testid={`badge-status-${exam.id}`}
                          >
                            {status.status}
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            {exam.examMode === 'online' ? '📱 Online' : '📝 Offline'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(exam.examDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {exam.duration} min
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {exam.totalMarks} marks
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        {exam.examType.toUpperCase()}
                      </div>
                    </div>

                    {/* Question Content Display */}
                    {exam.questionContent && (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          {exam.questionSource === 'drive_link' ? '📎 Question Document' : '🖼️ Question Image'}
                        </div>
                        {exam.questionSource === 'drive_link' ? (
                          <a 
                            href={exam.questionContent} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Open Google Drive Document
                          </a>
                        ) : (
                          exam.questionContent.startsWith('data:image') ? (
                            <img 
                              src={exam.questionContent} 
                              alt="Exam Question" 
                              className="w-full max-h-32 object-contain rounded border"
                            />
                          ) : (
                            <div className="text-xs text-gray-500">
                              📄 Question content available
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                        data-testid={`button-view-exam-${exam.id}`}
                        onClick={() => setSelectedExamForViewing(exam)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                        data-testid={`button-results-exam-${exam.id}`}
                        onClick={() => setSelectedExamForResults(exam)}
                      >
                        <Trophy className="w-3 h-3 mr-1" />
                        Results
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                        data-testid={`button-edit-exam-${exam.id}`}
                        onClick={() => {
                          setEditingExam(exam);
                          setIsExamModalOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="px-2 border-red-200 text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-exam-${exam.id}`}
                        onClick={() => handleDeleteExam(exam)}
                        disabled={deleteExamMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      {/* Conditional Button - Either Enter Marks OR View Results */}
                      {examResultsStatus[exam.id]?.hasResults ? (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          data-testid={`button-view-results-exam-${exam.id}`}
                          onClick={() => setSelectedExamForResults(exam)}
                        >
                          🏆 View Results
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-marks-exam-${exam.id}`}
                          onClick={() => setSelectedExamForMarks(exam)}
                        >
                          📝 Enter Marks
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Exam Creation/Edit Modal */}
      <ExamModal 
        isOpen={isExamModalOpen} 
        onClose={() => {
          setIsExamModalOpen(false);
          setEditingExam(null);
        }}
        editingExam={editingExam}
      />

      {/* Exam Marks Modal */}
      {selectedExamForMarks && (
        <ExamMarks
          exam={selectedExamForMarks}
          isOpen={!!selectedExamForMarks}
          onClose={() => setSelectedExamForMarks(null)}
        />
      )}

      {/* Question Viewer Modal */}
      {selectedExamForViewing && (
        <QuestionViewer
          exam={selectedExamForViewing}
          isOpen={!!selectedExamForViewing}
          onClose={() => setSelectedExamForViewing(null)}
        />
      )}

      {/* Exam Results Modal */}
      {selectedExamForResults && (
        <ExamResults
          exam={selectedExamForResults}
          isOpen={!!selectedExamForResults}
          onClose={() => setSelectedExamForResults(null)}
          userRole="teacher"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the exam "{examToDelete?.title}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteExam}
              disabled={deleteExamMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteExamMutation.isPending ? "Deleting..." : "Delete Exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
