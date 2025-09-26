import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  MessageSquare, 
  Send, 
  User, 
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';

interface StudentMessagingProps {
  isDarkMode: boolean;
}

export function StudentMessaging({ isDarkMode }: StudentMessagingProps) {
  const [newMessage, setNewMessage] = useState('');
  const [teacher, setTeacher] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch teacher info - FIXED: Remove Date.now() from query key to stop infinite loop
  const { data: teacherData, isLoading: teacherLoading, error: teacherError } = useQuery({
    queryKey: ["/api/messages/teacher"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Set teacher once data is loaded
  useEffect(() => {
    if (teacherData && !teacher) {
      setTeacher(teacherData);
    }
  }, [teacherData, teacher]);

  // Fetch conversation with teacher - FIXED: Remove Date.now() and use proper caching
  const { data: conversation = [], isLoading: conversationLoading } = useQuery({
    queryKey: ["/api/messages/conversation", teacher?.id],
    enabled: !!teacher?.id,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time
    staleTime: 1000, // Consider fresh for 1 second
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Auto-scroll when conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/messages/send", data);
      return response.json();
    },
    onSuccess: (data) => {
      setNewMessage('');
      // Invalidate and refetch conversation
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", teacher?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !teacher || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      receiverId: teacher.id,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Loading states
  if (teacherLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading teacher information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (teacherError || !teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Teacher</h3>
              <p className="text-gray-600 text-sm">Please check your connection and try again.</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* WhatsApp-like Header */}
      <div className="bg-green-600 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white p-1 hover:bg-green-700"
            onClick={() => setLocation('/student')}
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-green-500 text-white text-lg font-bold">
              {teacher.firstName?.[0] || 'T'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold">{teacher.firstName} {teacher.lastName}</h3>
            <p className="text-green-100 text-sm">Chemistry & ICT Teacher</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white p-1 hover:bg-green-700">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white p-1 hover:bg-green-700">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white p-1 hover:bg-green-700">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area - WhatsApp-like Chat Background */}
      <div 
        className="flex-1 relative"
        style={{
          backgroundColor: '#efeae2',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpath d='M25 25h50v50H25z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <ScrollArea className="h-full p-3">
          {conversationLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading messages...</p>
              </div>
            </div>
          ) : conversation.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">স্বাগতম!</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Start your conversation with your teacher. Ask questions about Chemistry & ICT!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {conversation.map((message: any) => {
                const isFromMe = message.isFromMe || message.fromUserId === user?.id;
                const timestamp = message.timestamp || message.createdAt;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
                        isFromMe
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">
                        {message.content}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        isFromMe ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className={`text-xs ${
                          isFromMe ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {timestamp ? format(new Date(timestamp), 'HH:mm') : ''}
                        </span>
                        {isFromMe && (
                          <CheckCircle2 className="h-3 w-3 text-green-100" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input Area - WhatsApp-like Input */}
      <div className="bg-white p-3 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (বার্তা লিখুন...)"
              className="rounded-full border-gray-300 focus:border-green-500 focus:ring-green-500 py-3 px-4"
              maxLength={500}
              data-testid="student-message-input"
            />
            {newMessage.trim() && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {newMessage.length}/500
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 flex-shrink-0"
            data-testid="student-send-button"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Quick tip for better messaging */}
        {newMessage.trim() && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 Press Enter to send your message
          </p>
        )}
      </div>
    </div>
  );
}
