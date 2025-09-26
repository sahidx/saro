import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, ExternalLink, FolderOpen, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
// Updated NCTB Chapter structure for Science & Math curriculum
const CHAPTER_STRUCTURE = {
  '9-10': {
    science: [
      'বৈজ্ঞানিক পদ্ধতি ও পরিমাপ',
      'পদার্থের গাঠনিক ধারণা',
      'বল ও গতি',
      'তাপ ও তাপগতিবিদ্যা',
      'আলো',
      'বিদ্যুৎ ও চুম্বকত্ব',
      'জীবকোষ ও টিস্যু',
      'মানব দেহের বিভিন্ন ব্যবস্থা',
      'উদ্ভিদের পরিপাক ও পরিবহণ',
      'পরিবেশ ও বাস্তুতন্ত্র'
    ],
    math: [
      'বাস্তব সংখ্যা ও সেট',
      'বীজগাণিতিক রাশি ও উৎপাদক',
      'সমীকরণ ও অসমতা',
      'সূচক ও লগারিদম',
      'ব্যঞ্জক সরলীকরণ',
      'জ্যামিতি (ত্রিভুজ, বৃত্ত)',
      'ত্রিকোণমিতি পরিচিতি',
      'সমন্বয় জ্যামিতি',
      'সম্ভাব্যতা ও পরিসংখ্যান',
      'বীজগণিতের প্রয়োগ'
    ]
  },
  '11-12': {
    science: [
      'ভৌত রাশির পরিমাপ',
      'এক ও দ্বি মাত্রিক গতি',
      'নিউটনের গতিসূত্র',
      'কাজ, শক্তি ও ক্ষমতা',
      'গ্যাসের গতিতত্ত্ব',
      'স্থির তড়িৎ',
      'চল তড়িৎ',
      'চুম্বক ক্ষেত্র ও তড়িৎচুম্বকত্ব',
      'আধুনিক পদার্থবিজ্ঞান পরিচিতি',
      'জীবপ্রযুক্তি ও পরিবেশ'
    ],
    math: [
      'উচ্চতর সমীকরণ',
      'ক্রম ও শ্রেণি',
      'সীমা ও অন্তরকলন',
      'ইন্টিগ্রেশন',
      'ভেক্টর',
      'ত্রিকোণমিতিক বিস্তার',
      'স্থিরাংক জ্যামিতি',
      'সম্ভাব্যতা বিতরণ',
      'ম্যাট্রিক্স ও ডিটারমিন্যান্ট',
      'রৈখিক প্রোগ্রামিং পরিচিতি'
    ]
  }
};

interface ChapterResource {
  id: string;
  class_level: string;
  subject: string;
  chapter_name: string;
  subcategory?: string;
  google_drive_link: string;
  description: string;
  created_at: string;
}

export default function StudentQuestionBank() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resources, setResources] = useState<ChapterResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // Subcategories for class 11-12
  const subcategories = [
    'ইঞ্জিনিয়ারিং',
    'ভার্সিটি',
    'মেডিকেল', 
    'মূল বইয়ের প্রশ্ন'
  ];

  useEffect(() => {
    fetchResources();
  }, [selectedClass, selectedSubject, selectedChapter, selectedSubcategory]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('class_level', selectedClass);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedChapter && selectedChapter !== 'all') params.append('chapter_name', selectedChapter);
      if (selectedSubcategory && selectedSubcategory !== 'all') params.append('subcategory', selectedSubcategory);
      
      const response = await fetch(`/api/chapter-resources?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to format Google Drive links properly
  const formatGoogleDriveLink = (originalLink: string) => {
    // Return original link as is - don't modify anything
    return originalLink;
  };

  const handleOpenDriveLink = (resource: ChapterResource) => {
    const formattedLink = formatGoogleDriveLink(resource.google_drive_link);
    
    // Open the formatted link
    window.open(formattedLink, '_blank');
    
    toast({
      title: "Google Drive লিংক",
      description: `${resource.chapter_name} এর রিসোর্স খোলা হচ্ছে...`,
    });
  };

  const getSubjectName = (subject: string) => {
    return subject === 'science' ? 'বিজ্ঞান' : 'গণিত';
  };

  const getClassDisplayName = (classLevel: string) => {
    return classLevel === '9-10' ? 'নবম-দশম শ্রেণী' : 'একাদশ-দ্বাদশ শ্রেণী';
  };

  // Get available chapters for current selection
  const getAvailableChapters = () => {
    if (!selectedClass || !selectedSubject) return [];
    
    return CHAPTER_STRUCTURE[selectedClass as keyof typeof CHAPTER_STRUCTURE]?.[selectedSubject as 'science' | 'math'] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">প্রশ্নব্যাংক লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/student')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                ফিরে যান
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">প্রশ্ন ব্যাংক</h1>
                <p className="text-xs sm:text-sm text-gray-600">NCTB কারিকুলাম অনুযায়ী প্রশ্ন ডাউনলোড করুন</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <Badge variant="outline" className="text-xs">
                মোট {resources.length}টি
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        
        {/* Filters */}
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              শ্রেণী ও বিষয় নির্বাচন করুন
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Class Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">শ্রেণী</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9-10">নবম-দশম শ্রেণী</SelectItem>
                    <SelectItem value="11-12">একাদশ-দ্বাদশ শ্রেণী</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">বিষয়</label>
                <Select value={selectedSubject} onValueChange={(value) => {
                  setSelectedSubject(value);
                  setSelectedChapter('');
                  setSelectedSubcategory('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="science">বিজ্ঞান</SelectItem>
                    <SelectItem value="math">গণিত</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chapter Selection - Show when class and subject are selected */}
            {selectedClass && selectedSubject && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">অধ্যায় (ঐচ্ছিক ফিল্টার)</label>
                  <Select value={selectedChapter} onValueChange={(value) => {
                    setSelectedChapter(value);
                    setSelectedSubcategory('all');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="সব অধ্যায় দেখুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব অধ্যায়</SelectItem>
                      {getAvailableChapters().map(chapter => (
                        <SelectItem key={chapter} value={chapter}>
                          {chapter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory Selection - Only for Class 11-12 and when chapter is selected */}
                {selectedClass === '11-12' && selectedChapter && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">উপবিভাগ (ঐচ্ছিক ফিল্টার)</label>
                    <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="সব উপবিভাগ দেখুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব উপবিভাগ</SelectItem>
                        {subcategories.map(subcategory => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show selection status */}
        {selectedClass && selectedSubject && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-white">
                    {getClassDisplayName(selectedClass)}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <Badge variant="outline" className="bg-white">
                    {getSubjectName(selectedSubject)}
                  </Badge>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  {resources.length}টি অধ্যায় পাওয়া গেছে
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources List */}
        <div className="space-y-4">
          {!selectedClass || !selectedSubject ? (
            <Card className="border-gray-200">
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">প্রথমে শ্রেণী ও বিষয় নির্বাচন করুন</p>
                <p className="text-sm text-gray-500 mt-2">তারপর আপনার প্রয়োজনীয় অধ্যায়ের রিসোর্স দেখুন</p>
              </CardContent>
            </Card>
          ) : resources.length === 0 ? (
            <Card className="border-gray-200">
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">এই শ্রেণী ও বিষয়ের জন্য কোনো রিসোর্স পাওয়া যায়নি</p>
                <p className="text-sm text-gray-500 mt-2">শীঘ্রই আরো রিসোর্স যোগ করা হবে</p>
              </CardContent>
            </Card>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold text-gray-900 mb-2">
                        {resource.chapter_name}
                      </CardTitle>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getClassDisplayName(resource.class_level)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getSubjectName(resource.subject)}
                        </Badge>
                        <Badge className="text-xs bg-green-100 text-green-800">
                          Google Drive
                        </Badge>
                        {resource.subcategory && (
                          <Badge className="text-xs bg-purple-100 text-purple-800">
                            {resource.subcategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleOpenDriveLink(resource)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Google Drive এ দেখুন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        {resources.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{resources.length}</div>
                <div className="text-sm text-green-600">অধ্যায়ের রিসোর্স উপলব্ধ</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
