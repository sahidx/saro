import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface TeacherMessagingProps {
  isDarkMode: boolean;
}

export function TeacherMessaging({ isDarkMode }: TeacherMessagingProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all students for messaging with real-time updates
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/messages/students", Date.now()], // Force fresh requests with timestamp
    refetchInterval: 3000, // Auto-refresh every 3 seconds for new messages
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
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
    queryKey: ["/api/messages/conversation", selectedStudent?.id, Date.now()], // Force fresh requests
    enabled: !!selectedStudent?.id,
    refetchInterval: 2000, // Auto-refresh conversation every 2 seconds
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return await apiRequest("POST", "/api/messages/send", data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Message Sent",
        description: `Message sent to ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
      });
      setNewMessage('');
      // Refresh conversation and student list
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversation", selectedStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/students"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to Send Message",
        description: error.message || "Something went wrong. Please try again.",
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Student List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Messages
            {(students as any[]).filter((s: any) => s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe).length > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {(students as any[]).filter((s: any) => s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe).length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Student conversations - new messages appear automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            {studentsLoading ? (
              <div className="p-4 text-center text-gray-500">Loading students...</div>
            ) : (students as any[]).length === 0 ? (
              <div className="p-4 text-center text-gray-500">No students found</div>
            ) : (
              <div className="space-y-2 p-4">
                {/* Sort students: unread messages first, then by last message time */}
                {(students as any[])
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
                  })
                  .map((student: any) => {
                    const hasUnreadMessage = student.lastMessage && !student.lastMessage.isRead && !student.lastMessage.isFromMe;
                    
                    return (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border relative ${
                          selectedStudent?.id === student.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : hasUnreadMessage
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                        } ${hasUnreadMessage ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}
                        data-testid={`student-${student.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm truncate ${
                                hasUnreadMessage ? 'text-green-800 dark:text-green-200 font-bold' : ''
                              }`}>
                                {student.firstName} {student.lastName}
                              </p>
                              {hasUnreadMessage && (
                                <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {student.phoneNumber}
                            </p>
                            {student.lastMessage && (
                              <p className={`text-xs truncate mt-1 ${
                                hasUnreadMessage 
                                  ? 'text-green-700 dark:text-green-300 font-medium' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                {student.lastMessage.isFromMe ? '✓ You: ' : '💬 '}
                                {student.lastMessage.content}
                              </p>
                            )}
                            {student.lastMessage && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {format(new Date(student.lastMessage.createdAt), 'MMM dd, HH:mm')}
                              </p>
                            )}
                          </div>
                          {hasUnreadMessage && (
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                New
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {selectedStudent ? (
              <>
                <User className="h-5 w-5 text-green-600" />
                💬 {selectedStudent.firstName} {selectedStudent.lastName}
                {(students as any[]).find((s: any) => 
                  s.id === selectedStudent.id && s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe
                ) && (
                  <Badge className="bg-green-500 text-white text-xs ml-2">
                    Unread Messages
                  </Badge>
                )}
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 text-gray-400" />
                💬 Messenger - Student Messages
              </>
            )}
          </CardTitle>
          {selectedStudent && (
            <CardDescription>
              Phone: {selectedStudent.phoneNumber} • Student ID: {selectedStudent.studentId}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col h-[480px]">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Select a student from the list to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 mb-4 pr-4">
                {conversationLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading conversation...</div>
                ) : (conversation as any[]).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(conversation as any[]).map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderRole === 'teacher' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.senderRole === 'teacher'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 opacity-60" />
                            <span className="text-xs opacity-60">
                              {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                            </span>
                            {message.senderRole === 'teacher' && (
                              <CheckCircle2 className="h-3 w-3 opacity-60 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  data-testid="message-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="px-4 py-2 h-[60px]"
                  data-testid="send-message-button"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
