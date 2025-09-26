/**
 * Automated Monthly Results Service
 * Automatically calculates monthly results from regular exams without teacher intervention
 * Runs at month end or can be triggered by system process
 */

import { db } from './db';
import { 
  monthlyResults, 
  monthlyExamRecords, 
  topPerformers, 
  monthlyCalendarSummary,
  academicCalendar,
  exams,
  examSubmissions,
  attendance,
  users,
  batches
} from '@shared/schema';
import { eq, and, sql, desc, asc, gte, lte, inArray } from 'drizzle-orm';

export interface AutomatedMonthlyResultData {
  studentId: string;
  studentName: string;
  batchId: string;
  classLevel: string;
  examAverage: number;
  attendancePercentage: number;    // Only 'present' days for attendance (20%)
  bonusPercentage: number;         // 'present' + 'excused' days for bonus (10%)
  presentDays: number;
  excusedDays: number;
  absentDays: number;
  finalScore: number;
  rank: number;
  totalStudents: number;
  workingDays: number;
  totalExams: number;
  processedDate: Date;
}

export interface ProcessingStats {
  totalBatches: number;
  totalStudents: number;
  successfulResults: number;
  failedResults: number;
  processingTime: number;
}

export class AutomatedMonthlyResultsService {
  
  /**
   * Process all batches automatically for a given month
   * This should run at the end of each month automatically
   */
  async processMonthlyResults(year: number, month: number): Promise<ProcessingStats> {
    const startTime = Date.now();
    console.log(`🚀 Starting automated monthly result processing for ${month}/${year}`);
    
    const stats: ProcessingStats = {
      totalBatches: 0,
      totalStudents: 0,
      successfulResults: 0,
      failedResults: 0,
      processingTime: 0
    };
    
    try {
      // 1. Update monthly calendar summary first
      await this.updateMonthlyCalendarSummary(year, month);
      
      // 2. Get all active batches
      const activeBatches = await this.getActiveBatches();
      stats.totalBatches = activeBatches.length;
      
      console.log(`📊 Processing ${activeBatches.length} active batches`);
      
      // 3. Process each batch
      for (const batch of activeBatches) {
        try {
          const batchResults = await this.processBatchMonthlyResults(batch.id, year, month);
          stats.totalStudents += batchResults.length;
          stats.successfulResults += batchResults.length;
          
          console.log(`✅ Batch ${batch.name}: ${batchResults.length} students processed`);
        } catch (error) {
          console.error(`❌ Failed to process batch ${batch.name}:`, error);
          stats.failedResults++;
        }
      }
      
      // 4. Update top performers cache
      await this.updateTopPerformersCache(year, month);
      
      stats.processingTime = Date.now() - startTime;
      
      console.log(`🎉 Monthly result processing completed:`, stats);
      return stats;
      
    } catch (error) {
      console.error('💥 Fatal error in monthly result processing:', error);
      stats.processingTime = Date.now() - startTime;
      throw error;
    }
  }
  
  /**
   * Process monthly results for a specific batch
   */
  private async processBatchMonthlyResults(
    batchId: string, 
    year: number, 
    month: number
  ): Promise<AutomatedMonthlyResultData[]> {
    
    // 1. Get working days for the month
    const calendarSummary = await this.getMonthlyCalendarSummary(year, month);
    const workingDays = calendarSummary?.workingDays || 20; // Default fallback
    
    // 2. Get all students in the batch
    const students = await this.getBatchStudents(batchId);
    
    if (students.length === 0) {
      console.log(`⚠️ No students found in batch ${batchId}`);
      return [];
    }
    
    const results: AutomatedMonthlyResultData[] = [];
    
    // 3. Calculate results for each student
    for (const student of students) {
      try {
        const result = await this.calculateStudentMonthlyResult(
          student.id, 
          batchId, 
          year, 
          month, 
          workingDays,
          student.firstName + ' ' + student.lastName,
          student.classLevel || '6'
        );
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to calculate result for student ${student.id}:`, error);
      }
    }
    
    // 4. Calculate rankings
    results.sort((a, b) => b.finalScore - a.finalScore);
    results.forEach((result, index) => {
      result.rank = index + 1;
      result.totalStudents = results.length;
    });
    
    // 5. Save results to database
    await this.saveAutomatedMonthlyResults(results, year, month, batchId);
    
    return results;
  }
  
  /**
   * Calculate individual student result automatically
   */
  private async calculateStudentMonthlyResult(
    studentId: string, 
    batchId: string, 
    year: number, 
    month: number, 
    workingDays: number,
    studentName: string,
    classLevel: string
  ): Promise<AutomatedMonthlyResultData> {
    
    // 1. Get all regular exams for this month
    const examData = await this.calculateExamAverageFromRegularExams(studentId, year, month);
    
    // 2. Calculate attendance based on academic calendar
    const attendanceData = await this.calculateCalendarBasedAttendance(studentId, year, month, workingDays);
    
    // 3. Calculate final score using weighted formula with separate attendance and bonus
    const examWeight = 0.70;        // 70% - Exam average
    const attendanceWeight = 0.20;  // 20% - Only 'present' days count
    const bonusWeight = 0.10;       // 10% - 'present' + 'excused' days count
    
    const finalScore = Math.round(
      (examData.average * examWeight) + 
      (attendanceData.attendancePercentage * attendanceWeight) + 
      (attendanceData.bonusPercentage * bonusWeight)
    );
    
    return {
      studentId,
      studentName,
      batchId,
      classLevel,
      examAverage: examData.average,
      attendancePercentage: attendanceData.attendancePercentage,  // Only 'present' for attendance
      bonusPercentage: attendanceData.bonusPercentage,            // 'present' + 'excused' for bonus
      presentDays: attendanceData.presentDays,
      excusedDays: attendanceData.excusedDays,
      absentDays: attendanceData.absentDays,
      finalScore,
      rank: 0, // Will be set after sorting
      totalStudents: 0, // Will be set after counting
      presentDays: attendanceData.presentDays,
      workingDays,
      totalExams: examData.totalExams,
      processedDate: new Date()
    };
  }
  
  /**
   * Calculate exam average from regular exams only
   */
  private async calculateExamAverageFromRegularExams(studentId: string, year: number, month: number) {
    try {
      // Get first and last day of the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Find all REGULAR exams in this month (examMode = 'regular' or 'offline')
      const regularExamResults = await db
        .select({
          examId: exams.id,
          examTitle: exams.title,
          totalMarks: exams.totalMarks,
          marksObtained: examSubmissions.manualMarks, // Teacher manually entered marks
          percentage: examSubmissions.percentage
        })
        .from(exams)
        .leftJoin(examSubmissions, and(
          eq(examSubmissions.examId, exams.id),
          eq(examSubmissions.studentId, studentId)
        ))
        .where(and(
          eq(exams.examMode, 'regular'), // Only regular (offline) exams
          gte(exams.createdAt, startDate),
          lte(exams.createdAt, endDate),
          eq(exams.isActive, true)
        ));
      
      if (regularExamResults.length === 0) {
        console.log(`📝 No regular exams found for student ${studentId} in ${month}/${year}`);
        return { average: 0, totalExams: 0 };
      }
      
      let totalPercentage = 0;
      let validExams = 0;
      
      for (const result of regularExamResults) {
        // Use either stored percentage or calculate from marks
        let examPercentage = 0;
        
        if (result.percentage !== null) {
          examPercentage = result.percentage;
        } else if (result.marksObtained !== null && result.totalMarks && result.totalMarks > 0) {
          examPercentage = (result.marksObtained / result.totalMarks) * 100;
        } else {
          // Student didn't take this exam or marks not entered yet
          continue;
        }
        
        totalPercentage += examPercentage;
        validExams++;
        
        console.log(`📊 Exam: ${result.examTitle}, Marks: ${result.marksObtained}/${result.totalMarks}, Percentage: ${examPercentage}%`);
      }
      
      const average = validExams > 0 ? Math.round(totalPercentage / validExams) : 0;
      
      console.log(`🎯 Student ${studentId}: ${validExams} regular exams, ${average}% average`);
      return { average, totalExams: validExams };
      
    } catch (error) {
      console.error('Error calculating regular exam average:', error);
      return { average: 0, totalExams: 0 };
    }
  }
  
  /**
   * Calculate attendance based on academic calendar working days
   */
  /**
   * Calculate attendance with separate scores for attendance (20%) and bonus (10%)
   * Present = gets both attendance and bonus credit
   * Excused = gets bonus credit only (no attendance credit)
   * Absent = gets no credit
   */
  private async calculateCalendarBasedAttendance(studentId: string, year: number, month: number, workingDays: number) {
    try {
      // Get first and last day of the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Get attendance records for working days only
      const attendanceRecords = await db
        .select({
          date: attendance.date,
          attendanceStatus: attendance.attendanceStatus
        })
        .from(attendance)
        .leftJoin(academicCalendar, eq(attendance.calendarId, academicCalendar.id))
        .where(and(
          eq(attendance.studentId, studentId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
          // Only count attendance on working days
          eq(academicCalendar.isWorkingDay, true)
        ));
      
      let presentDays = 0;      // Only 'present' counts for attendance (20%)
      let excusedDays = 0;      // 'excused' counts for bonus only
      let absentDays = 0;       // 'absent' gets no credit
      let bonusDays = 0;        // 'present' + 'excused' for bonus (10%)
      
      for (const record of attendanceRecords) {
        switch (record.attendanceStatus) {
          case 'present':
            presentDays++;
            bonusDays++; // Present gets both attendance and bonus credit
            break;
          case 'excused':
            excusedDays++;
            bonusDays++; // Excused gets bonus credit only
            break;
          case 'absent':
          default:
            absentDays++;
            // Absent gets no credit
            break;
        }
      }
      
      // Calculate attendance percentage (only 'present' counts for attendance score)
      const totalPossibleDays = workingDays;
      const attendancePercentage = totalPossibleDays > 0 ? Math.round((presentDays / totalPossibleDays) * 100) : 0;
      
      // Calculate bonus percentage (present + excused count for bonus)
      const bonusPercentage = totalPossibleDays > 0 ? Math.round((bonusDays / totalPossibleDays) * 100) : 0;
      
      console.log(`📅 Student ${studentId}: Present:${presentDays}, Excused:${excusedDays}, Absent:${absentDays}/${workingDays} (Attendance:${attendancePercentage}%, Bonus:${bonusPercentage}%)`);
      
      return {
        presentDays,
        excusedDays,
        absentDays,
        attendancePercentage,  // Only 'present' for attendance (20%)
        bonusPercentage,       // 'present' + 'excused' for bonus (10%)
        totalWorkingDays: totalPossibleDays
      };
      
    } catch (error) {
      console.error('Error calculating calendar-based attendance:', error);
      return {
        presentDays: 0,
        excusedDays: 0,
        absentDays: 0,
        attendancePercentage: 0,
        bonusPercentage: 0,
        totalWorkingDays: workingDays
      };
    }
  }
  
  /**
   * Update monthly calendar summary with working days count
   */
  private async updateMonthlyCalendarSummary(year: number, month: number) {
    try {
      // Get all calendar entries for this month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const calendarEntries = await db
        .select({
          isWorkingDay: academicCalendar.isWorkingDay,
          dayType: academicCalendar.dayType
        })
        .from(academicCalendar)
        .where(and(
          gte(academicCalendar.date, startDate),
          lte(academicCalendar.date, endDate)
        ));
      
      const totalDays = endDate.getDate();
      const workingDays = calendarEntries.filter((entry: any) => entry.isWorkingDay).length;
      const holidays = calendarEntries.filter((entry: any) => !entry.isWorkingDay).length;
      
      // If no calendar entries exist, create default (all working days)
      if (calendarEntries.length === 0) {
        console.log(`📅 No calendar entries found for ${month}/${year}, using default working days`);
        await this.createDefaultCalendarEntries(year, month);
      }
      
      // Upsert monthly calendar summary
      await db.delete(monthlyCalendarSummary)
        .where(and(
          eq(monthlyCalendarSummary.year, year),
          eq(monthlyCalendarSummary.month, month)
        ));
      
      await db.insert(monthlyCalendarSummary).values({
        year,
        month,
        totalDays,
        workingDays: calendarEntries.length > 0 ? workingDays : 20, // Default 20 working days
        holidays,
        lastUpdated: new Date()
      });
      
      console.log(`📊 Monthly calendar summary updated: ${workingDays}/${totalDays} working days`);
      
    } catch (error) {
      console.error('Error updating monthly calendar summary:', error);
    }
  }
  
  /**
   * Create default calendar entries for a month (all working days except weekends)
   */
  private async createDefaultCalendarEntries(year: number, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarEntries = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Default: Monday-Thursday are working days, Friday-Sunday are holidays
      const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 4;
      
      calendarEntries.push({
        date,
        year,
        month,
        dayOfWeek,
        isWorkingDay,
        dayType: isWorkingDay ? 'regular' : 'weekend',
        notes: isWorkingDay ? null : 'Weekend'
      });
    }
    
    await db.insert(academicCalendar).values(calendarEntries);
    console.log(`📅 Created default calendar for ${month}/${year}: ${calendarEntries.filter(e => e.isWorkingDay).length} working days`);
  }
  
  /**
   * Get monthly calendar summary
   */
  private async getMonthlyCalendarSummary(year: number, month: number) {
    try {
      const summary = await db
        .select()
        .from(monthlyCalendarSummary)
        .where(and(
          eq(monthlyCalendarSummary.year, year),
          eq(monthlyCalendarSummary.month, month)
        ))
        .limit(1);
      
      return summary[0] || null;
    } catch (error) {
      console.error('Error getting monthly calendar summary:', error);
      return null;
    }
  }
  
  /**
   * Get all active batches
   */
  private async getActiveBatches() {
    try {
      return await db
        .select({
          id: batches.id,
          name: batches.name
        })
        .from(batches);
    } catch (error) {
      console.error('Error getting active batches:', error);
      return [];
    }
  }
  
  /**
   * Get students in a batch
   */
  private async getBatchStudents(batchId: string) {
    try {
      return await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          classLevel: users.classLevel
        })
        .from(users)
        .where(and(
          eq(users.batchId, batchId),
          eq(users.role, 'student'),
          eq(users.isActive, true)
        ));
    } catch (error) {
      console.error('Error getting batch students:', error);
      return [];
    }
  }
  
  /**
   * Save automated monthly results
   */
  private async saveAutomatedMonthlyResults(
    results: AutomatedMonthlyResultData[], 
    year: number, 
    month: number,
    batchId: string
  ) {
    if (results.length === 0) return;
    
    try {
      // Delete existing results for this batch and month
      await db.delete(monthlyResults)
        .where(and(
          eq(monthlyResults.batchId, batchId),
          eq(monthlyResults.year, year),
          eq(monthlyResults.month, month)
        ));
      
      // Insert new results
      const insertData = results.map(result => ({
        studentId: result.studentId,
        batchId: result.batchId,
        year,
        month,
        classLevel: result.classLevel,
        examAverage: result.examAverage,
        totalExams: result.totalExams,
        presentDays: result.presentDays,
        absentDays: result.absentDays,
        excusedDays: result.excusedDays,
        workingDays: result.workingDays,
        attendancePercentage: result.attendancePercentage,
        bonusMarks: Math.round(result.bonusPercentage), // Convert bonus percentage to marks
        finalScore: result.finalScore,
        classRank: result.rank,
        totalStudents: result.totalStudents
      }));
      
      await db.insert(monthlyResults).values(insertData);
      
      console.log(`💾 Saved ${results.length} monthly results for batch ${batchId}`);
      
    } catch (error) {
      console.error('Error saving automated monthly results:', error);
      throw error;
    }
  }
  
  /**
   * Update top performers cache for homepage
   */
  private async updateTopPerformersCache(year: number, month: number) {
    try {
      // Get all monthly results for this month
      const allResults = await db
        .select({
          studentId: monthlyResults.studentId,
          classLevel: monthlyResults.classLevel,
          finalScore: monthlyResults.finalScore,
          classRank: monthlyResults.classRank,
          studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`
        })
        .from(monthlyResults)
        .leftJoin(users, eq(users.id, monthlyResults.studentId))
        .where(and(
          eq(monthlyResults.year, year),
          eq(monthlyResults.month, month)
        ))
        .orderBy(asc(monthlyResults.classLevel), asc(monthlyResults.classRank));
      
      // Delete existing top performers for this month
      await db.delete(topPerformers)
        .where(and(
          eq(topPerformers.year, year),
          eq(topPerformers.month, month)
        ));
      
      // Group by class and get top 5 from each class
      const classes = ['6', '7', '8', '9', '10'];
      
      for (const classLevel of classes) {
        const classResults = allResults
          .filter((r: any) => r.classLevel === classLevel)
          .slice(0, 5); // Top 5 only
        
        if (classResults.length > 0) {
          const topPerformersData = classResults.map((result: any, index: number) => ({
            studentId: result.studentId,
            year,
            month,
            classLevel,
            rank: index + 1,
            finalScore: result.finalScore,
            studentName: result.studentName || 'Unknown',
            studentPhoto: null
          }));
          
          await db.insert(topPerformers).values(topPerformersData);
        }
      }
      
      console.log(`🏆 Updated top performers cache for ${month}/${year}`);
      
    } catch (error) {
      console.error('Error updating top performers cache:', error);
    }
  }
  
  /**
   * Check if monthly results already processed for a month
   */
  async isMonthAlreadyProcessed(year: number, month: number): Promise<boolean> {
    try {
      const existingResults = await db
        .select({ count: sql<number>`count(*)` })
        .from(monthlyResults)
        .where(and(
          eq(monthlyResults.year, year),
          eq(monthlyResults.month, month)
        ));
      
      return (existingResults[0]?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking if month processed:', error);
      return false;
    }
  }
  
  /**
   * Get processing statistics for a month
   */
  async getProcessingStats(year: number, month: number) {
    try {
      const results = await db
        .select({
          totalResults: sql<number>`count(*)`,
          totalBatches: sql<number>`count(distinct ${monthlyResults.batchId})`,
          averageScore: sql<number>`avg(${monthlyResults.finalScore})`,
          highestScore: sql<number>`max(${monthlyResults.finalScore})`,
          lowestScore: sql<number>`min(${monthlyResults.finalScore})`
        })
        .from(monthlyResults)
        .where(and(
          eq(monthlyResults.year, year),
          eq(monthlyResults.month, month)
        ));
      
      return results[0] || null;
    } catch (error) {
      console.error('Error getting processing stats:', error);
      return null;
    }
  }

  /**
   * Get monthly calendar with working days
   */
  async getMonthlyCalendar(year: number, month: number) {
    try {
      // Get summary record
      const summary = await db
        .select()
        .from(monthlyCalendarSummary)
        .where(and(
          eq(monthlyCalendarSummary.year, year),
          eq(monthlyCalendarSummary.month, month)
        ))
        .limit(1);

      // Get daily records
      const dailyRecords = await db
        .select()
        .from(academicCalendar)
        .where(and(
          eq(academicCalendar.year, year),
          eq(academicCalendar.month, month)
        ))
        .orderBy(asc(academicCalendar.date));

      return {
        summary: summary[0] || null,
        dailyRecords,
        year,
        month
      };
    } catch (error) {
      console.error('Error fetching monthly calendar:', error);
      throw error;
    }
  }

  /**
   * Update monthly calendar with working days
   */
  async updateMonthlyCalendar(year: number, month: number, workingDays: { day: number; isWorking: boolean; dayType: string; note?: string }[]) {
    try {
      console.log(`📅 Updating calendar for ${month}/${year} with ${workingDays.length} day records`);

      // Delete existing daily records for this month
      await db.delete(academicCalendar)
        .where(and(
          eq(academicCalendar.year, year),
          eq(academicCalendar.month, month)
        ));

      // Insert new daily records
      if (workingDays.length > 0) {
        const dailyData = workingDays.map(day => ({
          date: new Date(year, month - 1, day.day), // Create proper date
          year,
          month,
          dayOfWeek: new Date(year, month - 1, day.day).getDay(),
          isWorkingDay: day.isWorking,
          dayType: day.dayType,
          notes: day.note || null
        }));

        await db.insert(academicCalendar).values(dailyData);
      }

      // Calculate totals
      const totalWorkingDays = workingDays.filter(d => d.isWorking).length;
      const totalHolidays = workingDays.filter(d => !d.isWorking).length;

      // Update or create summary
      const existingSummary = await db
        .select()
        .from(monthlyCalendarSummary)
        .where(and(
          eq(monthlyCalendarSummary.year, year),
          eq(monthlyCalendarSummary.month, month)
        ))
        .limit(1);

      if (existingSummary.length > 0) {
        await db.update(monthlyCalendarSummary)
          .set({
            totalWorkingDays,
            totalHolidays,
            isFinalized: true,
            updatedAt: new Date()
          })
          .where(and(
            eq(monthlyCalendarSummary.year, year),
            eq(monthlyCalendarSummary.month, month)
          ));
      } else {
        await db.insert(monthlyCalendarSummary).values({
          year,
          month,
          totalWorkingDays,
          totalHolidays,
          isFinalized: true
        });
      }

      return await this.getMonthlyCalendar(year, month);
    } catch (error) {
      console.error('Error updating monthly calendar:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const automatedMonthlyResultsService = new AutomatedMonthlyResultsService();