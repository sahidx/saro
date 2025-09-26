/**
 * Monthly Top Performers Component for Homepage
 * Displays top 5 students from each class for public recognition
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, Medal, Award, Crown, Star, 
  Calendar, TrendingUp, Users, Loader2 
} from 'lucide-react';

interface TopPerformer {
  studentId: string;
  year: number;
  month: number;
  classLevel: string;
  rank: number;
  finalScore: number;
  studentName: string;
  studentPhoto: string | null;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyTopPerformers() {
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Get current date for filtering
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchTopPerformers();
  }, [selectedYear, selectedMonth]);

  // Reset month selection when year changes to ensure valid combinations
  useEffect(() => {
    if (selectedYear === currentYear && selectedMonth < currentMonth) {
      // If current year is selected and month is in the past, reset to current month
      setSelectedMonth(currentMonth);
    } else if (selectedYear > currentYear && selectedMonth < 1) {
      // If future year is selected, default to January
      setSelectedMonth(1);
    }
  }, [selectedYear, currentYear, currentMonth, selectedMonth]);

  const fetchTopPerformers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/top-performers/${selectedYear}/${selectedMonth}`);
      const data = await response.json();

      if (data.success) {
        setTopPerformers(data.topPerformers || []);
      } else {
        setTopPerformers([]);
        setError('No top performers data available for this period');
      }
    } catch (error) {
      console.error('Error fetching top performers:', error);
      setError('Failed to load top performers data');
      setTopPerformers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-600" />;
      case 2:
        return <Trophy className="h-5 w-5 text-slate-500" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      case 4:
        return <Award className="h-4 w-4 text-blue-600" />;
      case 5:
        return <Star className="h-4 w-4 text-blue-900" />;
      default:
        return <Star className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-lg shadow-slate-500/30';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30';
      case 4:
        return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30';
      case 5:
        return 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg shadow-blue-700/30';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 90) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (score >= 85) return 'text-indigo-700 bg-indigo-50 border-indigo-300';
    if (score >= 80) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-orange-700 bg-orange-50 border-orange-300';
  };

  // Group performers by class
  const performersByClass = topPerformers.reduce((acc, performer) => {
    if (!acc[performer.classLevel]) {
      acc[performer.classLevel] = [];
    }
    acc[performer.classLevel].push(performer);
    return acc;
  }, {} as Record<string, TopPerformer[]>);

  // Sort classes numerically
  const sortedClasses = Object.keys(performersByClass).sort((a, b) => parseInt(a) - parseInt(b));

  // Generate years: current year + next 5 years (for future planning)
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Get available months based on selected year
  const getAvailableMonths = () => {
    if (selectedYear === currentYear) {
      // For current year, only show current month and future months
      return months.slice(currentMonth - 1);
    } else if (selectedYear > currentYear) {
      // For future years, show all months
      return months;
    } else {
      // For past years, show no months (shouldn't happen with new logic)
      return [];
    }
  };

  const availableMonths = getAvailableMonths();

  return (
    <div className="container mx-auto px-4 py-16 space-y-12">
      {/* Light Classic Header */}
      <div className="text-center space-y-6">
        {/* Achievement Badge */}
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-100 to-blue-100 border-2 border-blue-300 rounded-full px-8 py-3 shadow-md">
          <Trophy className="h-6 w-6 text-yellow-600" />
          <span className="text-blue-800 font-bold text-lg">Hall of Excellence</span>
        </div>
        
        {/* Main Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-blue-800 tracking-tight">
            Monthly Champions
          </h1>
          <div className="w-40 h-2 bg-gradient-to-r from-blue-500 to-yellow-500 mx-auto rounded-full shadow-sm"></div>
        </div>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium">
          Recognizing academic excellence, dedication, and outstanding performance among our students
        </p>
      </div>

      {/* Light Classic Date Selection */}
      <div className="max-w-lg mx-auto">
        <Card className="border-2 border-blue-200 shadow-lg bg-white">
          <CardContent className="pt-8 pb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-blue-800">Select Period</span>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-40 h-12 border-2 border-blue-300 focus:border-blue-500 bg-blue-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month, index) => {
                      const monthIndex = selectedYear === currentYear 
                        ? currentMonth - 1 + index 
                        : index;
                      return (
                        <SelectItem key={monthIndex + 1} value={(monthIndex + 1).toString()}>
                          {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => {
                    const newYear = parseInt(value);
                    setSelectedYear(newYear);
                    
                    // Auto-adjust month based on new year
                    if (newYear === currentYear && selectedMonth < currentMonth) {
                      setSelectedMonth(currentMonth);
                    } else if (newYear > currentYear && selectedMonth < 1) {
                      setSelectedMonth(1);
                    }
                  }}
                >
                  <SelectTrigger className="w-28 h-12 border-2 border-blue-300 focus:border-blue-500 bg-blue-50">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">Loading champions...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500 opacity-50" />
            <p className="text-yellow-800 font-medium">{error}</p>
            <p className="text-yellow-600 text-sm mt-2">
              Monthly results will appear here once generated by teachers.
            </p>
          </div>
        </div>
      )}

      {/* Top Performers by Class */}
      {!isLoading && !error && sortedClasses.length > 0 && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {months[selectedMonth - 1]} {selectedYear} - Top Performers
            </h2>
            <div className="flex items-center justify-center space-x-2 mt-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{topPerformers.length} exceptional students recognized</span>
            </div>
          </div>

          {sortedClasses.map((classLevel) => {
            const classPerformers = performersByClass[classLevel].sort((a, b) => a.rank - b.rank);
            
            return (
              <Card key={classLevel} className="border-2 border-blue-200 shadow-lg overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-yellow-100 border-b border-blue-200">
                  <CardTitle className="flex items-center justify-center space-x-3 text-2xl">
                    <Badge 
                      variant="outline" 
                      className="px-6 py-3 text-xl font-bold border-2 border-blue-400 text-blue-800 bg-white shadow-sm"
                    >
                      Class {classLevel}
                    </Badge>
                    <span className="text-gray-700 font-semibold">({classPerformers.length} champions)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {classPerformers.map((performer) => (
                      <Card 
                        key={performer.studentId} 
                        className={`border-3 hover:shadow-xl hover:scale-105 transition-all duration-300 bg-white ${
                          performer.rank === 1 ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' :
                          performer.rank === 2 ? 'border-gray-400 shadow-lg shadow-gray-400/30' :
                          performer.rank === 3 ? 'border-amber-400 shadow-lg shadow-amber-400/30' :
                          'border-blue-300 shadow-lg shadow-blue-300/30'
                        }`}
                      >
                        <CardContent className="pt-6 pb-4">
                          <div className="text-center space-y-4">
                            {/* Rank Badge */}
                            <div className="flex justify-center">
                              <Badge className={`${getRankColor(performer.rank)} px-5 py-2.5 text-xl font-bold rounded-xl`}>
                                <div className="flex items-center space-x-2">
                                  {getRankIcon(performer.rank)}
                                  <span>#{performer.rank}</span>
                                </div>
                              </Badge>
                            </div>

                            {/* Student Photo Placeholder */}
                            <div className="flex justify-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                                {performer.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            </div>

                            {/* Student Name */}
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg leading-tight">
                                {performer.studentName}
                              </h4>
                            </div>

                            {/* Final Score */}
                            <div>
                              <Badge 
                                className={`px-4 py-2 text-lg font-bold border-2 ${getScoreColor(performer.finalScore)} rounded-lg`}
                                variant="outline"
                              >
                                {performer.finalScore} pts
                              </Badge>
                            </div>

                            {/* Performance Label */}
                            <div className="text-sm font-bold text-gray-700">
                              {performer.finalScore >= 95 ? '🏆 Outstanding' :
                               performer.finalScore >= 90 ? '⭐ Excellent' :
                               performer.finalScore >= 85 ? '🎯 Great' :
                               performer.finalScore >= 80 ? '👏 Good' : '💪 Keep Going'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Professional Achievement Footer */}
          <div className="text-center">
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-yellow-50 shadow-lg">
              <CardContent className="pt-8 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3 text-blue-800 mb-3">
                    <TrendingUp className="h-6 w-6" />
                    <span className="font-bold text-lg">Evaluation Criteria</span>
                  </div>
                  <div className="text-blue-700 font-bold text-base">
                    Formula: 70% Exams + 20% Attendance + 10% Bonus Activities
                  </div>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-blue-600 to-yellow-500 mx-auto rounded-full"></div>
                  <p className="text-gray-700 font-semibold">
                    Congratulations to all our achievers! Your dedication to excellence sets an inspiring example for others. �
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && sortedClasses.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Yet</h3>
            <p className="text-gray-500 text-sm">
              Top performers for {months[selectedMonth - 1]} {selectedYear} will be displayed 
              here once monthly results are generated.
              {selectedYear === currentYear && selectedMonth === currentMonth && (
                <span className="block mt-2 font-medium text-blue-600">
                  🔄 This is the current month - results will appear as evaluations are completed.
                </span>
              )}
              {selectedYear > currentYear && (
                <span className="block mt-2 font-medium text-green-600">
                  📅 Future month selected - results will appear when this period arrives.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
