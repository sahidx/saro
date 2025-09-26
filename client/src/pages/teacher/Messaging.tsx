import { WhatsAppMessaging } from '@/components/WhatsAppMessaging';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Messaging() {
  // Fetch some basic stats for the header
  const { data: stats } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: students = [] } = useQuery({
    queryKey: ["/api/messages/students"],
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          Student Messaging
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          💬 Messenger-style communication with your students. New messages appear automatically - just like WhatsApp!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(students as any[]).length}</div>
            <p className="text-xs text-muted-foreground">
              Active students in your batches
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(students as any[]).filter((s: any) => s.lastMessage).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with message history
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(students as any[]).filter((s: any) => s.lastMessage && !s.lastMessage.isRead && !s.lastMessage.isFromMe).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Messages awaiting your response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">&lt; 1hr</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Messaging Interface */}
      <WhatsAppMessaging isDarkMode={false} />

      {/* Instructions */}
      <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
            Messaging Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <h4 className="font-medium mb-2">✅ Best Practices:</h4>
              <ul className="space-y-1">
                <li>• Respond to student queries promptly</li>
                <li>• Use clear and encouraging language</li>
                <li>• Provide helpful study guidance</li>
                <li>• Share exam tips and announcements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📝 Features:</h4>
              <ul className="space-y-1">
                <li>• Real-time messaging with students</li>
                <li>• Message history and tracking</li>
                <li>• Student conversation overview</li>
                <li>• Send-only mode (students initiate)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
