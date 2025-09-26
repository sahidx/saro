import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  BookOpen,
  FileText,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Trophy,
  User,
  Atom,
  Cpu,
  Download,
  ArrowLeft
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  title: string;
  description: string;
  driveLink: string;
  questionType: string;
  subject: string;
  category: string;
  chapter: string;
  difficulty: string;
  marks: number;
  createdAt: string;
}

interface QuestionBankResponse {
  questions: Question[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
}

export default function StudentQuestionBank() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnswers, setShowAnswers] = useState<{ [key: string]: boolean }>({});

  // Track download mutation
  const trackDownloadMutation = useMutation({
    mutationFn: async (itemId: string) => {
      try {
        const response = await fetch(`/api/question-bank/items/${itemId}/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return response.ok;
      } catch (error) {
        console.error('Download tracking error:', error);
        return false;
      }
    }
  });

  const handleDownload = (item: Question) => {
    if (item.driveLink) {
      trackDownloadMutation.mutate(item.id);
      window.open(item.driveLink, '_blank');
      toast({
        title: "Download Started",
        description: "Opening question link...",
      });
    } else {
      toast({
        title: "Error",
        description: "Download link not found",
        variant: "destructive"
      });
    }
  };

  // Fetch subjects and chapters for filtering
  const { data: subjectsData } = useQuery({
    queryKey: ['/api/student/question-bank/subjects'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/student/question-bank/subjects', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Subjects API Error:', error);
        return [];
      }
    }
  });

  // Fetch question bank with filters using proper encoding
  const { data: questionBankData, isLoading, refetch } = useQuery<QuestionBankResponse>({
    queryKey: ['student-question-bank', selectedSubject, selectedChapter, selectedDifficulty, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedChapter !== 'all') params.append('chapter', selectedChapter);  
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      params.append('page', currentPage.toString());
      params.append('limit', '8');
      
      try {
        const response = await fetch(`/api/student/question-bank?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json() as QuestionBankResponse;
      } catch (error) {
        console.error('Question Bank API Error:', error);
        throw error;
      }
    }
  });

  const questions = questionBankData?.questions || [];
  const totalPages = questionBankData?.totalPages || 1;
  const totalCount = questionBankData?.totalCount || 0;

  // Get available chapters for selected subject
  const availableChapters = (subjectsData as any)?.find((s: any) => s.subject === selectedSubject)?.chapters || [];

  // Filter questions based on search query
  const filteredQuestions = questions.filter((q: Question) => 
    searchQuery === '' || 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilterChange = () => {
    setCurrentPage(1);
    refetch();
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800', 
      'hard': 'bg-red-100 text-red-800'
    };
    const labels = {
      'easy': 'Easy',
      'medium': 'Medium',
      'hard': 'Hard'
    };
    
    return (
      <Badge className={`${variants[difficulty as keyof typeof variants]} text-xs`}>
        {labels[difficulty as keyof typeof labels]}
      </Badge>
    );
  };

  const getSubjectIcon = (subject: string) => {
    return subject === 'chemistry' ? <Atom className="w-5 h-5" /> : <Cpu className="w-5 h-5" />;
  };

  const getSubjectName = (subject: string) => {
    return subject === 'chemistry' ? 'Chemistry' : 'ICT';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading Question Bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50">
      {/* Mobile-friendly header with back button */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/student')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2"
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Question Bank</h1>
                <p className="text-xs sm:text-sm text-gray-600">NCTB Approved Questions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-xs">
                Total {totalCount}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mobile-optimized filters */}
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Subject filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                setSelectedChapter('all');
                handleFilterChange();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="ict">ICT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chapter filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Chapter</label>
              <Select value={selectedChapter} onValueChange={(value) => {
                setSelectedChapter(value);
                handleFilterChange();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {availableChapters.map((chapter: string) => (
                    <SelectItem key={chapter} value={chapter}>{chapter}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={(value) => {
                setSelectedDifficulty(value);
                handleFilterChange();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions List - Mobile optimized */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions found.</p>
                <p className="text-sm text-gray-500 mt-2">Try different filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                        {question.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 text-blue-600">
                          {getSubjectIcon(question.subject)}
                          <span className="text-xs font-medium">{getSubjectName(question.subject)}</span>
                        </div>
                        {getDifficultyBadge(question.difficulty)}
                        <Badge variant="outline" className="text-xs">
                          {question.marks} marks
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Chapter:</span> {question.chapter}
                    </div>
                    
                    {question.description && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {question.description.length > 150 
                          ? `${question.description.substring(0, 150)}...`
                          : question.description
                        }
                      </div>
                    )}

                    {/* Mobile-friendly action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={() => handleDownload(question)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {question.driveLink && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(question.driveLink, '_blank')}
                          className="flex-1 text-sm border-blue-200 hover:bg-blue-50"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Google Drive
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mobile-friendly pagination */}
        {totalPages > 1 && (
          <Card className="border-gray-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    refetch();
                  }}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    refetch();
                  }}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-center">
              <div>
                <div className="text-lg font-bold text-green-700">{totalCount}</div>
                <div className="text-xs text-green-600">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-700">{filteredQuestions.length}</div>
                <div className="text-xs text-blue-600">Filtered</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-700">{currentPage}</div>
                <div className="text-xs text-purple-600">Current Page</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
