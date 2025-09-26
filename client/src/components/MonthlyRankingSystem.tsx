import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { 
  Users, 
  Trophy, 
  FileText, 
  Download, 
  RefreshCw, 
  Trash2,
  Calendar,
  GraduationCap,
  Award,
  BarChart3,
  Database
} from 'lucide-react';

interface StudentRanking {
  rank: number;
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  batchId: string;
  totalMarks: number;
  totalPossible: number;
  percentage: number;
  gpa: number;
  grade: string;
  examCount: number;
}

interface MonthlyRankingData {
  month: number;
  year: number;
  monthName: string;
  batchId: string;
  batchName: string;
  examCount: number;
  studentCount: number;
  rankings: StudentRanking[];
  stats: {
    highestGPA: number;
    lowestGPA: number;
    averageGPA: number;
    totalStudentsWithResults: number;
  };
}

interface Batch {
  id: string;
  name: string;
  className: string;
  subject: string;
}

export default function MonthlyRankingSystem() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch batches for filter
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['/api/rankings/batches'],
  });

  // Fetch monthly ranking data
  const { data: rankingData, isLoading, refetch } = useQuery<MonthlyRankingData>({
    queryKey: [`/api/rankings/monthly/${selectedYear}/${selectedMonth}`, selectedBatch],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/rankings/monthly/${selectedYear}/${selectedMonth}?batchId=${selectedBatch}`);
      if (!response.ok) throw new Error('Failed to fetch ranking data');
      return response.json();
    },
  });

  // Demo data generation mutation
  const generateDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/demo/generate');
      if (!response.ok) throw new Error('Failed to generate demo data');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: '✅ ডেমো ডেটা তৈরি সম্পন্ন',
          description: `${result.data.students} জন ছাত্র, ${result.data.exams}টি পরীক্ষা, ${result.data.attendance}টি উপস্থিতি রেকর্ড তৈরি হয়েছে।`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/rankings/monthly'] });
        refetch();
      } else {
        toast({
          title: '❌ ত্রুটি',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Demo data cleanup mutation
  const cleanupDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/demo/cleanup');
      if (!response.ok) throw new Error('Failed to cleanup demo data');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: '✅ ডেমো ডেটা মুছে ফেলা হয়েছে',
          description: result.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/rankings/monthly'] });
        refetch();
      } else {
        toast({
          title: '❌ ত্রুটি',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-500 text-white';
      case 'A': return 'bg-green-400 text-white';
      case 'A-': return 'bg-blue-500 text-white';
      case 'B+': return 'bg-blue-400 text-white';
      case 'B': return 'bg-yellow-500 text-white';
      case 'B-': return 'bg-yellow-400 text-black';
      case 'C+': return 'bg-orange-500 text-white';
      case 'C': return 'bg-orange-400 text-white';
      case 'D': return 'bg-red-500 text-white';
      case 'F': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('ranking-print-area');
    if (printContent) {
      const newWindow = window.open('', '_blank');
      newWindow?.document.write(`
        <html>
          <head>
            <title>মাসিক র‍্যাঙ্কিং - ${rankingData?.monthName} ${rankingData?.year}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              .stats { margin: 20px 0; }
              .grade-A+ { background-color: #22c55e; color: white; }
              .grade-A { background-color: #16a34a; color: white; }
              .grade-A- { background-color: #3b82f6; color: white; }
              .grade-B+ { background-color: #60a5fa; color: white; }
              .grade-B { background-color: #eab308; color: white; }
              .grade-B- { background-color: #facc15; color: black; }
              .grade-C+ { background-color: #f97316; color: white; }
              .grade-C { background-color: #fb923c; color: white; }
              .grade-D { background-color: #ef4444; color: white; }
              .grade-F { background-color: #dc2626; color: white; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      newWindow?.document.close();
      newWindow?.print();
    }
  };

  const months = [
    { value: 1, label: 'জানুয়ারি' },
    { value: 2, label: 'ফেব্রুয়ারি' },
    { value: 3, label: 'মার্চ' },
    { value: 4, label: 'এপ্রিল' },
    { value: 5, label: 'মে' },
    { value: 6, label: 'জুন' },
    { value: 7, label: 'জুলাই' },
    { value: 8, label: 'আগস্ট' },
    { value: 9, label: 'সেপ্টেম্বর' },
    { value: 10, label: 'অক্টোবর' },
    { value: 11, label: 'নভেম্বর' },
    { value: 12, label: 'ডিসেম্বর' },
  ];

  const years = [2024, 2025, 2026].map(year => ({ value: year, label: year.toString() }));

  return (
    <div className="space-y-6">
      {/* Demo Data Management */}
      <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Database className="w-5 h-5" />
            ডেমো ডেটা ম্যানেজমেন্ট
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => generateDemoMutation.mutate()}
              disabled={generateDemoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              {generateDemoMutation.isPending ? 'তৈরি করা হচ্ছে...' : 'ডেমো ডেটা তৈরি করুন'}
            </Button>
            <Button
              onClick={() => cleanupDemoMutation.mutate()}
              disabled={cleanupDemoMutation.isPending}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {cleanupDemoMutation.isPending ? 'মুছে ফেলা হচ্ছে...' : 'ডেমো ডেটা মুছুন'}
            </Button>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            ১০ জন ছাত্র, ১০টি পরীক্ষা এবং র‍্যান্ডম উপস্থিতি রেকর্ড তৈরি করা হবে পরীক্ষার জন্য।
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            মাসিক র‍্যাঙ্কিং সিস্টেম
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">মাস</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">বছর</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year.value} value={year.value.toString()}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">ব্যাচ</label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ব্যাচ</SelectItem>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                onClick={() => refetch()} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                আপডেট
              </Button>
              <Button 
                onClick={handlePrint}
                disabled={!rankingData || rankingData.rankings.length === 0}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                প্রিন্ট
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {rankingData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">মোট পরীক্ষা</p>
                  <p className="text-2xl font-bold">{rankingData.examCount}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">মোট ছাত্র</p>
                  <p className="text-2xl font-bold">{rankingData.studentCount}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">সর্বোচ্চ GPA</p>
                  <p className="text-2xl font-bold">{rankingData.stats.highestGPA.toFixed(2)}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">গড় GPA</p>
                  <p className="text-2xl font-bold">{rankingData.stats.averageGPA.toFixed(2)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ranking Table */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">র‍্যাঙ্কিং লোড হচ্ছে...</p>
          </CardContent>
        </Card>
      ) : rankingData && rankingData.rankings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                {rankingData.monthName} {rankingData.year} - {rankingData.batchName}
              </div>
              <Badge variant="outline">
                {rankingData.studentCount} জন ছাত্র
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="ranking-print-area">
              <div className="header">
                <h1>মাসিক র‍্যাঙ্কিং রিপোর্ট</h1>
                <h2>{rankingData.monthName} {rankingData.year} - {rankingData.batchName}</h2>
                <div className="stats">
                  <p>মোট পরীক্ষা: {rankingData.examCount} | মোট ছাত্র: {rankingData.studentCount} | গড় GPA: {rankingData.stats.averageGPA.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium">র‍্যাঙ্ক</th>
                      <th className="px-4 py-3 text-left font-medium">ছাত্র নাম</th>
                      <th className="px-4 py-3 text-left font-medium">আইডি</th>
                      <th className="px-4 py-3 text-center font-medium">পরীক্ষা সংখ্যা</th>
                      <th className="px-4 py-3 text-center font-medium">মোট নম্বর</th>
                      <th className="px-4 py-3 text-center font-medium">শতকরা</th>
                      <th className="px-4 py-3 text-center font-medium">GPA</th>
                      <th className="px-4 py-3 text-center font-medium">গ্রেড</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingData.rankings.map((student, index) => (
                      <tr key={student.studentId} className={index < 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                            {index === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                            {index === 2 && <Trophy className="w-5 h-5 text-orange-600" />}
                            <span className="font-bold text-lg">{student.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{student.studentName}</td>
                        <td className="px-4 py-3 text-gray-600">{student.studentIdNumber}</td>
                        <td className="px-4 py-3 text-center">{student.examCount}</td>
                        <td className="px-4 py-3 text-center font-medium">
                          {student.totalMarks}/{student.totalPossible}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{student.percentage}%</td>
                        <td className="px-4 py-3 text-center font-bold text-lg">{student.gpa.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`${getGradeColor(student.grade)} grade-${student.grade}`}>
                            {student.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">কোন ডেটা পাওয়া যায়নি</h3>
            <p className="text-gray-600 mb-4">
              নির্বাচিত মাস এবং ব্যাচের জন্য কোন পরীক্ষার ফলাফল পাওয়া যায়নি।
            </p>
            <p className="text-sm text-blue-600">
              ডেমো ডেটা তৈরি করুন অথবা অন্য মাস/ব্যাচ নির্বাচন করুন।
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}