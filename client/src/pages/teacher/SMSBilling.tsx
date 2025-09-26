import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Calculator, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface SMSLog {
  id: string;
  recipientType: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  status: string;
  credits: number;
  costPaisa: number;
  smsType: string;
  sentAt: string;
}

interface SMSStats {
  totalSent: number;
  totalCredits: number;
  totalCostPaisa: number;
  todayCount: number;
  todayCost: number;
  weeklyCount: number;
  weeklyCost: number;
  monthlyCount: number;
  monthlyCost: number;
}

// SMS Character Calculator Component
const SMSCalculator: React.FC = () => {
  const [message, setMessage] = useState('');
  const [billing, setBilling] = useState({
    messageLength: 0,
    smsParts: 0,
    totalCost: 0,
    characterType: 'english' as 'bengali' | 'english'
  });

  const calculateBilling = (text: string) => {
    const messageLength = text.length;
    const hasBengaliChars = /[\u0980-\u09FF]/.test(text);
    const characterType: 'bengali' | 'english' = hasBengaliChars ? 'bengali' : 'english';
    const charLimit = characterType === 'bengali' ? 70 : 160;
    const smsParts = Math.max(1, Math.ceil(messageLength / charLimit));
    const totalCost = smsParts * 0.39;

    setBilling({
      messageLength,
      smsParts,
      totalCost,
      characterType
    });
  };

  useEffect(() => {
    calculateBilling(message);
  }, [message]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          SMS Cost Calculator
        </CardTitle>
        <CardDescription>
          Calculate SMS parts and cost before sending
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Message Text</label>
          <Textarea
            placeholder="Type your SMS message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {billing.messageLength}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Characters</div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {billing.smsParts}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">SMS Parts</div>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {billing.totalCost.toFixed(2)}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Paisa</div>
          </div>

          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <Badge variant={billing.characterType === 'bengali' ? 'default' : 'secondary'}>
              {billing.characterType === 'bengali' ? 'বাংলা (70)' : 'English (160)'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Character Limit Progress</span>
            <span>{billing.messageLength}/{billing.characterType === 'bengali' ? 70 : 160} per part</span>
          </div>
          <Progress 
            value={(billing.messageLength % (billing.characterType === 'bengali' ? 70 : 160)) / (billing.characterType === 'bengali' ? 70 : 160) * 100} 
            className="h-2"
          />
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Billing Rules:</strong>
            <br />
            • Bengali: 70 characters = 1 SMS part
            <br />
            • English: 160 characters = 1 SMS part
            <br />
            • Cost: 0.39 paisa per SMS part
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// SMS Logs Component
const SMSLogsTable: React.FC<{ logs: SMSLog[] }> = ({ logs }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Recent SMS Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No SMS logs found
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.status === 'sent' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium">{log.recipientName || 'Unknown'}</span>
                    <Badge variant="outline">{log.smsType}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(log.sentAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>To:</strong> {log.recipientPhone}
                </div>
                
                <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {log.message}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {log.credits} parts
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {(log.costPaisa / 100).toFixed(2)} paisa
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// SMS Statistics Component
const SMSStatistics: React.FC<{ stats: SMSStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Today's SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <Badge variant="secondary">{stats.todayCost.toFixed(2)}p</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.weeklyCount}</div>
            <Badge variant="secondary">{stats.weeklyCost.toFixed(2)}p</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.monthlyCount}</div>
            <Badge variant="secondary">{stats.monthlyCost.toFixed(2)}p</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Sent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <Badge variant="default">{(stats.totalCostPaisa / 100).toFixed(2)}p</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SMSBilling: React.FC = () => {
  const { data: smsLogs = [], isLoading: logsLoading } = useQuery<SMSLog[]>({
    queryKey: ['/api/sms/logs'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: smsStats, isLoading: statsLoading } = useQuery<SMSStats>({
    queryKey: ['/api/sms/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Provide default stats if data is loading or undefined
  const defaultStats: SMSStats = {
    totalSent: 0,
    totalCredits: 0,
    totalCostPaisa: 0,
    todayCount: 0,
    todayCost: 0,
    weeklyCount: 0,
    weeklyCost: 0,
    monthlyCount: 0,
    monthlyCost: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            SMS Billing Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Professional SMS cost calculation and usage tracking
          </p>
        </div>

        {/* Statistics */}
        <SMSStatistics stats={smsStats || defaultStats} />

        {/* Main Content */}
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS Logs
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <SMSCalculator />
          </TabsContent>

          <TabsContent value="logs">
            <SMSLogsTable logs={smsLogs || []} />
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  SMS Usage Reports
                </CardTitle>
                <CardDescription>
                  Detailed analysis of SMS usage and costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Detailed reports coming soon...
                  <br />
                  This will include charts, trends, and export options.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SMSBilling;
