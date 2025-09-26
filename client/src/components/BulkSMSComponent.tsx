import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Send, Clock, CheckCircle, XCircle, Users } from 'lucide-react';

interface BulkSMSComponentProps {
  isDarkMode: boolean;
}

export function BulkSMSComponent({ isDarkMode }: BulkSMSComponentProps) {
  const [message, setMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [smsType, setSmsType] = useState('general');
  const [deliveryReport, setDeliveryReport] = useState<any>(null);

  // Mock student data (in real app, fetch from API)
  const allStudents = [
    { id: 'student-rashid', name: 'Rashid Ahmed', phoneNumber: '+8801700000001' },
    { id: 'student-2', name: 'Fatima Khan', phoneNumber: '+8801700000002' },
    { id: 'student-3', name: 'Karim Hassan', phoneNumber: '+8801700000003' },
    { id: 'student-4', name: 'Ayesha Rahman', phoneNumber: '+8801700000004' },
    { id: 'student-5', name: 'Omar Farooq', phoneNumber: '+8801700000005' }
  ];

  const sendBulkSMSMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/sms/send-bulk', data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Bulk SMS sent successfully:', data);
      setMessage('');
      setSelectedStudents([]);
      // Invalidate SMS credits cache for real-time balance update
      queryClient.invalidateQueries({ queryKey: ['/api/user/sms-credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sms/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sms/logs'] });
      // Optionally fetch delivery report
      fetchDeliveryReport();
    },
    onError: (error) => {
      console.error('Error sending bulk SMS:', error);
    }
  });

  const deliveryReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/sms/delivery-report');
      return response.json();
    },
    onSuccess: (data) => {
      setDeliveryReport(data);
    }
  });

  const fetchDeliveryReport = () => {
    deliveryReportMutation.mutate();
  };

  const handleSendSMS = () => {
    if (!message.trim() || selectedStudents.length === 0) return;

    sendBulkSMSMutation.mutate({
      message: message.trim(),
      recipients: selectedStudents,
      smsType
    });
  };

  const toggleStudentSelection = (student: any) => {
    if (selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const selectAllStudents = () => {
    setSelectedStudents(allStudents);
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SMS Composer */}
      <Card className={`${isDarkMode 
        ? 'bg-slate-800/50 border-blue-400/30' 
        : 'bg-white/90 border-blue-200'} backdrop-blur-sm shadow-xl`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            <Smartphone className="w-5 h-5" />
            Bulk SMS Composer
          </CardTitle>
          <CardDescription>Send messages to multiple students at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Message Type
            </label>
            <div className="flex gap-2">
              {['general', 'exam', 'notice', 'urgent'].map(type => (
                <Button
                  key={type}
                  variant={smsType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSmsType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Student Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Select Recipients ({selectedStudents.length} selected)
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllStudents}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
              {allStudents.map(student => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedStudents.find(s => s.id === student.id)
                      ? isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                      : isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleStudentSelection(student)}
                >
                  <span className="text-sm">{student.name}</span>
                  <span className="text-xs text-slate-500">{student.phoneNumber}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Message ({message.length}/160 characters)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[100px]"
              maxLength={160}
            />
            
            {/* SMS Billing Warning */}
            <div className={`text-xs p-3 rounded-md mt-2 ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-3 h-3" />
                <span className="font-medium">SMS ক্রেডিট তথ্য:</span>
              </div>
              <p>• বাংলা SMS: ৬৭ অক্ষরের বেশি হলে ২টি ক্রেডিট কাটবে</p>
              <p>• ইংরেজি SMS: ১৬০ অক্ষরের বেশি হলে ২টি ক্রেডিট কাটবে</p>
              {message.length > 0 && (
                <p>• বর্তমান মেসেজ: {message.length} অক্ষর 
                  <span className={(/[\u0980-\u09FF]/.test(message) 
                    ? (message.length > 67 ? ' text-orange-500 font-medium' : '') 
                    : (message.length > 160 ? ' text-orange-500 font-medium' : '')
                  )}>
                    ({Math.max(1, Math.ceil(message.length / (/[\u0980-\u09FF]/.test(message) ? 67 : 160)))} ক্রেডিট প্রয়োজন)
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendSMS}
            disabled={!message.trim() || selectedStudents.length === 0 || sendBulkSMSMutation.isPending}
            className="w-full"
          >
            {sendBulkSMSMutation.isPending ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedStudents.length} Recipients
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Report */}
      <Card className={`${isDarkMode 
        ? 'bg-slate-800/50 border-green-400/30' 
        : 'bg-white/90 border-green-200'} backdrop-blur-sm shadow-xl`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${
            isDarkMode ? 'text-green-300' : 'text-green-700'
          }`}>
            <Users className="w-5 h-5" />
            SMS Delivery Report
          </CardTitle>
          <CardDescription>Track the status of your sent messages</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchDeliveryReport}
            disabled={deliveryReportMutation.isPending}
            className="mb-4"
          >
            {deliveryReportMutation.isPending ? 'Loading...' : 'Refresh Report'}
          </Button>

          {deliveryReport && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Delivered</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {deliveryReport.delivered}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {deliveryReport.failed}
                  </div>
                </div>
              </div>

              {/* Recent Messages */}
              <div>
                <h4 className={`font-medium mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Recent Messages
                </h4>
                <div className="space-y-2">
                  {deliveryReport.recentMessages?.map((msg: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                    >
                      <span className="text-sm">{msg.phoneNumber}</span>
                      <Badge 
                        variant={msg.status === 'delivered' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {msg.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
