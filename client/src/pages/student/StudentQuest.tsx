import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Trophy,
  Target,
  Star,
  Award,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation } from 'wouter';

export default function StudentQuest() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();

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
                    Quest চ্যালেঞ্জ
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    লক্ষ্য অর্জন করুন
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
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
            
            {/* Current Level & XP */}
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-400/30' 
              : 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 shadow-lg'
            }`}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Level 1 - নবীন শিক্ষার্থী
                </h2>
                <p className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'} mb-4`}>
                  XP: 0 / 100
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Quests */}
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30' 
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-md'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                  <Target className="w-5 h-5" />
                  আজকের লক্ষ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`p-4 rounded-lg border-2 border-dashed ${isDarkMode 
                  ? 'border-green-500/30 bg-slate-800/50' 
                  : 'border-green-300 bg-green-50/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      ১টি পরীক্ষা সম্পন্ন করুন
                    </span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      +50 XP
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    অগ্রগতি: 0/1
                  </p>
                </div>

                <div className={`p-4 rounded-lg border-2 border-dashed ${isDarkMode 
                  ? 'border-blue-500/30 bg-slate-800/50' 
                  : 'border-blue-300 bg-blue-50/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      AI থেকে ১টি সাহায্য নিন
                    </span>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      +25 XP
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    অগ্রগতি: 0/1
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className={`force-mobile-card ${isDarkMode 
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30' 
              : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-md'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                  <Award className="w-5 h-5" />
                  অর্জন সমূহ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">এখনো কোনো অর্জন নেই</p>
                  <p className="text-xs mt-1">পড়াশোনা করলে এখানে ব্যাজ পাবেন</p>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className={`force-mobile-card ${isDarkMode ? 'bg-slate-800/80 border-slate-600' : 'bg-white border-gray-200 shadow-md'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-cyan-700'}`}>
                  <Trophy className="w-5 h-5" />
                  লিডারবোর্ড
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">লিডারবোর্ড শীঘ্রই আসছে</p>
                  <p className="text-xs mt-1">অন্য ছাত্র-ছাত্রীদের সাথে প্রতিযোগিতা করুন</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MobileWrapper>
  );
}
