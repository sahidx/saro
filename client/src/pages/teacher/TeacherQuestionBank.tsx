import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen,
  Plus,
  ChevronLeft,
  FileText,
  Upload,
  Check,
  X,
  Atom,
  Cpu,
  Trophy,
  TrendingUp,
  FolderOpen,
  ExternalLink,
  Building,
  GraduationCap
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type NavigationLevel = 'subjects' | 'categories' | 'subcategories' | 'questions';

export default function TeacherQuestionBank() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Navigation state
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('subjects');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  
  // Form states for adding questions
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState(''); // Chapter name or exam year
  const [driveLink, setDriveLink] = useState(''); // Google Drive PDF link

  // Get teacher stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/teacher/question-bank/stats'],
  });

  // Get questions based on current selection
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/teacher/question-bank/questions', selectedSubject, selectedCategory, selectedSubCategory],
    queryFn: async () => {
      if (!selectedSubject || !selectedCategory || !selectedSubCategory) return [];
      const params = new URLSearchParams({
        subject: selectedSubject,
        category: selectedCategory,
        subCategory: selectedSubCategory
      });
      const response = await apiRequest('GET', `/api/teacher/question-bank/questions?${params}`);
      return response.json();
    },
    enabled: Boolean(currentLevel === 'questions' && selectedSubject && selectedCategory && selectedSubCategory),
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      const response = await apiRequest('POST', '/api/teacher/question-bank', questionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "প্রশ্ন যোগ করা হয়েছে!",
        description: "প্রশ্নব্যাংকে নতুন প্রশ্ন সফলভাবে যোগ করা হয়েছে।",
      });
      // Reset form
      setTitle('');
      setDriveLink('');
      setShowAddForm(false);
      // Refetch stats and questions
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/question-bank/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/question-bank/questions'] });
    },
    onError: (error: any) => {
      toast({
        title: "ত্রুটি!",
        description: error.message || "প্রশ্ন যোগ করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject || !selectedCategory || !selectedSubCategory || !title || !driveLink) {
      toast({
        title: "তথ্য অনুপস্থিত",
        description: "অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন।",
        variant: "destructive",
      });
      return;
    }

    // Validate Google Drive link
    if (!driveLink.includes('drive.google.com') && !driveLink.includes('docs.google.com')) {
      toast({
        title: "লিংক ত্রুটি",
        description: "অনুগ্রহ করে সঠিক Google Drive লিংক দিন।",
        variant: "destructive",
      });
      return;
    }

    const questionData = {
      subject: selectedSubject,
      category: selectedCategory,
      subCategory: selectedSubCategory,
      chapter: title, // Using title as chapter
      questionText: `${title} - PDF Resource`, // Simple description
      questionType: 'written',
      difficulty: 'medium',
      marks: 10,
      questionImage: null,
      driveLink: driveLink,
      options: null,
      correctAnswer: null
    };

    addQuestionMutation.mutate(questionData);
  };

  const renderBreadcrumb = () => {
    const items = [];
    
    if (selectedSubject) {
      items.push(
        <button
          key="subject"
          onClick={() => {
            setCurrentLevel('subjects');
            setSelectedSubject('');
            setSelectedCategory('');
            setSelectedSubCategory('');
          }}
          className={`text-sm ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
        >
          {selectedSubject === 'Chemistry' ? 'রসায়ন' : 'ICT'}
        </button>
      );
    }
    
    if (selectedCategory) {
      items.push(
        <span key="sep1" className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}> / </span>,
        <button
          key="category"
          onClick={() => {
            setCurrentLevel('categories');
            setSelectedCategory('');
            setSelectedSubCategory('');
          }}
          className={`text-sm ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
        >
          {selectedCategory === 'Academic' ? 'একাডেমিক' : 'ভর্তি'}
        </button>
      );
    }
    
    if (selectedSubCategory) {
      items.push(
        <span key="sep2" className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}> / </span>,
        <button
          key="subcategory"
          onClick={() => {
            setCurrentLevel('subcategories');
            setSelectedSubCategory('');
          }}
          className={`text-sm ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
        >
          {selectedSubCategory === 'Board' ? 'বোর্ড প্রশ্ন' : 
           selectedSubCategory === 'Test Paper' ? 'টেস্ট পেপার' : 'ভর্তি প্রশ্ন'}
        </button>
      );
    }

    return items.length > 0 ? (
      <div className="flex items-center mb-4">
        {items}
      </div>
    ) : null;
  };

  const renderSubjectSelection = () => (
    <div className="space-y-4">
      <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        বিষয় নির্বাচন করুন
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
            ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30 hover:border-purple-400/50' 
            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300 shadow-md'
          }`}
          onClick={() => {
            setSelectedSubject('Chemistry');
            setCurrentLevel('categories');
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Atom className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              রসায়ন
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              Chemistry প্রশ্নব্যাংক
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
            ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30 hover:border-blue-400/50' 
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:border-blue-300 shadow-md'
          }`}
          onClick={() => {
            setSelectedSubject('ICT');
            setCurrentLevel('categories');
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ICT
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              তথ্য ও যোগাযোগ প্রযুক্তি
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCategorySelection = () => (
    <div className="space-y-4">
      <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        ক্যাটেগরি নির্বাচন করুন
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
            ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30 hover:border-green-400/50' 
            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300 shadow-md'
          }`}
          onClick={() => {
            setSelectedCategory('Academic');
            setCurrentLevel('subcategories');
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              একাডেমিক
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              শিক্ষাবোর্ড প্রশ্ন
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
            ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/30 hover:border-orange-400/50' 
            : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:border-orange-300 shadow-md'
          }`}
          onClick={() => {
            setSelectedCategory('Admission');
            setCurrentLevel('subcategories');
          }}
        >
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ভর্তি
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              ভর্তি পরীক্ষার প্রশ্ন
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSubCategorySelection = () => {
    const isAcademic = selectedCategory === 'Academic';
    
    return (
      <div className="space-y-4">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          সাব-ক্যাটেগরি নির্বাচন করুন
        </h2>
        <div className={`grid ${isAcademic ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
          {isAcademic ? (
            <>
              <Card 
                className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-400/30 hover:border-blue-400/50' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 shadow-md'
                }`}
                onClick={() => {
                  setSelectedSubCategory('Board');
                  setCurrentLevel('questions');
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    বোর্ড প্রশ্ন
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    বোর্ড পরীক্ষার প্রশ্ন
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
                  ? 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-400/30 hover:border-purple-400/50' 
                  : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:border-purple-300 shadow-md'
                }`}
                onClick={() => {
                  setSelectedSubCategory('Test Paper');
                  setCurrentLevel('questions');
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    টেস্ট পেপার
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    মডেল টেস্ট প্রশ্ন
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card 
              className={`cursor-pointer transition-all hover:scale-105 ${isDarkMode 
                ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/30 hover:border-orange-400/50' 
                : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:border-orange-300 shadow-md'
              }`}
              onClick={() => {
                setSelectedSubCategory('Admission');
                setCurrentLevel('questions');
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  ভর্তি প্রশ্ন
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  বিশ্ববিদ্যালয় ভর্তি প্রশ্ন
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  const renderQuestionsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          প্রশ্নব্যাংক
        </h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          নতুন PDF যোগ করুন
        </Button>
      </div>

      {questionsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            প্রশ্ন লোড হচ্ছে...
          </p>
        </div>
      ) : questionsData?.length > 0 ? (
        <div className="space-y-4">
          {questionsData.map((question: any) => (
            <Card key={question.id} className={`${isDarkMode ? 'bg-slate-800/80 border-slate-600' : 'bg-white border-gray-200 shadow-md'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {question.chapter}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        PDF Resource
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {new Date(question.createdAt).toLocaleDateString('bn-BD')}
                      </Badge>
                    </div>
                  </div>
                  {question.driveLink && (
                    <Button
                      onClick={() => {
                        if (question.driveLink && question.driveLink.trim()) {
                          window.open(question.driveLink, '_blank');
                        } else {
                          console.error('No drive link available for question:', question.id);
                          // Note: Toast hook would need to be added to this component
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      PDF দেখুন
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`${isDarkMode ? 'bg-slate-800/80 border-slate-600' : 'bg-white border-gray-200 shadow-md'}`}>
          <CardContent className="p-8 text-center">
            <FolderOpen className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              কোন PDF রিসোর্স নেই
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              এই ক্যাটেগরিতে এখনো কোন PDF রিসোর্স যোগ করা হয়নি।
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              প্রথম PDF যোগ করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Question Form Modal */}
      {showAddForm && (
        <Card className={`${isDarkMode ? 'bg-slate-800/80 border-slate-600' : 'bg-white border-gray-200 shadow-md'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <Plus className="w-5 h-5" />
                নতুন PDF রিসোর্স যোগ করুন
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title (Chapter/Exam Year) */}
              <div>
                <Label htmlFor="title">অধ্যায়/পরীক্ষার বছর</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: অধ্যায় ১ - রসায়নের ভূমিকা অথবা ২০২৪ সালের প্রশ্ন"
                />
              </div>

              {/* Google Drive PDF Link */}
              <div>
                <Label htmlFor="driveLink">Google Drive PDF লিংক</Label>
                <Input
                  id="driveLink"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... বা https://docs.google.com/..."
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  নিশ্চিত করুন যে PDF file টি সবার জন্য দেখার অনুমতি রয়েছে
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={addQuestionMutation.isPending}
                  className="flex-1"
                >
                  {addQuestionMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      যোগ করা হচ্ছে...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      PDF রিসোর্স যোগ করুন
                    </div>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  বাতিল
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <MobileWrapper>
      <div className={`min-h-screen ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-white via-gray-50 to-purple-50'
      } transition-colors duration-300`}>
        
        {/* Header */}
        <header className={`sticky top-0 z-50 force-mobile-header ${isDarkMode 
          ? 'bg-slate-800/95 backdrop-blur-sm border-b border-emerald-400/30' 
          : 'bg-white/95 backdrop-blur-sm border-b border-emerald-200 shadow-sm'
        }`}>
          <div className="mobile-header-content force-mobile-padding px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/teacher')}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-emerald-400' 
                    : 'hover:bg-gray-100 text-emerald-600'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    প্রশ্নব্যাংক ম্যানেজমেন্ট
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    হায়ারার্কিক্যাল প্রশ্ন সংগ্রহ
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
            </div>
          </div>
        </header>

        <main className="mobile-main-content force-mobile-padding p-4 space-y-4">
          
          {/* Stats Cards */}
          {statsData && (
            <div className="grid grid-cols-2 gap-4">
              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30' 
                : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-md'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {statsData.totalQuestions || 0}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    মোট প্রশ্ন
                  </p>
                </CardContent>
              </Card>

              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {statsData.bySubject?.length || 0}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    বিষয়
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Breadcrumb Navigation */}
          {renderBreadcrumb()}

          {/* Dynamic Content Based on Navigation Level */}
          {currentLevel === 'subjects' && renderSubjectSelection()}
          {currentLevel === 'categories' && renderCategorySelection()}
          {currentLevel === 'subcategories' && renderSubCategorySelection()}
          {currentLevel === 'questions' && renderQuestionsView()}
        </main>
      </div>
    </MobileWrapper>
  );
}
