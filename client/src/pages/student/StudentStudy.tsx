import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft,
  BookOpen,
  Plus,
  Share,
  Download,
  FileText,
  Calendar,
  LogOut,
  Moon,
  Sun,
  Link
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function StudentStudy() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('chemistry');
  const { toast } = useToast();

  const { data: sharedNotes = [], isLoading } = useQuery({
    queryKey: ['/api/notes/shared'],
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const response = await apiRequest('POST', '/api/notes', noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes/shared'] });
      setIsAddDialogOpen(false);
      setNoteTitle('');
      setNoteContent('');
      toast({
        title: "সফল!",
        description: "নোট শেয়ার করা হয়েছে।",
      });
    },
    onError: () => {
      toast({
        title: "ত্রুটি",
        description: "নোট শেয়ার করতে পারিনি। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    }
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    
    addNoteMutation.mutate({
      title: noteTitle,
      content: noteContent,
      subject: noteSubject,
      sharedBy: user?.firstName || 'Student'
    });
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

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
                  onClick={() => setLocation('/student')}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-emerald-400' 
                    : 'hover:bg-gray-100 text-emerald-600'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    স্টাডি নোট
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    নোট শেয়ার ও ডাউনলোড
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                    <DialogHeader>
                      <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                        নতুন নোট শেয়ার করুন
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddNote} className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          নোটের শিরোনাম
                        </label>
                        <Input
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="উদাহরণ: রসায়ন - অ্যাসিড ও ক্ষার"
                          className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          বিষয়
                        </label>
                        <select
                          value={noteSubject}
                          onChange={(e) => setNoteSubject(e.target.value)}
                          className={`w-full p-2 rounded-md border ${isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="chemistry">রসায়ন</option>
                          <option value="ict">ICT</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          নোটের বিষয়বস্তু
                        </label>
                        <Textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="এখানে আপনার নোট লিখুন..."
                          className={`min-h-[120px] ${isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' 
                            : ''
                          }`}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                        >
                          বাতিল
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                          disabled={addNoteMutation.isPending || !noteTitle.trim() || !noteContent.trim()}
                        >
                          <Share className="w-4 h-4 mr-2" />
                          শেয়ার করুন
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-yellow-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-9 h-9 ${isDarkMode 
                    ? 'hover:bg-slate-700 text-red-400' 
                    : 'hover:bg-gray-100 text-red-600'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="force-mobile-layout px-3 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Shared Notes */}
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30' 
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-md'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                  <BookOpen className="w-5 h-5" />
                  শেয়ারকৃত নোট সমূহ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sharedNotes.length > 0 ? (
                  sharedNotes.map((note: any) => (
                    <div key={note.id} className={`p-4 rounded-lg border ${isDarkMode 
                      ? 'bg-slate-800/50 border-slate-600' 
                      : 'bg-white border-gray-200'
                    } hover:shadow-md transition-shadow`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {note.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          note.subject === 'chemistry' 
                            ? (isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700')
                            : (isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700')
                        }`}>
                          {note.subject === 'chemistry' ? 'রসায়ন' : 'ICT'}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {note.content.substring(0, 120)}
                        {note.content.length > 120 && '...'}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 opacity-50" />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {note.timeAgo || 'আজকে'}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            • {note.sharedBy}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className={`${isDarkMode ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                          <Link className="w-4 h-4 mr-1" />
                          দেখুন
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">এখনো কোনো নোট শেয়ার করা হয়নি</p>
                    <p className="text-xs mt-1">উপরের + বোতাম চেপে প্রথম নোট শেয়ার করুন</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Resources */}
            <Card className={`force-mobile-card ${isDarkMode ? 'bg-slate-800/80 border-slate-600' : 'bg-white border-gray-200 shadow-md'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-cyan-700'}`}>
                  <Download className="w-5 h-5" />
                  ডাউনলোড রিসোর্স
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">ডাউনলোডযোগ্য রিসোর্স শীঘ্রই যোগ করা হবে</p>
                  <p className="text-xs mt-1">বই, নোট, এবং অন্যান্য পড়াশোনার উপকরণ</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MobileWrapper>
  );
}
