import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Bot,
  Send,
  Loader2,
  GraduationCap,
  LogOut,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { MobileWrapper } from '@/components/MobileWrapper';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function StudentAIHelp() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const { toast } = useToast();

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const handleStreamingAI = async (doubt: string, subject: string) => {
    setIsStreaming(true);
    setCurrentResponse('');
    
    // Add user message immediately
    setConversation(prev => [...prev, { role: 'user', content: doubt }]);
    
    // Add placeholder assistant message that will be updated
    const assistantMessageIndex = conversation.length + 1;
    setConversation(prev => [...prev, { role: 'assistant', content: 'AI চিন্তা করছে...' }]);
    
    try {
      const response = await fetch('/api/ai/solve-doubt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doubt, subject, stream: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      let accumulatedContent = '';
      
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
                
                // Update the assistant message in real-time
                setConversation(prev => {
                  const updated = [...prev];
                  updated[assistantMessageIndex] = { 
                    role: 'assistant', 
                    content: accumulatedContent 
                  };
                  return updated;
                });
              } else if (data.type === 'complete') {
                accumulatedContent = data.content;
                setCurrentResponse(accumulatedContent);
                
                // Final update with complete content
                setConversation(prev => {
                  const updated = [...prev];
                  updated[assistantMessageIndex] = { 
                    role: 'assistant', 
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
      
      setQuestion('');
    } catch (error) {
      // Remove the placeholder assistant message on error
      setConversation(prev => prev.slice(0, -1));
      
      toast({
        title: "Error",
        description: "Failed to get AI help. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
      setCurrentResponse('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isStreaming) return;
    handleStreamingAI(question, 'chemistry');
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
                    Praggo AI সাহায্য
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    আপনার সন্দেহ দূর করুন
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
        <main className="force-mobile-layout px-3 py-4 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Welcome Card */}
            {conversation.length === 0 && (
              <Card className={`force-mobile-card ${isDarkMode 
                ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/30' 
                : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 shadow-lg'
              }`}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Praggo AI এর সাথে কথা বলুন
                  </h2>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    রসায়ন ও ICT বিষয়ে যেকোনো প্রশ্ন করুন। আমি বাংলায় উত্তর দিব।
                  </p>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                      <span className="font-medium">উদাহরণ:</span> "কার্বন ডাইঅক্সাইড কিভাবে তৈরি হয়?"
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/70'}`}>
                      <span className="font-medium">উদাহরণ:</span> "প্রোগ্রামিং এ লুপ কি?"
                    </div>
                  </div>
                  
                  {/* Premium Upgrade Notice */}
                  <div className={`mt-4 p-4 rounded-lg border-2 border-dashed ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-400/50' 
                      : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400/60'
                  }`}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <GraduationCap className="w-5 h-5 text-yellow-500" />
                        <span className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                          প্রিমিয়াম আনলক করুন
                        </span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'} leading-relaxed`}>
                        সম্পূর্ণ AI শক্তি আনলক করতে চান? মাসিক মাত্র <span className="font-bold">৫ টাকা প্রতি ছাত্রছাত্রী</span> দিয়ে 
                        প্রিমিয়াম সংস্করণের জন্য আপনার শিক্ষককে জিজ্ঞেস করুন।
                      </p>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700/80'}`}>
                        Premium AI features • Unlimited questions • Advanced explanations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conversation History */}
            {conversation.length > 0 && (
              <div className="space-y-4">
                {conversation.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' 
                      ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white')
                      : (isDarkMode ? 'bg-slate-800 text-gray-100 border border-slate-700' : 'bg-white text-gray-800 shadow-md')
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3">
                          <Bot className="w-5 h-5 text-purple-500" />
                          <span className="font-semibold text-purple-600">Praggo AI</span>
                          {isStreaming && idx === conversation.length - 1 && (
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Enhanced message rendering with better Bengali text support */}
                      <div className={`leading-relaxed ${msg.role === 'assistant' ? 'text-base' : 'text-base'}`}>
                        {msg.role === 'assistant' ? (
                          <div className="space-y-3">
                            {msg.content.split('\n').map((line, lineIdx) => {
                              // Check if line contains question pattern
                              if (line.match(/^[0-9০-৯]+\.|^প্রশ্ন|^Question/)) {
                                return (
                                  <div key={lineIdx} className={`font-semibold text-lg ${isDarkMode ? 'text-purple-200' : 'text-purple-800'} border-l-4 border-purple-400 pl-3 py-2 bg-purple-50 ${isDarkMode ? 'bg-purple-900/30' : ''} rounded-r-lg`}>
                                    {line}
                                  </div>
                                );
                              }
                              
                              // Check if line contains options (a, b, c, d or ক, খ, গ, ঘ)
                              if (line.match(/^[abcdকখগঘ]\)|^[ABCD]\)/)) {
                                return (
                                  <div key={lineIdx} className={`ml-4 p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'} border-l-2 border-blue-300`}>
                                    {line}
                                  </div>
                                );
                              }
                              
                              // Check if line contains answer indication
                              if (line.match(/উত্তর|Answer|সঠিক|correct/i)) {
                                return (
                                  <div key={lineIdx} className={`font-medium p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-800'} border border-green-300`}>
                                    ✅ {line}
                                  </div>
                                );
                              }
                              
                              // Check if line contains explanation
                              if (line.match(/ব্যাখ্যা|Explanation|কারণ|because/i)) {
                                return (
                                  <div key={lineIdx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300'} border-l-4`}>
                                    <span className="text-blue-600 font-medium">💡 </span>
                                    {line}
                                  </div>
                                );
                              }
                              
                              // Regular text
                              return line.trim() ? (
                                <p key={lineIdx} className="mb-2">
                                  {line}
                                </p>
                              ) : (
                                <br key={lineIdx} />
                              );
                            })}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Fixed Input Area */}
        <div className={`fixed bottom-0 left-0 right-0 ${isDarkMode 
          ? 'bg-slate-900/95 border-t border-slate-700' 
          : 'bg-white/95 border-t border-gray-200'
        } backdrop-blur-sm p-4`}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="আপনার প্রশ্ন লিখুন..."
                className={`flex-1 min-h-[50px] max-h-32 ${isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300'
                } rounded-2xl resize-none`}
                disabled={isStreaming}
              />
              <Button
                type="submit"
                disabled={!question.trim() || isStreaming}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white p-3 rounded-2xl min-w-[50px] h-[50px]"
              >
                {isStreaming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MobileWrapper>
  );
}
