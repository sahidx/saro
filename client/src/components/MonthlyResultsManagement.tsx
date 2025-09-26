/**
 * Monthly Results Management Component
 * For teachers to generate and view monthly student performance results
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, Trophy, TrendingUp, Calendar, Users, Target, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFExportService } from '@/lib/pdfExport';
import { getGradeInfo } from '@/lib/gradeSystem';

interface MonthlyResult {
  studentId: string;
  studentName: string;
  batchId: string;
  classLevel: string;
  examAverage: number;
  attendancePercentage: number;
  bonusMarks: number;
  finalScore: number;
  rank: number;
  totalStudents: number;
  presentDays: number;
  workingDays: number;
  totalExams: number;
}

interface Batch {
  id: string;
  name: string;
  classLevel: string;
}

export default function MonthlyResultsManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [results, setResults] = useState<MonthlyResult[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();

  // Months for dropdown
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Years for dropdown (current year and past 2 years)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchMonthlyResults();
    }
  }, [selectedBatch, selectedYear, selectedMonth]);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/teacher/dashboard', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.batches) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches');
    }
  };

  const fetchMonthlyResults = async () => {
    if (!selectedBatch) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `/api/monthly-results/${selectedBatch}/${selectedYear}/${selectedMonth}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
      } else {
        setResults([]);
        if (data.results?.length === 0) {
          setError('No monthly results found for this period. Results will appear automatically when exam marks are entered.');
        }
      }
    } catch (error) {
      console.error('Error fetching monthly results:', error);
      setError('Failed to load monthly results');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Results are now automatically generated when exam marks are entered
  // No manual generation needed

  const getGradeColor = (finalScore: number) => {
    if (finalScore >= 90) return 'bg-green-500 text-white';
    if (finalScore >= 80) return 'bg-blue-500 text-white';
    if (finalScore >= 70) return 'bg-yellow-500 text-black';
    if (finalScore >= 60) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getRankBadgeColor = (rank: number, totalStudents: number) => {
    const percentage = (rank / totalStudents) * 100;
    if (percentage <= 10) return 'bg-yellow-500 text-black'; // Gold
    if (percentage <= 25) return 'bg-gray-400 text-white';   // Silver
    if (percentage <= 50) return 'bg-amber-600 text-white';  // Bronze
    return 'bg-gray-500 text-white';
  };

  const selectedBatchName = batches.find(b => b.id === selectedBatch)?.name || '';
  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label || '';

  const downloadBatchResultsPDF = () => {
    if (!selectedBatch) {
      toast({
        title: "No Batch Selected",
        description: "Please select a batch first to download PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      PDFExportService.generateMonthlyResultsPDF(
        results,
        selectedBatchName,
        selectedMonth,
        selectedYear
      );
      
      toast({
        title: "✅ PDF Downloaded",
        description: results.length > 0 ? "Monthly results PDF has been downloaded successfully" : "Empty results template PDF has been downloaded",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "❌ Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadStudentReportCard = (student: MonthlyResult) => {
    try {
      PDFExportService.generateStudentReportCard(
        student,
        selectedBatchName,
        selectedMonth,
        selectedYear
      );
      
      toast({
        title: "✅ Report Card Downloaded",
        description: `Report card for ${student.studentName} has been downloaded`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "❌ Download Failed",
        description: "Failed to generate report card. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Monthly Results System</h1>
          <p className="text-gray-600 mt-2">
            Generate and manage comprehensive monthly performance reports
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Academic Performance Tracking</span>
        </div>
      </div>

      {/* Controls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Result Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Batch
              </label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} - Class {batch.classLevel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PDF Download Action */}
            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadBatchResultsPDF}
                disabled={!selectedBatch}
                className="text-blue-600 border-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Monthly PDF
              </Button>
              {selectedBatch && (
                <div className="text-xs text-gray-500 text-center">
                  {results.length > 0 ? `${results.length} students` : 'Empty results will show template'}
                </div>
              )}
            </div>
          </div>

          {/* Formula Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Calculation Formula</h4>
            <div className="text-blue-800 text-sm space-y-1">
              <p><strong>Final Score = (70% × Exam Average) + (20% × Attendance) + (10% × Bonus)</strong></p>
              <p>• Exam Average: Sum of all exam percentages ÷ Total exams</p>
              <p>• Attendance: (Present days ÷ Working days) × 100</p>
              <p>• Bonus: 30 - Working days (minimum 0)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {selectedBatch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>
                  Monthly Results - {selectedBatchName} ({selectedMonthName} {selectedYear})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {results.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadBatchResultsPDF}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                    <Badge variant="outline" className="text-green-600">
                      <Users className="h-3 w-3 mr-1" />
                      {results.length} Students
                    </Badge>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading results...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                {results.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length)}
                      </div>
                      <div className="text-sm opacity-90">Average Score</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{Math.max(...results.map(r => r.finalScore))}</div>
                      <div className="text-sm opacity-90">Highest Score</div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.round(results.reduce((sum, r) => sum + r.attendancePercentage, 0) / results.length)}%
                      </div>
                      <div className="text-sm opacity-90">Avg Attendance</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">
                        {results[0]?.workingDays || 0}
                      </div>
                      <div className="text-sm opacity-90">Working Days</div>
                    </div>
                  </div>
                )}

                {/* Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Rank</th>
                        <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Student</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Class</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Exams</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Exam Avg</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Attendance</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Bonus</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Final Score</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Grade</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">GPA</th>
                        <th className="border border-gray-200 px-4 py-3 text-center font-semibold">Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result.studentId} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <Badge className={getRankBadgeColor(result.rank, result.totalStudents)}>
                              #{result.rank}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 font-medium">
                            {result.studentName}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Badge variant="outline">Class {result.classLevel}</Badge>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            {result.totalExams} exams
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
                            <Badge className={getGradeColor(result.finalScore)}>
                              {result.finalScore}%
                            </Badge>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            {(() => {
                              const gradeInfo = getGradeInfo(result.finalScore);
                              return (
                                <Badge 
                                  className={`${
                                    gradeInfo.letterGrade === 'A+' ? 'bg-green-600 text-white' :
                                    gradeInfo.letterGrade === 'A' ? 'bg-green-500 text-white' :
                                    gradeInfo.letterGrade === 'A-' ? 'bg-blue-600 text-white' :
                                    gradeInfo.letterGrade === 'B' ? 'bg-blue-500 text-white' :
                                    gradeInfo.letterGrade === 'C' ? 'bg-yellow-600 text-white' :
                                    gradeInfo.letterGrade === 'D' ? 'bg-orange-600 text-white' :
                                    'bg-red-600 text-white'
                                  }`}
                                >
                                  {gradeInfo.letterGrade}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            {(() => {
                              const gradeInfo = getGradeInfo(result.finalScore);
                              return (
                                <div className="font-semibold text-lg">
                                  {gradeInfo.gpa.toFixed(2)}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadStudentReportCard(result)}
                              className="text-xs text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No monthly results available for this period.</p>
                <p className="text-sm mt-2">Results will appear automatically when exam marks are entered.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
