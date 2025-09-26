// Fee Collection Database Methods
// Production-ready fee management system

import { db } from './db';
import { studentFees, feePayments, batchFeeSettings, users, batches } from '../shared/schema';
import { eq, and, gte, lte, desc, sql, sum, avg, count, like } from 'drizzle-orm';

export interface FeeCreateData {
  studentId: string;
  batchId: string;
  month: string; // Format: '2025-01'
  amount: number;
  dueDate: Date;
  remarks?: string;
}

export interface PaymentCreateData {
  feeId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'online';
  transactionId?: string;
  collectedBy: string;
  remarks?: string;
}

export interface BatchFeeSettingData {
  batchId: string;
  monthlyFee: number;
  admissionFee?: number;
  otherFees?: number;
  dueDay: number; // Day of month when fee is due
}

export interface FeeReport {
  studentId: string;
  studentName: string;
  studentPhone: string;
  batchName: string;
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  overdueFees: number;
  lastPaymentDate?: Date;
}

export interface MonthlyFeeReport {
  month: string; // Format: '2025-01'
  batchId: string;
  batchName: string;
  totalStudents: number;
  expectedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  collectionRate: number; // Percentage
}

/**
 * Fee Management Storage Service
 */
export class FeeStorage {
  
  /**
   * Create fee record for a student
   */
  static async createStudentFee(data: FeeCreateData) {
    try {
      const [fee] = await db.insert(studentFees).values({
        studentId: data.studentId,
        batchId: data.batchId,
        month: data.month,
        amount: data.amount,
        amountPaid: 0,
        status: 'unpaid',
        dueDate: data.dueDate,
        remarks: data.remarks,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`✅ Fee created for student ${data.studentId}: ${data.amount} BDT for ${data.month}`);
      return fee;
    } catch (error) {
      console.error('❌ Error creating student fee:', error);
      throw new Error('Failed to create student fee');
    }
  }

  /**
   * Create fee records for entire batch
   */
  static async createBatchMonthlyFees(batchId: string, monthYear: string) {
    try {
      // Get batch fee settings
      const batchSettings = await this.getBatchFeeSettings(batchId);
      if (!batchSettings) {
        throw new Error('Batch fee settings not found');
      }

      // Get all students in batch
      const students = await db.select().from(users)
        .where(and(eq(users.batchId, batchId), eq(users.role, 'student')));

      if (students.length === 0) {
        throw new Error('No students found in batch');
      }

      // Calculate due date based on monthYear and dueDay
      const [year, month] = monthYear.split('-').map(Number);
      const dueDate = new Date(year, month - 1, batchSettings.dueDay);

      const feeRecords = students.map((student: any) => ({
        studentId: student.id,
        batchId: batchId,
        month: monthYear,
        amount: batchSettings.monthlyFee,
        amountPaid: 0,
        status: 'unpaid' as const,
        dueDate,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const createdFees = await db.insert(studentFees).values(feeRecords).returning();
      
      console.log(`✅ Created ${createdFees.length} fee records for batch ${batchId} (${monthYear})`);
      return createdFees;
    } catch (error) {
      console.error('❌ Error creating batch monthly fees:', error);
      throw new Error('Failed to create batch monthly fees');
    }
  }

  /**
   * Record fee payment
   */
  static async recordPayment(data: PaymentCreateData) {
    try {
      // Check if student fee exists
      const [studentFee] = await db.select().from(studentFees)
        .where(eq(studentFees.id, data.feeId));

      if (!studentFee) {
        throw new Error('Student fee record not found');
      }

      // Record payment
      const [payment] = await db.insert(feePayments).values({
        feeId: data.feeId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        collectedBy: data.collectedBy,
        remarks: data.remarks,
        createdAt: new Date()
      }).returning();

      // Update student fee record
      const newAmountPaid = studentFee.amountPaid + data.amount;
      const newStatus = newAmountPaid >= studentFee.amount ? 'paid' : 'partial';

      await db.update(studentFees)
        .set({
          amountPaid: newAmountPaid,
          status: newStatus,
          collectedBy: data.collectedBy,
          collectedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(studentFees.id, data.feeId));

      console.log(`✅ Payment recorded: ${data.amount} BDT for fee ${data.feeId}`);
      return { payment, updatedFee: { ...studentFee, amountPaid: newAmountPaid, status: newStatus } };
    } catch (error) {
      console.error('❌ Error recording payment:', error);
      throw new Error('Failed to record payment');
    }
  }

  /**
   * Set batch fee settings
   */
  static async setBatchFeeSettings(data: BatchFeeSettingData) {
    try {
      // Check if settings exist
      const existing = await db.select().from(batchFeeSettings)
        .where(eq(batchFeeSettings.batchId, data.batchId));

      if (existing.length > 0) {
        // Update existing
        const [updated] = await db.update(batchFeeSettings)
          .set({
            monthlyFee: data.monthlyFee,
            admissionFee: data.admissionFee,
            otherFees: data.otherFees,
            dueDay: data.dueDay,
            updatedAt: new Date()
          })
          .where(eq(batchFeeSettings.batchId, data.batchId))
          .returning();
        
        console.log(`✅ Updated fee settings for batch ${data.batchId}`);
        return updated;
      } else {
        // Create new
        const [created] = await db.insert(batchFeeSettings).values({
          batchId: data.batchId,
          monthlyFee: data.monthlyFee,
          admissionFee: data.admissionFee || 0,
          otherFees: data.otherFees || 0,
          dueDay: data.dueDay,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        console.log(`✅ Created fee settings for batch ${data.batchId}`);
        return created;
      }
    } catch (error) {
      console.error('❌ Error setting batch fee settings:', error);
      throw new Error('Failed to set batch fee settings');
    }
  }

  /**
   * Get batch fee settings
   */
  static async getBatchFeeSettings(batchId: string) {
    try {
      const [settings] = await db.select().from(batchFeeSettings)
        .where(eq(batchFeeSettings.batchId, batchId));
      
      return settings || null;
    } catch (error) {
      console.error('❌ Error getting batch fee settings:', error);
      return null;
    }
  }

  /**
   * Get student fees with payment details
   */
  static async getStudentFees(studentId: string, monthPattern?: string) {
    try {
      const conditions = [eq(studentFees.studentId, studentId)];
      if (monthPattern) {
        conditions.push(like(studentFees.month, `${monthPattern}%`));
      }

      const fees = await db.select({
        id: studentFees.id,
        month: studentFees.month,
        amount: studentFees.amount,
        amountPaid: studentFees.amountPaid,
        status: studentFees.status,
        dueDate: studentFees.dueDate,
        createdAt: studentFees.createdAt,
        batchName: batches.name
      })
      .from(studentFees)
      .leftJoin(batches, eq(studentFees.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(desc(studentFees.month));

      return fees;
    } catch (error) {
      console.error('❌ Error getting student fees:', error);
      return [];
    }
  }

  /**
   * Get fee payments for a student fee
   */
  static async getFeePayments(feeId: string) {
    try {
      const payments = await db.select().from(feePayments)
        .where(eq(feePayments.feeId, feeId))
        .orderBy(desc(feePayments.createdAt));

      return payments;
    } catch (error) {
      console.error('❌ Error getting fee payments:', error);
      return [];
    }
  }

  /**
   * Get batch fee report for a specific month
   */
  static async getBatchMonthlyReport(batchId: string, monthYear: string): Promise<MonthlyFeeReport> {
    try {
      // Get batch info
      const [batch] = await db.select().from(batches)
        .where(eq(batches.id, batchId));

      if (!batch) {
        throw new Error('Batch not found');
      }

      // Get fee summary for the month
      const feeSummary = await db.select({
        totalStudents: count(studentFees.id),
        expectedAmount: sum(studentFees.amount),
        collectedAmount: sum(studentFees.amountPaid)
      })
      .from(studentFees)
      .where(and(
        eq(studentFees.batchId, batchId),
        eq(studentFees.month, monthYear)
      ));

      const summary = feeSummary[0];
      const expectedAmount = Number(summary.expectedAmount || 0);
      const collectedAmount = Number(summary.collectedAmount || 0);
      const pendingAmount = expectedAmount - collectedAmount;
      const collectionRate = expectedAmount > 0 ? (collectedAmount / expectedAmount) * 100 : 0;

      return {
        month: monthYear,
        batchId,
        batchName: batch.name,
        totalStudents: Number(summary.totalStudents || 0),
        expectedAmount,
        collectedAmount,
        pendingAmount,
        collectionRate: Math.round(collectionRate * 100) / 100
      };
    } catch (error) {
      console.error('❌ Error getting batch monthly report:', error);
      throw new Error('Failed to get batch monthly report');
    }
  }

  /**
   * Get student fee reports (for teacher dashboard)
   */
  static async getStudentFeeReports(batchId?: string): Promise<FeeReport[]> {
    try {
      const conditions = batchId ? [eq(users.batchId, batchId)] : [];
      conditions.push(eq(users.role, 'student'));

      const reports = await db.select({
        studentId: users.id,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        studentPhone: users.phoneNumber,
        batchName: batches.name,
        totalDue: sum(studentFees.amount),
        totalPaid: sum(studentFees.amountPaid)
      })
      .from(users)
      .leftJoin(batches, eq(users.batchId, batches.id))
      .leftJoin(studentFees, eq(studentFees.studentId, users.id))
      .where(and(...conditions))
      .groupBy(users.id, users.firstName, users.lastName, users.phoneNumber, batches.name);

      return reports.map((report: any) => ({
        studentId: report.studentId,
        studentName: report.studentName,
        studentPhone: report.studentPhone || 'N/A',
        batchName: report.batchName || 'N/A',
        totalDue: Number(report.totalDue || 0),
        totalPaid: Number(report.totalPaid || 0),
        remainingBalance: Number(report.totalDue || 0) - Number(report.totalPaid || 0),
        overdueFees: 0, // Calculate separately if needed
        lastPaymentDate: undefined // Will be added if needed
      }));
    } catch (error) {
      console.error('❌ Error getting student fee reports:', error);
      return [];
    }
  }

  /**
   * Get overdue fees
   */
  static async getOverdueFees(batchId?: string) {
    try {
      const today = new Date();
      const conditions = [
        eq(studentFees.status, 'unpaid'),
        lte(studentFees.dueDate, today)
      ];

      if (batchId) {
        conditions.push(eq(studentFees.batchId, batchId));
      }

      const overdueData = await db.select({
        id: studentFees.id,
        studentId: studentFees.studentId,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        studentPhone: users.phoneNumber,
        batchName: batches.name,
        month: studentFees.month,
        amount: studentFees.amount,
        amountPaid: studentFees.amountPaid,
        dueDate: studentFees.dueDate
      })
      .from(studentFees)
      .leftJoin(users, eq(studentFees.studentId, users.id))
      .leftJoin(batches, eq(studentFees.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(desc(studentFees.dueDate));

      return overdueData;
    } catch (error) {
      console.error('❌ Error getting overdue fees:', error);
      return [];
    }
  }

  /**
   * Get fee collection statistics
   */
  static async getCollectionStats(batchId?: string, yearPattern?: string) {
    try {
      const conditions: any[] = [];
      if (batchId) conditions.push(eq(studentFees.batchId, batchId));
      if (yearPattern) conditions.push(like(studentFees.month, `${yearPattern}%`));

      const stats = await db.select({
        totalFees: count(studentFees.id),
        totalExpected: sum(studentFees.amount),
        totalCollected: sum(studentFees.amountPaid),
        paidFees: count(sql`CASE WHEN ${studentFees.status} = 'paid' THEN 1 END`),
        pendingFees: count(sql`CASE WHEN ${studentFees.status} = 'unpaid' THEN 1 END`),
        partialFees: count(sql`CASE WHEN ${studentFees.status} = 'partial' THEN 1 END`)
      })
      .from(studentFees)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

      const result = stats[0];
      return {
        totalFees: Number(result.totalFees || 0),
        totalExpected: Number(result.totalExpected || 0),
        totalCollected: Number(result.totalCollected || 0),
        paidFees: Number(result.paidFees || 0),
        pendingFees: Number(result.pendingFees || 0),
        partialFees: Number(result.partialFees || 0),
        collectionRate: Number(result.totalExpected || 0) > 0 
          ? Math.round((Number(result.totalCollected || 0) / Number(result.totalExpected || 0)) * 100 * 100) / 100 
          : 0
      };
    } catch (error) {
      console.error('❌ Error getting collection stats:', error);
      return {
        totalFees: 0,
        totalExpected: 0,
        totalCollected: 0,
        paidFees: 0,
        pendingFees: 0,
        partialFees: 0,
        collectionRate: 0
      };
    }
  }
}