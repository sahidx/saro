import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  Award,
  BookOpen,
  ArrowRight,
  Star
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface ExamResult {
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  detailedAnswers: Array<{
    questionId: string;
    questionText: string;
    studentAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    marks: number;
    explanation?: string;
  }>;
  exam?: {
    title: string;
    subject: string;
    duration: number;
  };
  timeSpent?: number;
}

interface ExamResultDisplayProps {
  result: ExamResult;
  onClose: () => void;
}

export function ExamResultDisplay({ result, onClose }: ExamResultDisplayProps) {
  const { score, totalMarks, percentage, rank, detailedAnswers, exam, timeSpent } = result;
  
  // Trigger MathJax rendering after component mounts
  useEffect(() => {
    if (window.renderMathJax) {
      window.renderMathJax();
    }
  }, []);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 80) return 'অসাধারণ!';
    if (percentage >= 60) return 'ভাল!';
    if (percentage >= 40) return 'উত্তীর্ণ';
    return 'আরো চেষ্টা করুন';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'bg-yellow-500', text: '১ম স্থান' };
    if (rank === 2) return { icon: Award, color: 'bg-gray-400', text: '২য় স্থান' };
    if (rank === 3) return { icon: Star, color: 'bg-orange-500', text: '৩য় স্থান' };
    return { icon: Target, color: 'bg-blue-500', text: `${rank}তম স্থান` };
  };

  const rankInfo = getRankBadge(rank);
  const RankIcon = rankInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Result Header */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-3 rounded-full ${rankInfo.color} text-white`}>
                <RankIcon className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
              পরীক্ষা সম্পন্ন!
            </CardTitle>
            <p className="text-lg text-gray-600">
              {exam?.title || 'অনলাইন পরীক্ষা'}
            </p>
            <p className="text-sm text-gray-500">
              {exam?.subject === 'chemistry' ? 'রসায়ন' : 'তথ্য ও যোগাযোগ প্রযুক্তি'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className={`p-4 rounded-lg border-2 ${getGradeColor(percentage)}`}>
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-sm">মোট নম্বর: {totalMarks}</div>
              </div>
              <div className={`p-4 rounded-lg border-2 ${getGradeColor(percentage)}`}>
                <div className="text-3xl font-bold">{percentage}%</div>
                <div className="text-sm">{getGradeText(percentage)}</div>
              </div>
              <div className="p-4 rounded-lg border-2 bg-yellow-50 border-yellow-200 text-yellow-700">
                <div className="text-3xl font-bold">#{rank}</div>
                <div className="text-sm">{rankInfo.text}</div>
              </div>
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200 text-blue-700">
                <div className="text-3xl font-bold">{timeSpent || 0}</div>
                <div className="text-sm">মিনিট ব্যয়িত</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Answers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              বিস্তারিত উত্তর ও ব্যাখ্যা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailedAnswers.map((answer, index) => (
              <Card key={answer.questionId} className={`border-l-4 ${
                answer.isCorrect ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">প্রশ্ন {index + 1}</span>
                      <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                        {answer.marks} নম্বর
                      </Badge>
                      {answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      answer.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {answer.isCorrect ? 'সঠিক' : 'ভুল'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <MathRenderer className="font-medium text-gray-800 question-content">
                      {answer.questionText}
                    </MathRenderer>
                  </div>

                  {/* Answer Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-sm font-medium text-blue-700 mb-1">আপনার উত্তর:</div>
                      <div className={`font-medium ${answer.studentAnswer ? 'text-blue-800' : 'text-gray-500'}`}>
                        {answer.studentAnswer ? `${answer.studentAnswer})` : 'উত্তর দেওয়া হয়নি'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-sm font-medium text-green-700 mb-1">সঠিক উত্তর:</div>
                      <div className="font-medium text-green-800">
                        {answer.correctAnswer})
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {answer.explanation && (
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-sm font-medium text-yellow-700 mb-1">ব্যাখ্যা:</div>
                      <MathRenderer className="text-yellow-800 question-content">
                        {answer.explanation}
                      </MathRenderer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            <ArrowRight className="w-4 h-4 mr-2" />
            পরীক্ষার তালিকায় ফিরে যান
          </Button>
        </div>

        {/* Motivational Message */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="text-lg font-medium text-purple-800 mb-2">
              {percentage >= 80 ? '🎉 অভিনন্দন! দুর্দান্ত পারফরমেন্স!' : 
               percentage >= 60 ? '👏 ভাল কাজ! আরো উন্নতির সুযোগ আছে।' :
               percentage >= 40 ? '📚 চালিয়ে যান! অনুশীলন করলে আরো ভাল হবে।' :
               '💪 হাল ছাড়বেন না! আরো পড়াশোনা করে আবার চেষ্টা করুন।'}
            </div>
            <p className="text-purple-600">
              নিয়মিত অনুশীলন করলে আরো ভাল ফলাফল পাবেন। শুভকামনা!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
