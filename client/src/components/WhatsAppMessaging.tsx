import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Send,
  Phone,
  MoreVertical,
  ArrowLeft,
  Check,
  CheckCheck,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface WhatsAppMessagingProps {
  isDarkMode: boolean;
}

export function WhatsAppMessaging({ isDarkMode }: WhatsAppMessagingProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all students for messaging with real-time updates
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ["/api/messages/students"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds for new messages
    staleTime: 2000, // Consider data fresh for 2 seconds
  });

  // Auto-select first student with unread messages
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      // Find first student with unread messages, or first student with any messages
      const studentWithUnread = (students as any[]).find(s => 
        s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe
      );
      const studentWithMessages = (students as any[]).find(s => s.lastMessage);
      const defaultStudent = studentWithUnread || studentWithMessages || students[0];
      
      if (defaultStudent) {
        setSelectedStudent(defaultStudent);
      }
    }
  }, [students, selectedStudent]);

  // Fetch conversation with selected student with real-time updates
  const { data: conversation = [], isLoading: conversationLoading } = useQuery({
    queryKey: ["/api/messages/conversation", selectedStudent?.id],
    enabled: !!selectedStudent?.id,
    refetchInterval: 3000, // Auto-refresh conversation every 3 seconds
    staleTime: 1000, // Consider data fresh for 1 second
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return await apiRequest("POST", "/api/messages/send", data);
    },
    onSuccess: () => {
      setNewMessage('');
      // Refresh conversation and student list
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/students"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Message sending failed",
        description: error.message || "Could not send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedStudent) return;

    sendMessageMutation.mutate({
      receiverId: selectedStudent.id,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM dd');
    }
  };

  // Sort students: unread messages first, then by last message time
  const sortedStudents = (students as any[])
    .sort((a: any, b: any) => {
      // First priority: unread messages from students
      const aHasUnread = a.lastMessage && !a.lastMessage.isRead && !a.lastMessage.isFromMe;
      const bHasUnread = b.lastMessage && !b.lastMessage.isRead && !b.lastMessage.isFromMe;
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // Second priority: most recent message
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      
      // Fallback: alphabetical
      return (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName);
    });

  return (
    <div className="flex h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Contacts Sidebar */}
      <div className={`${
        isMobileView && selectedStudent ? 'hidden' : 'block'
      } w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Header */}
        <div className="bg-green-600 dark:bg-green-700 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">💬 Messages</h2>
            <div className="flex items-center gap-2">
              {sortedStudents.filter((s: any) => s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe).length > 0 && (
                <Badge className="bg-red-500 text-white">
                  {sortedStudents.filter((s: any) => s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe).length}
                </Badge>
              )}
              <MoreVertical className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Student List */}
        <ScrollArea className="flex-1">
          {studentsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : sortedStudents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No students found</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedStudents.map((student: any) => {
                const hasUnreadMessage = student.lastMessage && !student.lastMessage.isRead && !student.lastMessage.isFromMe;
                
                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedStudent?.id === student.id 
                        ? 'bg-gray-100 dark:bg-gray-800' 
                        : hasUnreadMessage 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : ''
                    }`}
                    data-testid={`student-${student.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 font-medium">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {hasUnreadMessage && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium text-sm truncate ${
                            hasUnreadMessage ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-white'
                          }`}>
                            {student.firstName} {student.lastName}
                          </p>
                          {student.lastMessage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(student.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          {student.lastMessage ? (
                            <p className={`text-sm truncate ${
                              hasUnreadMessage 
                                ? 'text-green-700 dark:text-green-300 font-medium' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {student.lastMessage.isFromMe && (
                                <span className="mr-1">
                                  {student.lastMessage.isRead ? 
                                    <CheckCheck className="inline w-3 h-3 text-blue-500" /> : 
                                    <Check className="inline w-3 h-3" />
                                  }
                                </span>
                              )}
                              {student.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              No messages yet
                            </p>
                          )}
                          
                          {hasUnreadMessage && (
                            <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5 ml-2">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${
        isMobileView && !selectedStudent ? 'hidden' : 'flex'
      } flex-1 flex flex-col`}>
        {!selectedStudent ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium mb-2">WhatsApp-style Messaging</h3>
              <p>Select a student to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-green-600 dark:bg-green-700 text-white p-4 flex items-center gap-3">
              {isMobileView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                  className="text-white hover:bg-green-500 p-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-white text-green-600 font-medium">
                  {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-semibold">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-xs text-green-100">
                  {selectedStudent.phoneNumber} • Student ID: {selectedStudent.studentId}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-green-500 p-2">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-green-500 p-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
              style={{
                backgroundImage: isDarkMode 
                  ? 'none' 
                  : "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPgo=')"
              }}
            >
              {conversationLoading ? (
                <div className="text-center py-8 text-gray-500">Loading messages...</div>
              ) : (conversation as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">👋</div>
                  <p>Start the conversation with {selectedStudent.firstName}!</p>
                </div>
              ) : (
                (conversation as any[]).map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderRole === 'teacher' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 relative ${
                        message.senderRole === 'teacher'
                          ? 'bg-green-500 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 justify-end ${
                        message.senderRole === 'teacher' ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span className="text-xs">
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                        {message.senderRole === 'teacher' && (
                          <span className="ml-1">
                            {message.isRead ? 
                              <CheckCheck className="w-3 h-3 text-blue-200" /> : 
                              <Check className="w-3 h-3" />
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="pr-12 rounded-full border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                    data-testid="message-input"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="rounded-full h-10 w-10 p-0 bg-green-500 hover:bg-green-600 text-white"
                  data-testid="send-message-button"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
