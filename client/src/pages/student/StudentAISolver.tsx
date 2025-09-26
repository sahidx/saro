import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MathRenderer } from '@/components/MathRenderer';
import { 
  ArrowLeft,
  Bot,
  Send,
  Loader2,
  BookOpen,
  Sparkles,
  GraduationCap,
  Brain,
  Calculator,
  FlaskConical,
  Monitor,
  Lightbulb,
  MessageSquare,
  Copy,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  subject?: string;
}

export default function StudentAISolver() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Problem solving state
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  const [selectedClass, setSelectedClass] = useState<string>('6');
  const [conversation, setConversation] = useState<AIMessage[]>([]);
  
  // UI state
  const [isSolving, setIsSolving] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  // Sample problems for each subject
  const sampleProblems = {
    math: [
      "২৫ + ১৮ = কত?",
      "একটি আয়তক্ষেত্রের দৈর্ঘ্য ১০ মিটার এবং প্রস্থ ৬ মিটার। এর ক্ষেত্রফল কত?",
      "৩x + ৫ = ২০ সমীকরণটি সমাধান কর।",
      "একটি ত্রিভুজের তিনটি বাহুর দৈর্ঘ্য ৩, ৪ ও ৫ একক। এটি কী ধরনের ত্রিভুজ?"
    ],
    general_math: [
      "একটি সমকোণী ত্রিভুজের ভূমি ৮ সেমি এবং উচ্চতা ৬ সেমি। এর ক্ষেত্রফল কত?",
      "যদি sin A = 3/5 হয়, তাহলে cos A এর মান কত?",
      "log₂8 এর মান কত?",
      "একটি বৃত্তের ব্যাসার্ধ ৭ সেমি। এর পরিধি কত?"
    ],
    higher_math: [
      "∫(2x + 3)dx সমাকলন কর।",
      "যদি A = [1 2; 3 4] হয়, তাহলে A² এর মান নির্ণয় কর।",
      "d/dx(x³ + 2x² - 5x + 1) অন্তরীকরণ কর।",
      "একটি জটিল সংখ্যা z = 3 + 4i এর মডুলাস কত?"
    ],
    science: [
      "পানির রাসায়নিক সংকেত কী?",
      "সালোকসংশ্লেষণ প্রক্রিয়া ব্যাখ্যা কর।",
      "নিউটনের প্রথম সূত্রটি কী?",
      "অম্ল ও ক্ষারের মধ্যে পার্থক্য কী?"
    ],
    physics: [
      "নিউটনের দ্বিতীয় সূত্রটি লেখ।",
      "একটি বস্তুর ভর ২ কেজি এবং ত্বরণ ৫ মি/সে²। বলটি কত?",
      "আলোর বেগ কত?",
      "ওহমের সূত্রটি কী?"
    ],
    chemistry: [
      "পর্যায় সারণীতে কয়টি মৌল আছে?",
      "H₂SO₄ এর নাম কী?",
      "অ্যাভোগাড্রো সংখ্যা কত?",
      "মিথেনের রাসায়নিক সংকেত কী?"
    ],
    biology: [
      "কোষ বিভাজনের কয়টি ধাপ আছে?",
      "DNA এর পূর্ণরূপ কী?",
      "সালোকসংশ্লেষণে কোন গ্যাস নিঃসৃত হয়?",
      "মানুষের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ আছে?"
    ],
    ict: [
      "কম্পিউটারের ইনপুট ডিভাইস কী কী?",
      "ইন্টারনেট কীভাবে কাজ করে?",
      "প্রোগ্রামিং কী?",
      "ডেটাবেস কী এবং এর ব্যবহার কী?"
    ]
  };

  const getSubjectInfo = () => {
    const subjects = {
      math: { name: 'গণিত (৬-৮)', icon: Calculator, color: 'text-blue-600 bg-blue-50' },
      general_math: { name: 'সাধারণ গণিত (৯-১০)', icon: Calculator, color: 'text-blue-600 bg-blue-50' },
      higher_math: { name: 'উচ্চতর গণিত (৯-১২)', icon: Calculator, color: 'text-indigo-600 bg-indigo-50' },
      science: { name: 'বিজ্ঞান (৬-১০)', icon: FlaskConical, color: 'text-green-600 bg-green-50' },
      physics: { name: 'পদার্থবিজ্ঞান (১১-১২)', icon: FlaskConical, color: 'text-red-600 bg-red-50' },
      chemistry: { name: 'রসায়ন (১১-১২)', icon: FlaskConical, color: 'text-green-600 bg-green-50' },
      biology: { name: 'জীববিজ্ঞান (১১-১২)', icon: FlaskConical, color: 'text-emerald-600 bg-emerald-50' },
      ict: { name: 'ICT', icon: Monitor, color: 'text-purple-600 bg-purple-50' }
    };
    return subjects[selectedSubject as keyof typeof subjects] || subjects.math;
  };

  const solveWithAI = async (question: string) => {
    setIsSolving(true);
    setCurrentResponse('');
    
    // Debug log
    console.log('🎓 Student asking question:', {
      question,
      subject: selectedSubject,
      class: selectedClass
    });
    
    // Add user message
    const userMessage: AIMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
      subject: selectedSubject
    };
    
    setConversation(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/ai/solve-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          doubt: question, 
          subject: selectedSubject,
          class: selectedClass,
          stream: true 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`সার্ভার ত্রুটি (${response.status}): ${errorText || 'অজানা ত্রুটি'}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      let accumulatedContent = '';
      
      // Add placeholder assistant message
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: 'AI চিন্তা করছে...',
        timestamp: new Date(),
        subject: selectedSubject
      };
      
      setConversation(prev => [...prev, assistantMessage]);
      const messageIndex = conversation.length + 1;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                accumulatedContent = data.content;
                setCurrentResponse(accumulatedContent);
                
                // Update assistant message
                setConversation(prev => {
                  const updated = [...prev];
                  updated[messageIndex] = { 
                    ...updated[messageIndex],
                    content: accumulatedContent 
                  };
                  return updated;
                });
              } else if (data.type === 'complete') {
                accumulatedContent = data.content;
                setCurrentResponse(accumulatedContent);
                
                // Final update
                setConversation(prev => {
                  const updated = [...prev];
                  updated[messageIndex] = { 
                    ...updated[messageIndex],
                    content: accumulatedContent 
                  };
                  return updated;
                });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
      
      setUserQuestion('');
    } catch (error: any) {
      // Remove placeholder message on error
      setConversation(prev => prev.slice(0, -1));
      
      toast({
        title: "সমাধান পেতে ব্যর্থ",
        description: error.message || "দয়া করে আবার চেষ্টা করুন।",
        variant: "destructive"
      });
    } finally {
      setIsSolving(false);
      setCurrentResponse('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim() || isSolving) return;
    solveWithAI(userQuestion);
  };

  const handleSampleProblem = (problem: string) => {
    setUserQuestion(problem);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "কপি সফল!",
        description: "টেক্সট ক্লিপবোর্ডে কপি হয়েছে।"
      });
    } catch (error) {
      toast({
        title: "কপি ব্যর্থ",
        description: "টেক্সট কপি করতে সমস্যা হয়েছে।",
        variant: "destructive"
      });
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setUserQuestion('');
    toast({
      title: "কথোপকথন পরিষ্কার করা হয়েছে",
      description: "নতুন সমস্যা জিজ্ঞেস করুন।"
    });
  };

  const subjectInfo = getSubjectInfo();
  const SubjectIcon = subjectInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-blue-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/student')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI সমস্যা সমাধানকারী
                </h1>
                <p className="text-sm text-gray-600">PraggoAI দিয়ে সন্দেহ দূর করুন</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Smart AI
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Subject Selection */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <SubjectIcon className="w-5 h-5" />
              বিষয় নির্বাচন
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">শ্রেণী</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">ষষ্ঠ শ্রেণী</SelectItem>
                    <SelectItem value="7">সপ্তম শ্রেণী</SelectItem>
                    <SelectItem value="8">অষ্টম শ্রেণী</SelectItem>
                    <SelectItem value="9-10">নবম-দশম শ্রেণী (SSC)</SelectItem>
                    <SelectItem value="11-12">একাদশ-দ্বাদশ শ্রেণী (HSC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">বিষয়</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">গণিত (৬-৮ শ্রেণী)</SelectItem>
                    <SelectItem value="general_math">সাধারণ গণিত (৯-১০ শ্রেণী)</SelectItem>
                    <SelectItem value="higher_math">উচ্চতর গণিত (৯-১২ শ্রেণী)</SelectItem>
                    <SelectItem value="science">বিজ্ঞান (৬-১০ শ্রেণী)</SelectItem>
                    <SelectItem value="physics">পদার্থবিজ্ঞান (১১-১২ শ্রেণী)</SelectItem>
                    <SelectItem value="chemistry">রসায়ন (১১-১২ শ্রেণী)</SelectItem>
                    <SelectItem value="biology">জীববিজ্ঞান (১১-১২ শ্রেণী)</SelectItem>
                    <SelectItem value="ict">ICT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Problems */}
        {conversation.length === 0 && (
          <Card className={`border-2 ${subjectInfo.color} border-opacity-30`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                নমুনা সমস্যা - {subjectInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sampleProblems[selectedSubject as keyof typeof sampleProblems]?.map((problem, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSampleProblem(problem)}
                  className="w-full text-left justify-start h-auto py-3 px-4 text-wrap"
                >
                  <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{problem}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Conversation */}
        {conversation.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                সমাধান কথোপকথন
              </h2>
              <Button
                onClick={clearConversation}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                পরিষ্কার
              </Button>
            </div>

            {conversation.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-md border'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-5 h-5 text-purple-500" />
                      <span className="font-semibold text-purple-600">PraggoAI</span>
                      {isSolving && idx === conversation.length - 1 && (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      )}
                    </div>
                  )}
                  
                  <div className="leading-relaxed">
                    {msg.role === 'assistant' ? (
                      <MathRenderer className="text-base">{msg.content}</MathRenderer>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === 'assistant' && !isSolving && (
                    <Button
                      onClick={() => copyToClipboard(msg.content)}
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs opacity-70 hover:opacity-100"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      কপি
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Message */}
        {conversation.length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-6 text-center">
              <GraduationCap className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                স্বাগতম! আমি আপনার AI শিক্ষক
              </h3>
              <p className="text-green-700 mb-4">
                গণিত, বিজ্ঞান ও ICT বিষয়ে যেকোনো সমস্যা জিজ্ঞেস করুন। আমি ধাপে ধাপে সমাধান দেব।
              </p>
              <div className="text-sm text-green-600 space-y-1">
                <p>✓ বিস্তারিত ব্যাখ্যাসহ সমাধান</p>
                <p>✓ NCTB কারিকুলাম অনুযায়ী</p>
                <p>✓ বাংলায় সহজ ভাষায়</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-200 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder={`${subjectInfo.name} বিষয়ে আপনার সমস্যা লিখুন...`}
              className="flex-1 min-h-[50px] max-h-32 bg-white border-gray-300 rounded-2xl resize-none"
              disabled={isSolving}
            />
            <Button
              type="submit"
              disabled={!userQuestion.trim() || isSolving}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white p-3 rounded-2xl min-w-[50px] h-[50px]"
            >
              {isSolving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}