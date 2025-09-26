/**
 * Auto Result Trigger Service
 * Automatically triggers monthly result generation when exam marks are entered
 */

import { automatedMonthlyResultsService } from './automatedMonthlyResults';
import { db } from './db';
import { exams, examSubmissions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export class AutoResultTrigger {
  private processingQueue = new Set<string>();

  /**
   * Trigger result generation when exam marks are entered
   */
  async onExamMarksEntered(examId: string) {
    try {
      console.log(`🎯 Auto-trigger: Exam marks entered for exam ${examId}`);
      
      // Get exam details
      const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      if (!exam[0]) {
        console.log('⚠️ Exam not found');
        return;
      }

      const examData = exam[0];
      const examDate = new Date(examData.createdAt);
      const year = examDate.getFullYear();
      const month = examDate.getMonth() + 1;
      const batchId = examData.batchId;

      // Create unique key for this batch-month combination
      const processKey = `${batchId}-${year}-${month}`;
      
      // Prevent duplicate processing
      if (this.processingQueue.has(processKey)) {
        console.log(`⚠️ Already processing results for ${processKey}`);
        return;
      }

      this.processingQueue.add(processKey);

      try {
        // Auto-generate results for this batch and month
        console.log(`🚀 Auto-generating results for batch ${batchId}, ${month}/${year}`);
        
        // Use the public method to process results for all batches in that month
        const stats = await automatedMonthlyResultsService.processMonthlyResults(year, month);

        console.log(`✅ Auto-generated monthly results for batch ${examData.title}:`, stats);
        
        // Send notification to teacher (optional)
        await this.notifyTeacher(batchId, year, month, stats.successfulResults);
        
      } finally {
        // Remove from processing queue
        this.processingQueue.delete(processKey);
      }

    } catch (error) {
      console.error('❌ Error in auto result trigger:', error);
    }
  }

  /**
   * Trigger when all students' marks for an exam are completed
   */
  async onExamCompleted(examId: string) {
    try {
      console.log(`🏁 Auto-trigger: Exam completed ${examId}`);
      
      // Get exam details
      const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      if (!exam[0]) return;

      const examData = exam[0];
      
      // Check if all students have marks
      const totalStudents = await db
        .select({ count: sql<number>`count(*)` })
        .from(examSubmissions)
        .where(eq(examSubmissions.examId, examId));

      const studentsWithMarks = await db
        .select({ count: sql<number>`count(*)` })
        .from(examSubmissions)
        .where(and(
          eq(examSubmissions.examId, examId),
          sql`${examSubmissions.manualMarks} IS NOT NULL`
        ));

      const total = totalStudents[0]?.count || 0;
      const withMarks = studentsWithMarks[0]?.count || 0;

      if (total > 0 && withMarks === total) {
        console.log(`✅ All students have marks for exam ${examData.title}`);
        await this.onExamMarksEntered(examId);
      } else {
        console.log(`📊 Exam progress: ${withMarks}/${total} students have marks`);
      }

    } catch (error) {
      console.error('❌ Error checking exam completion:', error);
    }
  }

  /**
   * Check if a month's results need regeneration
   */
  async checkMonthCompletion(batchId: string, year: number, month: number) {
    try {
      // Get all exams in the month for this batch
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const monthExams = await db
        .select({
          id: exams.id,
          title: exams.title,
          totalMarks: exams.totalMarks
        })
        .from(exams)
        .where(and(
          eq(exams.batchId, batchId),
          sql`${exams.createdAt} >= ${startDate}`,
          sql`${exams.createdAt} <= ${endDate}`,
          eq(exams.isActive, true)
        ));

      if (monthExams.length === 0) {
        console.log(`📝 No exams found for ${batchId} in ${month}/${year}`);
        return false;
      }

      // Check if all exams have complete marks
      let allComplete = true;
      for (const exam of monthExams) {
        const totalSubmissions = await db
          .select({ count: sql<number>`count(*)` })
          .from(examSubmissions)
          .where(eq(examSubmissions.examId, exam.id));

        const markedSubmissions = await db
          .select({ count: sql<number>`count(*)` })
          .from(examSubmissions)
          .where(and(
            eq(examSubmissions.examId, exam.id),
            sql`${examSubmissions.manualMarks} IS NOT NULL`
          ));

        const total = totalSubmissions[0]?.count || 0;
        const marked = markedSubmissions[0]?.count || 0;

        if (total === 0 || marked < total) {
          console.log(`⏳ Exam "${exam.title}": ${marked}/${total} marked`);
          allComplete = false;
        }
      }

      if (allComplete) {
        console.log(`🎉 All exams complete for ${batchId} in ${month}/${year} - triggering results`);
        await this.onExamMarksEntered(monthExams[0].id);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Error checking month completion:', error);
      return false;
    }
  }

  /**
   * Notify teacher about auto-generated results
   */
  private async notifyTeacher(batchId: string, year: number, month: number, studentCount: number) {
    try {
      // This could send SMS, email, or in-app notification
      console.log(`📱 Notification: Monthly results auto-generated for batch ${batchId}`);
      console.log(`📊 ${studentCount} students processed for ${month}/${year}`);
      
      // You can implement actual notification logic here
      // await smsService.notifyTeacher(...);
      // await emailService.notifyTeacher(...);
      
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }
}

// Export singleton instance
export const autoResultTrigger = new AutoResultTrigger();