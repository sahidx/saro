/**
 * Automated Monthly Results Status Component
 * Shows the status of the automated monthly result processing system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, X, Clock, Play, Calendar, 
  Users, BarChart3, AlertCircle, Zap,
  TrendingUp, Award, Target, Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonthlyResultStatus {
  currentMonth: string;
  nextProcessingDate: string;
  isAutomated: boolean;
  lastProcessed: string | null;
  totalStudents: number;
  totalExams: number;
  workingDaysThisMonth: number;
  attendanceRate: number;
}

export default function AutomatedResultsStatus() {
  const [status, setStatus] = useState<MonthlyResultStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/monthly-results/status', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const triggerManualProcessing = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/monthly-results/process/${year}/${month}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Processing Started",
          description: "Monthly results are being processed automatically",
          variant: "default",
        });
        fetchStatus(); // Refresh status
      } else {
        toast({
          title: "Processing Failed",
          description: data.error || "Failed to start processing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error triggering processing:', error);
      toast({
        title: "Error",
        description: "Failed to trigger processing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>Loading automation status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <span>🤖 Automated Monthly Results System</span>
            <Badge 
              className={status.isAutomated ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
              {status.isAutomated ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Fully Automated System:</strong> Monthly results are automatically calculated from regular exam scores, 
              attendance records, and academic calendar. Teachers only need to manage calendar and mark attendance.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Status */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Processing Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current Month:</span>
                  <span className="font-medium">{status.currentMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Processed:</span>
                  <span className="font-medium">
                    {status.lastProcessed ? new Date(status.lastProcessed).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Next Auto Process:</span>
                  <span className="font-medium">{status.nextProcessingDate}</span>
                </div>
              </div>
            </div>

            {/* Monthly Statistics */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Monthly Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Working Days:</span>
                  <span className="font-medium">{status.workingDaysThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Students:</span>
                  <span className="font-medium">{status.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Exams:</span>
                  <span className="font-medium">{status.totalExams}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attendance Rate:</span>
                  <span className={`font-medium ${status.attendanceRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                    {status.attendanceRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={triggerManualProcessing}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Clock className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Processing...' : 'Process Current Month'}
            </Button>
            
            <Button
              variant="outline"
              onClick={fetchStatus}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{status.workingDaysThisMonth}</div>
            <div className="text-sm text-gray-500">Working Days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{status.totalStudents}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{status.totalExams}</div>
            <div className="text-sm text-gray-500">Regular Exams</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <div className={`text-2xl font-bold ${status.attendanceRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>
              {status.attendanceRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">Attendance Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* System Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Automation Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Automatic Result Calculation</div>
                <div className="text-sm text-gray-600">
                  Results are calculated automatically from exam scores (70%) + attendance (20%) + bonus (10%)
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Calendar-Based Attendance</div>
                <div className="text-sm text-gray-600">
                  Attendance tracking uses academic calendar working days only
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Class-wise Rankings</div>
                <div className="text-sm text-gray-600">
                  Automatic ranking generation by class level and subject performance
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Monthly Processing</div>
                <div className="text-sm text-gray-600">
                  Results are processed automatically at the end of each month
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
