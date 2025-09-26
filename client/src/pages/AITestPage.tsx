import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AITestPage() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState('teacher-questions');
  const { toast } = useToast();

  const runTest = async () => {
    setTestStatus('testing');
    setTestResults([]);
    
    try {
      if (selectedTest === 'teacher-questions') {
        // Test teacher question generation
        const response = await fetch('/api/ai/generate-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            subject: 'math',
            classLevel: '6',
            chapter: '১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা',
            questionType: 'mcq',
            questionCategory: 'mixed',
            difficulty: 'easy',
            count: 2
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setTestResults(data.questions || []);
        setTestStatus('success');
        
        toast({
          title: "✅ শিক্ষক প্রশ্ন তৈরি সফল!",
          description: `${data.questions?.length || 0}টি প্রশ্ন তৈরি হয়েছে।`,
        });
        
      } else if (selectedTest === 'student-solver') {
        // Test student doubt solver
        const response = await fetch('/api/ai/solve-doubt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            doubt: '২৫ + ১৮ = কত?',
            subject: 'math',
            stream: false
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setTestResults([{ type: 'solution', content: data.solution }]);
        setTestStatus('success');
        
        toast({
          title: "✅ ছাত্র সমাধান সফল!",
          description: "AI সমাধান পেয়েছে।",
        });
      }
      
    } catch (error: any) {
      console.error('Test failed:', error);
      setTestStatus('error');
      setTestResults([{ type: 'error', content: error.message }]);
      
      toast({
        title: "❌ পরীক্ষা ব্যর্থ",
        description: error.message || "অজানা ত্রুটি ঘটেছে।",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <TestTube className="w-6 h-6" />
              PraggoAI সিস্টেম পরীক্ষা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  পরীক্ষার ধরন
                </label>
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher-questions">
                      🧑‍🏫 শিক্ষক প্রশ্ন তৈরি
                    </SelectItem>
                    <SelectItem value="student-solver">
                      🎓 ছাত্র সমস্যা সমাধান
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={runTest}
                  disabled={testStatus === 'testing'}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Bot className="w-4 h-4 mr-2 animate-spin" />
                      পরীক্ষা চলছে...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      পরীক্ষা শুরু করুন
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  testStatus === 'success' ? 'default' : 
                  testStatus === 'error' ? 'destructive' : 
                  testStatus === 'testing' ? 'secondary' : 'outline'
                }
                className={
                  testStatus === 'success' ? 'bg-green-100 text-green-800' :
                  testStatus === 'testing' ? 'bg-blue-100 text-blue-800' : ''
                }
              >
                {testStatus === 'idle' && '⭕ অপেক্ষমান'}
                {testStatus === 'testing' && '🔄 পরীক্ষা করছে'}
                {testStatus === 'success' && '✅ সফল'}
                {testStatus === 'error' && '❌ ব্যর্থ'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {testResults.length > 0 && (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                {testStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                পরীক্ষার ফলাফল
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.type === 'error' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {result.type === 'error' ? (
                      <span className="text-red-800 font-medium">
                        ত্রুটি: {result.content}
                      </span>
                    ) : result.questionText ? (
                      <div>
                        <div className="font-medium text-gray-800 mb-2">
                          প্রশ্ন {index + 1}:
                        </div>
                        <div className="text-gray-700">{result.questionText}</div>
                        {result.options && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-green-600">বিকল্পসমূহ:</div>
                            {result.options.map((option: string, optIdx: number) => (
                              <div key={optIdx} className="ml-4 text-gray-700">
                                {String.fromCharCode(65 + optIdx)}) {option}
                              </div>
                            ))}
                          </div>
                        )}
                        {result.correctAnswer && (
                          <div className="mt-2 text-green-700 font-medium">
                            সঠিক উত্তর: {result.correctAnswer}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-700">{result.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}