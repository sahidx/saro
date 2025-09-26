import React, { useState } from 'react';
import { ArrowLeft, Bot, Sparkles, FileText, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Bangladesh NCTB Curriculum Structure - Official Chapter Names
const curriculumData = {
  science: {
    "6": {
      papers: [], 
      chapters: [
        "১. পদার্থবিজ্ঞান - গতি, বল, সরল যন্ত্র",
        "২. পদার্থবিজ্ঞান - আলো, তাপ ও তাপমাত্রা", 
        "৩. রসায়ন - পদার্থের বৈশিষ্ট্য, মিশ্রণ",
        "৪. রসায়ন - অণু-পরমাণু, রাসায়নিক পরিবর্তন",
        "৫. জীববিজ্ঞান - জীবজগৎ, কোষ",
        "৬. জীববিজ্ঞান - উদ্ভিদ বৈশিষ্ট্য, সালোকসংশ্লেষণ",
        "৭. জীববিজ্ঞান - সংবেদি অঙ্গ",
        "৮. পৃথিবী ও পরিবেশ - পৃথিবীর উৎপত্তি",
        "৯. পৃথিবী ও পরিবেশ - পরিবেশের ভারসাম্য",
        "১০. পৃথিবী ও পরিবেশ - খাদ্য ও পুষ্টি"
      ]
    },
    "7": {
      papers: [], 
      chapters: [
        "১. পদার্থবিজ্ঞান - গতি, বল, সরল যন্ত্র",
        "২. পদার্থবিজ্ঞান - আলো, তাপ ও তাপমাত্রা", 
        "৩. রসায়ন - পদার্থের বৈশিষ্ট্য, মিশ্রণ",
        "৪. রসায়ন - অণু-পরমাণু, রাসায়নিক পরিবর্তন",
        "৫. জীববিজ্ঞান - জীবজগৎ, কোষ",
        "৬. জীববিজ্ঞান - উদ্ভিদ বৈশিষ্ট্য, সালোকসংশ্লেষণ",
        "৭. জীববিজ্ঞান - সংবেদি অঙ্গ",
        "৮. পৃথিবী ও পরিবেশ - পৃথিবীর উৎপত্তি",
        "৯. পৃথিবী ও পরিবেশ - পরিবেশের ভারসাম্য",
        "১০. পৃথিবী ও পরিবেশ - খাদ্য ও পুষ্টি"
      ]
    },
    "8": {
      papers: [], 
      chapters: [
        "১. পদার্থবিজ্ঞান - গতি, বল, সরল যন্ত্র",
        "২. পদার্থবিজ্ঞান - আলো, তাপ ও তাপমাত্রা", 
        "৩. রসায়ন - পদার্থের বৈশিষ্ট্য, মিশ্রণ",
        "৪. রসায়ন - অণু-পরমাণু, রাসায়নিক পরিবর্তন",
        "৫. জীববিজ্ঞান - জীবজগৎ, কোষ",
        "৬. জীববিজ্ঞান - উদ্ভিদ বৈশিষ্ট্য, সালোকসংশ্লেষণ",
        "৭. জীববিজ্ঞান - সংবেদি অঙ্গ",
        "৮. পৃথিবী ও পরিবেশ - পৃথিবীর উৎপত্তি",
        "৯. পৃথিবী ও পরিবেশ - পরিবেশের ভারসাম্য",
        "১০. পৃথিবী ও পরিবেশ - খাদ্য ও পুষ্টি"
      ]
    },
    "9-10": {
      papers: [], 
      chapters: [
        "১. বৈজ্ঞানিক পদ্ধতি ও পরিমাপ",
        "২. পদার্থের গাঠনিক ধারণা",
        "৩. বল ও গতি",
        "৪. তাপ ও তাপগতিবিদ্যা",
        "৫. আলো",
        "৬. বিদ্যুৎ ও চুম্বকত্ব",
        "৭. জীবকোষ ও টিস্যু",
        "৮. মানব দেহের বিভিন্ন ব্যবস্থা",
        "৯. উদ্ভিদের পরিপাক ও পরিবহণ",
        "১০. পরিবেশ ও বাস্তুতন্ত্র"
      ]
    }
  },
  math: {
    "6": {
      papers: [],
      chapters: [
        "১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা",
        "২. সংখ্যা পদ্ধতি - ভগ্নাংশ, দশমিক",
        "৩. প্রাথমিক বীজগণিত - সরল সমীকরণ",
        "৪. প্রাথমিক বীজগণিত - বীজগাণিতিক রাশি",
        "৫. জ্যামিতি - মৌলিক আকার, পরিমাপ",
        "৬. জ্যামিতি - ক্ষেত্রফল, আয়তন",
        "৭. পরিসংখ্যান - তথ্য সংগ্রহ, উপস্থাপনা",
        "৮. পরিসংখ্যান - গড় নির্ণয়",
        "৯. ব্যবহারিক গণিত - অনুপাত, সমানুপাত",
        "১০. ব্যবহারিক গণিত - শতকরা, সুদ-আসল"
      ]
    },
    "7": {
      papers: [],
      chapters: [
        "১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা",
        "২. সংখ্যা পদ্ধতি - ভগ্নাংশ, দশমিক",
        "৩. প্রাথমিক বীজগণিত - সরল সমীকরণ",
        "৪. প্রাথমিক বীজগণিত - বীজগাণিতিক রাশি",
        "৫. জ্যামিতি - মৌলিক আকার, পরিমাপ",
        "৬. জ্যামিতি - ক্ষেত্রফল, আয়তন",
        "৭. পরিসংখ্যান - তথ্য সংগ্রহ, উপস্থাপনা",
        "৮. পরিসংখ্যান - গড় নির্ণয়",
        "৯. ব্যবহারিক গণিত - অনুপাত, সমানুপাত",
        "১০. ব্যবহারিক গণিত - শতকরা, সুদ-আসল"
      ]
    },
    "8": {
      papers: [],
      chapters: [
        "১. সংখ্যা পদ্ধতি - প্রাকৃতিক সংখ্যা",
        "২. সংখ্যা পদ্ধতি - ভগ্নাংশ, দশমিক",
        "৩. প্রাথমিক বীজগণিত - সরল সমীকরণ",
        "৪. প্রাথমিক বীজগণিত - বীজগাণিতিক রাশি",
        "৫. জ্যামিতি - মৌলিক আকার, পরিমাপ",
        "৬. জ্যামিতি - ক্ষেত্রফল, আয়তন",
        "৭. পরিসংখ্যান - তথ্য সংগ্রহ, উপস্থাপনা",
        "৮. পরিসংখ্যান - গড় নির্ণয়",
        "৯. ব্যবহারিক গণিত - অনুপাত, সমানুপাত",
        "১০. ব্যবহারিক গণিত - শতকরা, সুদ-আসল"
      ]
    }
  },
  general_math: {
    "9-10": {
      papers: [], 
      chapters: [
        "১. বাস্তব সংখ্যা, সেট ও ফাংশন",
        "২. বীজগাণিতিক রাশি",
        "৩. সূচক ও লগারিদম",
        "৪. সমীকরণ সমাধান", 
        "৫. জ্যামিতি - রেখা, কোণ, ত্রিভুজ, বৃত্ত",
        "৬. জ্যামিতি - ক্ষেত্রফল",
        "৭. ত্রিকোণমিতি",
        "৮. দূরত্ব ও উচ্চতা, পরিমিতি",
        "৯. পরিসংখ্যান",
        "১০. বাস্তব জীবনের সমস্যা সমাধান"
      ]
    }
  },
  higher_math: {
    "9-10": {
      papers: [],
      chapters: [
        "১. সেট ও ফাংশন",
        "২. বীজগাণিতিক রাশি", 
        "৩. জ্যামিতিক অঙ্কন",
        "৪. সমীকরণ ও অসমতা",
        "৫. অসীম ধারা, ত্রিকোণমিতি",
        "৬. সূচকীয় ও লগারিদমীয় ফাংশন",
        "৭. দ্বিপদী বিস্তৃতি",
        "৮. স্থানাঙ্ক জ্যামিতি",
        "৯. সমতলীয় ভেক্টর",
        "১০. ত্রিমাত্রিক জ্যামিতি"
      ]
    }
  }
};

export default function AIQuestions() {
  const [, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [paper, setPaper] = useState('');
  const [chapter, setChapter] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [questionLanguage] = useState('bengali'); // Fixed to Bengali only
  const [questionCategory, setQuestionCategory] = useState('mixed'); // Math-based vs Theory-based
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();

  // Get available subjects based on class level
  const getAvailableSubjects = () => {
    if (!classLevel) return [];
    
    if (['6', '7', '8'].includes(classLevel)) {
      return [
        { value: 'science', label: '🧪 বিজ্ঞান (Science)' },
        { value: 'math', label: '📊 গণিত (Mathematics)' }
      ];
    } else if (classLevel === '9-10') {
      return [
        { value: 'science', label: '🧪 বিজ্ঞান (Science)' },
        { value: 'general_math', label: '📊 সাধারণ গণিত (General Math)' },
        { value: 'higher_math', label: '🔺 উচ্চতর গণিত (Higher Math)' }
      ];
    }
    return [];
  };

  // Get available papers based on subject and class
  const getAvailablePapers = () => {
    if (!subject || !classLevel) return [];
    const subjectDataObj = curriculumData[subject as keyof typeof curriculumData] as any;
    return subjectDataObj?.[classLevel]?.papers || [];
  };

  // Get available chapters based on subject, class, and paper
  const getAvailableChapters = () => {
    if (!subject || !classLevel) return [];
    const subjectDataObj = curriculumData[subject as keyof typeof curriculumData] as any;
    const subjectData = subjectDataObj?.[classLevel];
    if (!subjectData) return [];
    
    if (Array.isArray(subjectData.chapters)) {
      return subjectData.chapters;
    } else if (paper && subjectData.chapters[paper]) {
      return subjectData.chapters[paper];
    }
    return [];
  };

  // Generate questions function
  const handleGenerateQuestions = async () => {
    if (!subject || !classLevel || !chapter) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "দয়া করে সকল প্রয়োজনীয় তথ্য পূরণ করুন।",
        variant: "destructive",
      });
      return;
    }

    // Validate question count
    if (count > 40) {
      toast({
        title: "প্রশ্নের সংখ্যা বেশি",
        description: "প্রশ্নের সংখ্যা সর্বোচ্চ ৪০টি হতে পারে।",
        variant: "destructive",
      });
      return;
    }

    if (count < 1) {
      toast({
        title: "প্রশ্নের সংখ্যা কম",
        description: "কমপক্ষে ১টি প্রশ্ন তৈরি করতে হবে।",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Debug log
    console.log('🤖 Generating questions with params:', {
      subject,
      classLevel,
      chapter,
      questionType,
      questionCategory,
      difficulty,
      count
    });

    try {
      const response = await apiRequest('POST', '/api/ai/generate-questions', {
        subject,
        classLevel,
        chapter,
        questionType,
        questionCategory,
        difficulty,
        count
      });

      const data = await response.json();
      console.log('✅ Question generation response:', data);

      setGeneratedQuestions(data.questions || []);
      toast({
        title: "সফল!",
        description: `${count}টি প্রশ্ন সফলভাবে তৈরি হয়েছে।`,
      });
    } catch (error: any) {
      console.error('Question generation failed:', error);
      toast({
        title: "ত্রুটি",
        description: error.message || "প্রশ্ন তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-sm border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/80 border-purple-400/30 shadow-lg shadow-purple-500/20' 
          : 'bg-white/80 border-green-300/50 shadow-lg shadow-green-500/20'
      }`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/teacher-dashboard')}
              className={`${isDarkMode ? 'text-cyan-300 hover:text-cyan-100 hover:bg-slate-700/50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              ড্যাশবোর্ড
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`${isDarkMode ? 'text-purple-300 hover:bg-slate-700/50' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Settings className="w-5 h-5" />
            </Button>
            
            <div className={`text-sm font-medium ${isDarkMode ? 'text-cyan-300' : 'text-green-600'}`}>
              <span className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <span>🤖 PraggoAI দ্বারা চালিত</span>
                🇧🇩 Bangladesh Academic Pro
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        <Card className={`${isDarkMode ? 'bg-slate-800/50 border-purple-400/30' : 'bg-white border-green-300/50'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center justify-between ${isDarkMode ? 'text-cyan-300' : 'text-green-600'}`}>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>বাংলাদেশি প্রেক্ষাপটে AI প্রশ্ন তৈরি</span>
              </div>
              <div className={`text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                🔒 শিক্ষক লগইন সক্রিয়
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Settings */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  শ্রেণি *
                </Label>
                <Select value={classLevel} onValueChange={(value) => {
                  setClassLevel(value);
                  setSubject('');
                  setPaper('');
                  setChapter('');
                }}>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">📖 ষষ্ঠ শ্রেণি</SelectItem>
                    <SelectItem value="7">📖 সপ্তম শ্রেণি</SelectItem>
                    <SelectItem value="8">📖 অষ্টম শ্রেণি</SelectItem>
                    <SelectItem value="9-10">📖 নবম-দশম শ্রেণি</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  বিষয় *
                </Label>
                <Select 
                  value={subject} 
                  onValueChange={(value) => {
                    setSubject(value);
                    setPaper('');
                    setChapter('');
                  }}
                  disabled={!classLevel}
                >
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue placeholder={classLevel ? "বিষয় নির্বাচন করুন" : "প্রথমে শ্রেণি নির্বাচন করুন"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSubjects().map(subj => (
                      <SelectItem key={subj.value} value={subj.value}>
                        {subj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Paper Selection (if needed) */}
            {subject && classLevel && getAvailablePapers().length > 1 && (
              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  পত্র নির্বাচন
                </Label>
                <Select value={paper} onValueChange={setPaper}>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue placeholder="পত্র নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePapers().map((p: string) => (
                      <SelectItem key={p} value={p}>📄 {p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chapter Selection */}
            {subject && classLevel && (
              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  অধ্যায় *
                </Label>
                <Select value={chapter} onValueChange={setChapter}>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue placeholder="অধ্যায় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableChapters().map((c: string) => (
                      <SelectItem key={c} value={c}>📚 {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Question Configuration */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  প্রশ্নের ধরন
                </Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">🔘 বহুনির্বাচনি</SelectItem>
                    <SelectItem value="creative">📝 সৃজনশীল</SelectItem>
                    <SelectItem value="short">📄 সংক্ষিপ্ত</SelectItem>
                    <SelectItem value="mixed">🔀 মিশ্র</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  বিষয়বস্তু
                </Label>
                <Select value={questionCategory} onValueChange={setQuestionCategory}>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theoretical">📖 তাত্ত্বিক</SelectItem>
                    <SelectItem value="practical">🧪 প্রয়োগমূলক</SelectItem>
                    <SelectItem value="mixed">🔀 মিশ্র</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  কঠিনতার স্তর
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 সহজ</SelectItem>
                    <SelectItem value="medium">🟡 মাধ্যম</SelectItem>
                    <SelectItem value="hard">🔴 কঠিন</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  প্রশ্নের সংখ্যা
                </Label>
                <Input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={40}
                  className={isDarkMode ? 'bg-slate-700 border-purple-400/30' : 'bg-white'}
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex flex-col items-center space-y-4">
              {/* Status indicator */}
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {!classLevel && "⚠️ শ্রেণি নির্বাচন করুন"}
                {classLevel && !subject && "⚠️ বিষয় নির্বাচন করুন"}
                {classLevel && subject && !chapter && "⚠️ অধ্যায় নির্বাচন করুন"}
                {classLevel && subject && chapter && !isGenerating && "✅ প্রস্তুত! প্রশ্ন তৈরি করুন"}
                {isGenerating && "🤖 AI প্রশ্ন তৈরি করছে..."}
              </div>

              <Button
                onClick={handleGenerateQuestions}
                disabled={!subject || !classLevel || !chapter || isGenerating}
                className={`px-8 py-3 text-lg font-bold transition-all duration-300 transform ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-purple-600 via-cyan-600 to-blue-600 hover:from-purple-700 hover:via-cyan-700 hover:to-blue-700 text-white'
                    : 'bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 hover:from-green-600 hover:via-teal-600 hover:to-blue-600 text-white'
                } ${isGenerating ? '' : 'hover:scale-105'} ${
                  !subject || !classLevel || !chapter ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <Bot className="w-5 h-5 mr-2 animate-spin" />
                    AI প্রশ্ন তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    🤖 AI দিয়ে প্রশ্ন তৈরি করুন
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Questions Display */}
        {generatedQuestions.length > 0 && (
          <Card className={`${isDarkMode ? 'bg-slate-800/50 border-purple-400/30' : 'bg-white border-green-300/50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 ${isDarkMode ? 'text-cyan-300' : 'text-green-600'}`}>
                <FileText className="w-5 h-5" />
                <span>তৈরি হওয়া প্রশ্নসমূহ ({generatedQuestions.length}টি)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedQuestions.map((question, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-slate-700/50 border-purple-400/20' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`font-medium mb-2 ${isDarkMode ? 'text-cyan-200' : 'text-gray-800'}`}>
                    প্রশ্ন {index + 1}:
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {question.questionText}
                  </div>
                  
                  {question.options && Array.isArray(question.options) && (
                    <div className="mt-2">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-cyan-300' : 'text-green-600'}`}>
                        বিকল্পসমূহ:
                      </div>
                      {question.options.map((option: string, optIdx: number) => (
                        <div key={optIdx} className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {String.fromCharCode(65 + optIdx)}) {option}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.correctAnswer && (
                    <div className="mt-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        সঠিক উত্তর: {question.correctAnswer}
                      </span>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                        ব্যাখ্যা: {question.explanation}
                      </span>
                    </div>
                  )}

                  {question.answer && (
                    <div className="mt-3 p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <div className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        📝 বিস্তারিত সমাধান:
                      </div>
                      <div 
                        className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
                        style={{ fontFamily: 'SolaimanLipi, Kalpurush, sans-serif', lineHeight: '1.6' }}
                      >
                        {question.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}