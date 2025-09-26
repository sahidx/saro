/**
 * Student Monthly Results Viewer
 * Shows individual student's monthly performance history and current standings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, TrendingUp, Trophy, Calendar, BookOpen, 
  Target, BarChart3, Medal, Clock, Users 
} from 'lucide-react';

interface MonthlyResult {
  studentId: string;
  batchId: string;
  year: number;
  month: number;
  classLevel: string;
  examAverage: number;
  totalExams: number;
  presentDays: number;
  absentDays: number;
  excusedDays: number;
  workingDays: number;
  attendancePercentage: number;
  bonusMarks: number;
  finalScore: number;
  classRank: number;
  totalStudents: number;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StudentMonthlyResults() {
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyResult[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    fetchStudentInfo();
  }, []);

  useEffect(() => {
    if (studentInfo?.id) {
      fetchMonthlyHistory();
    }
  }, [studentInfo]);

  const fetchStudentInfo = async () => {
    try {
      const response = await fetch('/api/student/dashboard', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.student) {
        setStudentInfo(data.student);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
      setError('Failed to load student information');
    }
  };

  const fetchMonthlyHistory = async () => {
    if (!studentInfo?.id) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/students/${studentInfo.id}/monthly-history`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setMonthlyHistory(data.history || []);
      } else {
        setError('Failed to load monthly results history');
      }
    } catch (error) {
      console.error('Error fetching monthly history:', error);
      setError('Failed to load monthly results history');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (finalScore: number) => {
    if (finalScore >= 90) return 'bg-green-500 text-white';
    if (finalScore >= 80) return 'bg-blue-500 text-white';
    if (finalScore >= 70) return 'bg-yellow-500 text-black';
    if (finalScore >= 60) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getRankBadgeColor = (rank: number, totalStudents: number) => {
    const percentage = (rank / totalStudents) * 100;
    if (percentage <= 10) return 'bg-yellow-500 text-black'; // Top 10%
    if (percentage <= 25) return 'bg-gray-400 text-white';   // Top 25%
    if (percentage <= 50) return 'bg-amber-600 text-white';  // Top 50%
    return 'bg-gray-500 text-white';
  };

  const getPerformanceIcon = (rank: number, totalStudents: number) => {
    const percentage = (rank / totalStudents) * 100;
    if (percentage <= 10) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (percentage <= 25) return <Medal className="h-4 w-4 text-gray-400" />;
    if (percentage <= 50) return <Target className="h-4 w-4 text-amber-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  // Filter results by selected year
  const filteredResults = monthlyHistory.filter(result => result.year === selectedYear);
  const availableYears = Array.from(new Set(monthlyHistory.map(r => r.year))).sort((a, b) => b - a);

  // Calculate improvement trend
  const calculateTrend = () => {
    if (filteredResults.length < 2) return null;
    
    const sortedResults = [...filteredResults].sort((a, b) => a.month - b.month);
    const latest = sortedResults[sortedResults.length - 1];
    const previous = sortedResults[sortedResults.length - 2];
    
    const scoreDiff = latest.finalScore - previous.finalScore;
    const rankDiff = previous.classRank - latest.classRank; // Lower rank is better
    
    return { scoreDiff, rankDiff };
  };

  const trend = calculateTrend();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading your monthly results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 My Monthly Performance</h1>
          <p className="text-gray-600 mt-2">
            Track your academic progress and achievements
          </p>
        </div>
        {studentInfo && (
          <div className="text-right">
            <div className="font-semibold text-lg">{studentInfo.firstName} {studentInfo.lastName}</div>
            <Badge variant="outline" className="mt-1">
              Class {studentInfo.classLevel}
            </Badge>
          </div>
        )}
      </div>

      {/* Year Filter */}
      {availableYears.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Select Year:</label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Performance Summary */}
      {filteredResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(filteredResults.reduce((sum, r) => sum + r.finalScore, 0) / filteredResults.length)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Average Score</div>
              {trend && (
                <div className={`text-xs mt-2 ${trend.scoreDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.scoreDiff >= 0 ? '↗' : '↘'} {Math.abs(trend.scoreDiff)} points
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...filteredResults.map(r => r.finalScore))}
              </div>
              <div className="text-sm text-gray-500 mt-1">Best Score</div>
              <div className="flex justify-center mt-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(filteredResults.reduce((sum, r) => sum + r.attendancePercentage, 0) / filteredResults.length)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg Attendance</div>
              <div className="flex justify-center mt-2">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                #{Math.round(filteredResults.reduce((sum, r) => sum + r.classRank, 0) / filteredResults.length)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg Rank</div>
              {trend && (
                <div className={`text-xs mt-2 ${trend.rankDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.rankDiff >= 0 ? '↗' : '↘'} {Math.abs(trend.rankDiff)} positions
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Results History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Monthly Performance History ({selectedYear})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Month</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Rank</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Final Score</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Exam Average</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Attendance</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Bonus</th>
                    <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Exams Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults
                    .sort((a, b) => b.month - a.month) // Latest first
                    .map((result) => (
                      <tr key={`${result.year}-${result.month}`} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 font-medium">
                          <div className="flex items-center space-x-2">
                            {getPerformanceIcon(result.classRank, result.totalStudents)}
                            <span>{months[result.month - 1]} {result.year}</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <Badge className={getRankBadgeColor(result.classRank, result.totalStudents)}>
                            #{result.classRank}/{result.totalStudents}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <Badge className={getGradeColor(result.finalScore)}>
                            {result.finalScore}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="font-semibold">{result.examAverage}%</span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <div className="space-y-1">
                            <span className="font-semibold">{result.attendancePercentage}%</span>
                            <div className="text-xs text-gray-500">
                              {result.presentDays}/{result.workingDays} days
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="text-green-600 font-semibold">+{result.bonusMarks}</span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <span>{result.totalExams}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No monthly results available for {selectedYear}.</p>
              <p className="text-sm mt-2">Results will appear here once your teacher generates them.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      {filteredResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Performance Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 How Your Score is Calculated</h4>
                <div className="text-blue-800 text-sm space-y-1">
                  <p><strong>Final Score = (70% × Exam Average) + (20% × Attendance) + (10% × Bonus)</strong></p>
                  <p>• <strong>Exam Average:</strong> Average percentage from all monthly exams</p>
                  <p>• <strong>Attendance Score:</strong> Percentage of days present</p>
                  <p>• <strong>Bonus Points:</strong> Extra points based on working days (30 - working_days)</p>
                </div>
              </div>
              
              {/* Latest Month Breakdown */}
              {filteredResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const latest = filteredResults.sort((a, b) => b.month - a.month)[0];
                    const examContribution = Math.round(latest.examAverage * 0.7);
                    const attendanceContribution = Math.round(latest.attendancePercentage * 0.2);
                    const bonusContribution = Math.round(latest.bonusMarks * 0.1);
                    
                    return (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{examContribution}</div>
                          <div className="text-sm text-green-700 mt-1">From Exams (70%)</div>
                          <div className="text-xs text-gray-500 mt-1">{latest.examAverage}% × 0.7</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{attendanceContribution}</div>
                          <div className="text-sm text-blue-700 mt-1">From Attendance (20%)</div>
                          <div className="text-xs text-gray-500 mt-1">{latest.attendancePercentage}% × 0.2</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">{bonusContribution}</div>
                          <div className="text-sm text-yellow-700 mt-1">From Bonus (10%)</div>
                          <div className="text-xs text-gray-500 mt-1">{latest.bonusMarks} × 0.1</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
