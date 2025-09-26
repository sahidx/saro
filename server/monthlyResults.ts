/**
 * Monthly Results System
 * Calculates monthly performance for students based on:
 * - Exam Average (70%)
 * - Attendance Score (20%) 
 * - Bonus Marks (10%)
 */

import { db } from './db';
import { 
  monthlyResults, 
  monthlyExamRecords, 
  topPerformers, 
  academicCalendar,
  exams,
  examSubmissions,
  attendance,
  users,
  batches,
  TopPerformer,
  MonthlyResult
} from '@shared/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

export interface MonthlyResultData {
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

export interface MonthlyResultsParams {
  batchId: string;
  year: number;
  month: number;
  teacherId: string;
}

export class MonthlyResultsService {
  
  /**
   * Generate monthly results for a batch
   */
  async generateMonthlyResults(params: MonthlyResultsParams): Promise<MonthlyResultData[]> {
    const { batchId, year, month, teacherId } = params;
    
    try {
      console.log(`🔄 Generating monthly results for batch ${batchId}, ${month}/${year}`);
      
      // 1. Get or create academic calendar entry
      const workingDays = await this.getWorkingDays(year, month);
      
      // 2. Get all students in the batch
      const students = await this.getBatchStudents(batchId);
      
      if (students.length === 0) {
        throw new Error('No students found in this batch');
      }
      
      const results: MonthlyResultData[] = [];
      
      // 3. Calculate results for each student
      for (const student of students) {
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
      }
      
      // 4. Calculate rankings
      results.sort((a, b) => b.finalScore - a.finalScore);
      results.forEach((result, index) => {
        result.rank = index + 1;
        result.totalStudents = results.length;
      });
      
      // 5. Save results to database
      await this.saveMonthlyResults(results, year, month);
      
      // 6. Update top performers cache
      await this.updateTopPerformers(results, year, month);
      
      console.log(`✅ Monthly results generated for ${results.length} students`);
      return results;
      
    } catch (error) {
      console.error('❌ Error generating monthly results:', error);
      throw error;
    }
  }
  
  /**
   * Calculate individual student monthly result
   */
  private async calculateStudentMonthlyResult(
    studentId: string, 
    batchId: string, 
    year: number, 
    month: number, 
    workingDays: number,
    studentName: string,
    classLevel: string
  ): Promise<MonthlyResultData> {
    
    // 1. Calculate exam average
    const examData = await this.calculateExamAverage(studentId, year, month);
    
    // 2. Calculate attendance
    const attendanceData = await this.calculateAttendance(studentId, year, month, workingDays);
    
    // 3. Calculate bonus marks
    const bonusMarks = Math.max(0, 30 - workingDays);
    
    // 4. Calculate final score using weighted formula
    // Final = (70% Exam Average) + (20% Attendance) + (10% Bonus)
    const examWeight = 0.70;
    const attendanceWeight = 0.20;
    const bonusWeight = 0.10;
    
    const finalScore = Math.round(
      (examData.average * examWeight) + 
      (attendanceData.percentage * attendanceWeight) + 
      (bonusMarks * bonusWeight)
    );
    
    return {
      studentId,
      studentName,
      batchId,
      classLevel,
      examAverage: examData.average,
      attendancePercentage: attendanceData.percentage,
      bonusMarks,
      finalScore,
      rank: 0, // Will be set after sorting
      totalStudents: 0, // Will be set after counting
      presentDays: attendanceData.presentDays,
      workingDays,
      totalExams: examData.totalExams
    };
  }
  
  /**
   * Calculate exam average for a student in given month
   */
  private async calculateExamAverage(studentId: string, year: number, month: number) {
    try {
      // Get all exams for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const examResults = await db
        .select({
          examId: exams.id,
          totalMarks: exams.totalMarks,
          marksObtained: examSubmissions.manualMarks
        })
        .from(exams)
        .leftJoin(examSubmissions, and(
          eq(examSubmissions.examId, exams.id),
          eq(examSubmissions.studentId, studentId)
        ))
        .where(and(
          sql`${exams.createdAt} >= ${startDate}`,
          sql`${exams.createdAt} <= ${endDate}`
        ));
      
      if (examResults.length === 0) {
        return { average: 0, totalExams: 0 };
      }
      
      let totalPercentage = 0;
      let validExams = 0;
      
      for (const result of examResults) {
        if (result.marksObtained !== null && result.totalMarks > 0) {
          const percentage = (result.marksObtained / result.totalMarks) * 100;
          totalPercentage += percentage;
          validExams++;
        }
      }
      
      const average = validExams > 0 ? Math.round(totalPercentage / validExams) : 0;
      
      return { average, totalExams: validExams };
      
    } catch (error) {
      console.error('Error calculating exam average:', error);
      return { average: 0, totalExams: 0 };
    }
  }
  
  /**
   * Calculate attendance percentage for a student
   */
  private async calculateAttendance(studentId: string, year: number, month: number, workingDays: number) {
    try {
      // Get attendance records for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const attendanceRecords = await db
        .select({
          isPresent: attendance.isPresent,
        })
        .from(attendance)
        .where(and(
          eq(attendance.studentId, studentId),
          sql`${attendance.date} >= ${startDate}`,
          sql`${attendance.date} <= ${endDate}`
        ));
      
      let presentDays = 0;
      let absentDays = 0;
      
      for (const record of attendanceRecords) {
        if (record.isPresent) {
          presentDays++;
        } else {
          absentDays++;
        }
      }
      
      // Calculate attendance score
      // +1 per present day, excused students get full bonus but no daily marks
      const attendanceScore = presentDays;
      const percentage = workingDays > 0 ? Math.round((attendanceScore / workingDays) * 100) : 0;
      
      return {
        presentDays,
        absentDays,
        excusedDays: 0, // Not tracked in current schema
        percentage: Math.min(100, percentage) // Cap at 100%
      };
      
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return {
        presentDays: 0,
        absentDays: 0,
        excusedDays: 0,
        percentage: 0
      };
    }
  }
  
  /**
   * Get working days for a month
   */
  private async getWorkingDays(year: number, month: number): Promise<number> {
    try {
      const calendar = await db
        .select({ workingDays: academicCalendar.workingDays })
        .from(academicCalendar)
        .where(and(
          eq(academicCalendar.year, year),
          eq(academicCalendar.month, month),
          eq(academicCalendar.isActive, true)
        ))
        .limit(1);
      
      if (calendar.length > 0) {
        return calendar[0].workingDays;
      }
      
      // Create default entry if not exists
      await db.insert(academicCalendar).values({
        year,
        month,
        workingDays: 20, // Default 20 working days
        isActive: true
      });
      
      return 20;
      
    } catch (error) {
      console.error('Error getting working days:', error);
      return 20; // Default fallback
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
          eq(users.role, 'student')
        ));
    } catch (error) {
      console.error('Error getting batch students:', error);
      return [];
    }
  }
  
  /**
   * Save monthly results to database
   */
  private async saveMonthlyResults(results: MonthlyResultData[], year: number, month: number) {
    try {
      // Delete existing results for the month
      await db.delete(monthlyResults)
        .where(and(
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
        absentDays: 0, // Will be calculated from attendance
        excusedDays: 0, // Will be calculated from attendance  
        workingDays: result.workingDays,
        attendancePercentage: result.attendancePercentage,
        bonusMarks: result.bonusMarks,
        finalScore: result.finalScore,
        classRank: result.rank,
        totalStudents: result.totalStudents
      }));
      
      if (insertData.length > 0) {
        await db.insert(monthlyResults).values(insertData);
      }
      
    } catch (error) {
      console.error('Error saving monthly results:', error);
      throw error;
    }
  }
  
  /**
   * Update top performers cache
   */
  private async updateTopPerformers(results: MonthlyResultData[], year: number, month: number) {
    try {
      // Delete existing top performers for the month
      await db.delete(topPerformers)
        .where(and(
          eq(topPerformers.year, year),
          eq(topPerformers.month, month)
        ));
      
      // Group by class level and get top 5 from each class
      const classesList = ['6', '7', '8', '9', '10'];
      
      for (const classLevel of classesList) {
        const classResults = results
          .filter(r => r.classLevel === classLevel)
          .slice(0, 5); // Top 5 only
        
        const topPerformersData = classResults.map((result, index) => ({
          studentId: result.studentId,
          year,
          month,
          classLevel,
          rank: index + 1,
          finalScore: result.finalScore,
          studentName: result.studentName,
          studentPhoto: null // Will be populated later if needed
        }));
        
        if (topPerformersData.length > 0) {
          await db.insert(topPerformers).values(topPerformersData);
        }
      }
      
    } catch (error) {
      console.error('Error updating top performers:', error);
    }
  }
  
  /**
   * Get monthly results for a batch
   */
  async getMonthlyResults(batchId: string, year: number, month: number): Promise<MonthlyResultData[]> {
    try {
      const results = await db
        .select({
          studentId: monthlyResults.studentId,
          studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          batchId: monthlyResults.batchId,
          classLevel: monthlyResults.classLevel,
          examAverage: monthlyResults.examAverage,
          attendancePercentage: monthlyResults.attendancePercentage,
          bonusMarks: monthlyResults.bonusMarks,
          finalScore: monthlyResults.finalScore,
          rank: monthlyResults.classRank,
          totalStudents: monthlyResults.totalStudents,
          presentDays: monthlyResults.presentDays,
          workingDays: monthlyResults.workingDays,
          totalExams: monthlyResults.totalExams
        })
        .from(monthlyResults)
        .leftJoin(users, eq(users.id, monthlyResults.studentId))
        .where(and(
          eq(monthlyResults.batchId, batchId),
          eq(monthlyResults.year, year),
          eq(monthlyResults.month, month)
        ))
        .orderBy(asc(monthlyResults.classRank));
      
      return results.map((r: any) => ({
        studentId: r.studentId,
        studentName: r.studentName || 'Unknown',
        batchId: r.batchId,
        classLevel: r.classLevel,
        examAverage: r.examAverage,
        attendancePercentage: r.attendancePercentage,
        bonusMarks: r.bonusMarks,
        finalScore: r.finalScore,
        rank: r.rank,
        totalStudents: r.totalStudents,
        presentDays: r.presentDays,
        workingDays: r.workingDays,
        totalExams: r.totalExams
      }));
      
    } catch (error) {
      console.error('Error getting monthly results:', error);
      return [];
    }
  }
  
  /**
   * Get top performers for homepage
   */
  async getTopPerformers(year: number, month: number): Promise<TopPerformer[]> {
    try {
      return await db
        .select()
        .from(topPerformers)
        .where(and(
          eq(topPerformers.year, year),
          eq(topPerformers.month, month)
        ))
        .orderBy(asc(topPerformers.classLevel), asc(topPerformers.rank));
        
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }
  
  /**
   * Get student's monthly results history
   */
  async getStudentMonthlyHistory(studentId: string): Promise<MonthlyResult[]> {
    try {
      return await db
        .select()
        .from(monthlyResults)
        .where(eq(monthlyResults.studentId, studentId))
        .orderBy(desc(monthlyResults.year), desc(monthlyResults.month));
        
    } catch (error) {
      console.error('Error getting student monthly history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const monthlyResultsService = new MonthlyResultsService();