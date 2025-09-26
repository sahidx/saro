import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MathRenderer } from '@/components/MathRenderer';
import { 
  CheckCircle, 
  Circle, 
  Lightbulb, 
  BookOpen, 
  Brain,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface AIGeneratedQuestion {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: string;
  explanation: string;
  subject?: string;
  chapter?: string;
  difficulty?: string;
  class?: string;
}

interface AIQuestionDisplayProps {
  questionData: AIGeneratedQuestion;
  showAnswer?: boolean;
  showExplanation?: boolean;
  onToggleAnswer?: () => void;
  onCopyQuestion?: () => void;
  className?: string;
  index?: number;
}

export function AIQuestionDisplay({
  questionData,
  showAnswer = false,
  showExplanation = false,
  onToggleAnswer,
  onCopyQuestion,
  className = "",
  index
}: AIQuestionDisplayProps) {
  const { question, options, correctAnswer, explanation, subject, chapter, difficulty } = questionData;

  const getOptionLabel = (optionKey: string) => {
    const labels: { [key: string]: string } = {
      'a': 'ক',
      'b': 'খ', 
      'c': 'গ',
      'd': 'ঘ'
    };
    return labels[optionKey] || optionKey;
  };

  const getDifficultyColor = (diff?: string) => {
    if (!diff) return 'bg-gray-100 text-gray-700';
    
    const colors: { [key: string]: string } = {
      'easy': 'bg-green-100 text-green-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'hard': 'bg-red-100 text-red-700'
    };
    return colors[diff] || 'bg-gray-100 text-gray-700';
  };

  const getDifficultyText = (diff?: string) => {
    if (!diff) return 'সাধারণ';
    
    const texts: { [key: string]: string } = {
      'easy': 'সহজ',
      'medium': 'মাধ্যম',
      'hard': 'কঠিন'
    };
    return texts[diff] || diff;
  };

  return (
    <Card className={`border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {index && (
                <Badge variant="outline" className="text-xs">
                  প্রশ্ন {index}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-blue-600">
                <Brain className="w-4 h-4" />
                <span className="text-xs font-medium">PraggoAI</span>
              </div>
              {difficulty && (
                <Badge className={`text-xs ${getDifficultyColor(difficulty)}`}>
                  {getDifficultyText(difficulty)}
                </Badge>
              )}
            </div>

            {(subject || chapter) && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-gray-600">
                {subject && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{subject === 'math' ? 'গণিত' : subject === 'science' ? 'বিজ্ঞান' : subject}</span>
                  </div>
                )}
                {chapter && (
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {chapter}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleAnswer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAnswer}
                className="h-8 w-8 p-0"
                title={showAnswer ? "উত্তর লুকান" : "উত্তর দেখান"}
              >
                {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
            
            {onCopyQuestion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopyQuestion}
                className="h-8 w-8 p-0"
                title="প্রশ্ন কপি করুন"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <CardTitle className="text-base md:text-lg font-semibold text-gray-900 leading-relaxed">
          <MathRenderer className="font-semibold">{question}</MathRenderer>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Options */}
        <div className="space-y-3">
          {Object.entries(options).map(([key, value]) => {
            const isCorrect = key === correctAnswer;
            const showCorrectStyle = showAnswer && isCorrect;
            
            return (
              <div
                key={key}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  showCorrectStyle
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                    showCorrectStyle
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }`}>
                    {showCorrectStyle ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      getOptionLabel(key)
                    )}
                  </div>
                  <span className="flex-1 text-gray-800 leading-relaxed">
                    <MathRenderer>{value}</MathRenderer>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Correct Answer Indicator */}
        {showAnswer && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">সঠিক উত্তর: {getOptionLabel(correctAnswer)}</span>
            </div>
          </div>
        )}

        {/* Explanation */}
        {showExplanation && explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">ব্যাখ্যা:</h4>
                <div className="text-blue-800 leading-relaxed text-sm md:text-base">
                  <MathRenderer>{explanation}</MathRenderer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {!showAnswer && onToggleAnswer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAnswer}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              উত্তর দেখুন
            </Button>
          )}
          
          {onCopyQuestion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyQuestion}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              <Copy className="w-3 h-3 mr-1" />
              কপি
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AIQuestionDisplay;