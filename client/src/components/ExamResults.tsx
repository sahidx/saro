import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, TrendingUp, Target, Loader2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ExamResultsProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'teacher' | 'student';
  currentUserId?: string;
}

interface StudentResult {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  marks: number;
  percentage: number;
  rank: number;
  grade: string;
  feedback?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Award className="w-6 h-6 text-orange-500" />;
    default:
      return <Star className="w-5 h-5 text-blue-500" />;
  }
};

// Dynamic grade color function using grading scheme
const getDynamicGradeColor = (grade: string, gradingScheme: any) => {
  if (!gradingScheme?.gradeRanges) {
    // Fallback to default colors if no scheme available
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800 border-green-300';
      case 'A': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'A-': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'C': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'D': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-red-200 text-red-900 border-red-400';
    }
  }
  
  // Find grade in scheme and convert color
  const gradeRange = gradingScheme.gradeRanges.find((g: any) => g.letter === grade);
  if (!gradeRange) return 'bg-gray-100 text-gray-800 border-gray-300';
  
  // Convert backend color to display format with border
  const color = gradeRange.color;
  if (color.includes('green')) return 'bg-green-100 text-green-800 border-green-300';
  if (color.includes('blue')) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (color.includes('cyan')) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
  if (color.includes('yellow')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (color.includes('orange')) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (color.includes('red-400')) return 'bg-red-100 text-red-700 border-red-300';
  if (color.includes('red')) return 'bg-red-200 text-red-900 border-red-400';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

export function ExamResults({ exam, isOpen, onClose, userRole, currentUserId }: ExamResultsProps) {
  // Fetch real exam results data
  const { data: resultsData, isLoading, error } = useQuery({
    queryKey: [`/api/exams/${exam?.id}/results`],
    enabled: isOpen && !!exam?.id,
    refetchOnMount: true,
    staleTime: 30000, // Fresh for 30 seconds
  });

  // Debug: Log the results data to console
  React.useEffect(() => {
    if (resultsData) {
      console.log('🔍 ExamResults - API Response:', resultsData);
      console.log('🔍 ExamResults - Results Array:', resultsData.results);
      console.log('🔍 ExamResults - Results Length:', resultsData.results?.length || 0);
      console.log('🔍 ExamResults - Data Structure:', typeof resultsData, Object.keys(resultsData));
    }
    if (error) {
      console.log('🔍 ExamResults - Error:', error);
    }
  }, [resultsData, error]);

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🏆 Loading Exam Results...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Loading results data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !resultsData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              ❌ No Results Available
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {error ? 'Failed to load results. Please try again.' : 'No results found for this exam. Marks may not be entered yet.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Make sure we have the results array - handle both possible data structures
  const resultsArray = resultsData?.results || resultsData || [];
  const sortedResults = Array.isArray(resultsArray) 
    ? resultsArray.sort((a: StudentResult, b: StudentResult) => (b.marks || 0) - (a.marks || 0))
    : [];
  const totalStudents = sortedResults.length;

  // Debug: Log the processing
  console.log('🔍 ExamResults - Processing Results:', {
    hasResultsData: !!resultsData,
    resultsArray,
    sortedResults,
    totalStudents
  });

  // If no results/marks entered yet, show "Results not published" message  
  if (totalStudents === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              📋 {exam?.title} - Exam Results
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {exam?.subject === 'chemistry' ? 'Chemistry' : 'ICT'} • {new Date(exam?.examDate).toLocaleDateString()} • Total: {exam?.totalMarks} marks
            </p>
          </DialogHeader>
          
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ফলাফল এখনো প্রকাশিত হয়নি
              </h3>
              <p className="text-gray-600 mb-6">
                Results Not Published Yet
              </p>
              <div className="max-w-md mx-auto text-sm text-gray-500 space-y-2">
                <p>• শিক্ষক এখনও এই পরীক্ষার নম্বর দেয়নি</p>
                <p>• Marks have not been entered by the teacher yet</p>
                <p>• ফলাফল প্রকাশিত হলে আপনি অবহিত হবেন</p>
              </div>
            </div>
            
            {userRole === 'teacher' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 font-medium mb-2">শিক্ষকের জন্য নোট:</p>
                <p className="text-blue-700 text-sm">
                  এই পরীক্ষার ফলাফল প্রকাশ করতে "Enter Marks" বাটনে ক্লিক করুন
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const averageMarks = totalStudents > 0 ? sortedResults.reduce((sum: number, result: StudentResult) => sum + result.marks, 0) / totalStudents : 0;
  const highestMarks = sortedResults[0]?.marks || 0;
  const currentUserResult = currentUserId ? sortedResults.find((r: StudentResult) => r.id === currentUserId) : null;

  const getPerformanceStats = () => {
    const aPlus = sortedResults.filter(r => r.percentage >= 90).length;
    const a = sortedResults.filter(r => r.percentage >= 80 && r.percentage < 90).length;
    const b = sortedResults.filter(r => r.percentage >= 70 && r.percentage < 80).length;
    const c = sortedResults.filter(r => r.percentage >= 60 && r.percentage < 70).length;
    const fail = sortedResults.filter(r => r.percentage < 60).length;
    
    return { aPlus, a, b, c, fail };
  };

  const stats = getPerformanceStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto sm:max-w-6xl max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {userRole === 'teacher' ? 'Exam Results & Performance Analysis' : 'Your Exam Result'}
            <Badge variant="outline">{exam?.title}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student's Own Result (if student view) */}
          {userRole === 'student' && currentUserResult && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Target className="w-5 h-5" />
                  আপনার ফলাফল
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">{currentUserResult.marks}</div>
                    <div className="text-sm text-gray-600">আপনার নম্বর</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">#{currentUserResult.rank}</div>
                    <div className="text-sm text-gray-600">আপনার র‍্যাঙ্ক</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">{currentUserResult.percentage}%</div>
                    <div className="text-sm text-gray-600">শতকরা নম্বর</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <Badge className={getDynamicGradeColor(currentUserResult.grade, resultsData?.gradingScheme)}>
                      {currentUserResult.grade}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-2">গ্রেড</div>
                  </div>
                </div>
                {currentUserResult.feedback && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-blue-700 text-sm">
                      <strong>শিক্ষকের মন্তব্য:</strong> {currentUserResult.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Overall Statistics (Teacher View) */}
          {userRole === 'teacher' && (
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <TrendingUp className="w-5 h-5" />
                  পরীক্ষার সামগ্রিক পরিসংখ্যান
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4 text-center mb-6">
                  <div className="p-3 bg-white rounded border">
                    <div className="text-xl font-bold text-gray-700">{totalStudents}</div>
                    <div className="text-sm text-gray-600">মোট ছাত্র</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="text-xl font-bold text-green-600">{averageMarks.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">গড় নম্বর</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="text-xl font-bold text-blue-600">{highestMarks}</div>
                    <div className="text-sm text-gray-600">সর্বোচ্চ নম্বর</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="text-xl font-bold text-purple-600">{exam?.totalMarks}</div>
                    <div className="text-sm text-gray-600">পূর্ণমান</div>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <div className="text-xl font-bold text-cyan-600">{((averageMarks / exam?.totalMarks) * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">গড় শতকরা</div>
                  </div>
                </div>
                
                {/* Dynamic Grade Distribution */}
                <div className={`grid gap-1 text-xs ${resultsData?.gradingScheme?.gradeRanges ? `grid-cols-${resultsData.gradingScheme.gradeRanges.length}` : 'grid-cols-7'}`}>
                  {resultsData?.gradingScheme?.gradeRanges?.map((gradeRange: any, index: number) => {
                    // Get count for this grade from stats
                    const gradeKey = gradeRange.letter.toLowerCase().replace('+', 'Plus').replace('-', 'Minus');
                    const count = (stats as any)[gradeKey] || 0;
                    
                    // Convert backend color format to display classes
                    const getDisplayColor = (color: string) => {
                      if (color.includes('green')) return 'bg-green-100 text-green-700';
                      if (color.includes('blue')) return 'bg-blue-100 text-blue-700';  
                      if (color.includes('cyan')) return 'bg-cyan-100 text-cyan-700';
                      if (color.includes('yellow')) return 'bg-yellow-100 text-yellow-700';
                      if (color.includes('orange')) return 'bg-orange-100 text-orange-700';
                      if (color.includes('red-400')) return 'bg-red-100 text-red-700';
                      if (color.includes('red')) return 'bg-red-200 text-red-800';
                      return 'bg-gray-100 text-gray-700';
                    };
                    
                    return (
                      <div key={gradeRange.letter} className={`text-center p-2 ${getDisplayColor(gradeRange.color)} rounded`}>
                        <div className="font-bold">{count}</div>
                        <div className="text-xs">{gradeRange.letter}</div>
                        <div className="text-xs">({gradeRange.minPercent}%{gradeRange.maxPercent < 100 ? `-${gradeRange.maxPercent}%` : '+'})</div>
                        <div className="text-xs">GPA {gradeRange.gpa}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {userRole === 'teacher' ? 'সকল ছাত্রের ফলাফল (র‍্যাঙ্ক অনুযায়ী)' : 'ক্লাসের সকল ফলাফল'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border flex items-center justify-between ${
                      result.id === currentUserId 
                        ? 'bg-blue-50 border-blue-300' 
                        : index < 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index + 1)}
                        <span className="font-bold text-lg">#{index + 1}</span>
                      </div>
                      
                      <div>
                        <div className="font-semibold">
                          {result.firstName} {result.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {result.studentId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold text-lg text-green-600">
                          {result.marks}/{exam?.totalMarks}
                        </div>
                        <div className="text-sm text-gray-600">{result.percentage}%</div>
                      </div>
                      
                      <Badge className={getDynamicGradeColor(result.grade, resultsData?.gradingScheme)}>
                        {result.grade}
                      </Badge>
                      
                      {result.id === currentUserId && (
                        <Badge className="bg-blue-100 text-blue-800">আপনি</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
