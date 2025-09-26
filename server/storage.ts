import {
  users,
  batches,
  exams,
  questions,
  examSubmissions,
  messages,
  notices,
  attendance,
  smsTransactions,
  smsLogs,
  activityLogs,
  notes,
  courses,
  teacherProfiles,
  praggoAIKeys,
  questionBankCategories,
  questionBankItems,
  monthlyResults,
  type User,
  type UpsertUser,
  type Batch,
  type InsertBatch,
  type InsertStudent,
  type InsertExam,
  type Exam,
  type InsertQuestion,
  type Question,
  type InsertSubmission,
  type ExamSubmission,
  type InsertMessage,
  type Message,
  type InsertNotice,
  type Notice,
  type InsertAttendance,
  type Attendance,
  type InsertSmsTransaction,
  type SmsTransaction,
  type InsertSmsLog,
  type SmsLog,
  type InsertActivityLog,
  type ActivityLog,
  type InsertNote,
  type Note,
  type InsertCourse,
  type Course,
  type InsertTeacherProfile,
  type TeacherProfile,
  type PraggoAIKey,
  type QuestionBankCategory,
  type InsertQuestionBankCategory,
  type QuestionBankItem,
  type InsertQuestionBankItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, count, avg, and, or, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // Student management operations
  createStudent(student: InsertStudent): Promise<User>;
  getAllStudents(): Promise<User[]>;
  getStudentsByBatch(batchId: string): Promise<User[]>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<User>;
  deleteStudent(id: string): Promise<void>;
  generateStudentId(): Promise<string>;
  generateStudentPassword(): string;
  updateStudentPassword(id: string, password: string): Promise<User>;
  authenticateStudent(studentId: string, batchCode: string, password: string): Promise<User | null>;
  
  // Batch management operations
  createBatch(batch: InsertBatch): Promise<Batch>;
  getAllBatches(): Promise<Batch[]>;
  getBatchById(id: string): Promise<Batch | undefined>;
  getBatch(id: string): Promise<Batch | undefined>; // Alias for getBatchById
  getBatchByCode(batchCode: string): Promise<Batch | undefined>;
  updateBatch(id: string, data: Partial<InsertBatch>): Promise<Batch>;
  deleteBatch(id: string): Promise<void>;
  
  // SMS operations
  createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog>;
  getSmsLogs(userId?: string): Promise<SmsLog[]>;
  getSmsUsageStats(userId: string): Promise<{
    totalSent: number;
    totalCost: number;
    thisMonth: number;
    thisMonthCost: number;
    smsByType: Array<{ type: string; count: number; cost: number }>;
    recentLogs: SmsLog[];
    monthlyStats: Array<{ month: string; count: number; cost: number }>;
  }>;
  
  // Super User operations
  changeTeacherPassword(teacherId: string, newPassword: string): Promise<User>;
  addSmsCredits(teacherId: string, credits: number): Promise<User>;
  getUserSmsCredits(userId: string): Promise<number>;
  deductSmsCredits(userId: string, credits: number): Promise<boolean>;
  getAllTeachers(): Promise<User[]>;
  getUsersByRole(role: 'student' | 'teacher' | 'superUser'): Promise<User[]>;
  
  // Exam operations
  getExamsByTeacher(teacherId: string): Promise<Exam[]>;
  getAllActiveExams(): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  getExamById(id: string): Promise<Exam | undefined>;
  updateExam(id: string, data: Partial<InsertExam>): Promise<Exam>;
  deleteExam(id: string): Promise<void>;
  
  // Question operations
  getQuestionsByExam(examId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  
  // Submission operations
  getSubmissionsByExam(examId: string): Promise<ExamSubmission[]>;
  getSubmissionsByStudent(userId: string): Promise<ExamSubmission[]>;
  getSubmissionByUserAndExam(userId: string, examId: string): Promise<ExamSubmission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<ExamSubmission>;
  updateSubmission(id: string, data: Partial<InsertSubmission>): Promise<ExamSubmission>;
  
  // Exam Results operations  
  getExamResults(examId: string): Promise<Array<{
    studentId: string;
    marks: number;
    feedback?: string;
    submissionId?: string;
  }>>;
  
  // Message operations
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getRecentMessagesForUser(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  
  // Notice operations
  getActiveNotices(): Promise<Notice[]>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: string, data: Partial<InsertNotice>): Promise<Notice>;
  deleteNotice(id: string): Promise<void>;
  
  // Attendance operations
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByBatchAndDate(batchId: string, date: Date): Promise<Attendance[]>;
  createBulkAttendance(attendanceRecords: InsertAttendance[]): Promise<Attendance[]>;
  getStudentsByBatch(batchId: string): Promise<User[]>;
  deleteAttendanceByBatchAndDate(batchId: string, date: Date): Promise<void>;
  
  // Dashboard stats
  getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    activeExams: number;
    averageScore: number;
    attendanceRate: number;
  }>;
  
  getStudentStats(studentId: string): Promise<{
    totalExams: number;
    completedExams: number;
    averageScore: number;
    attendanceRate: number;
  }>;

  // SMS Transaction operations
  createSmsTransaction(transaction: InsertSmsTransaction): Promise<SmsTransaction>;
  getSmsTransactions(userId: string): Promise<SmsTransaction[]>;
  updateSmsTransaction(id: string, data: Partial<InsertSmsTransaction>): Promise<SmsTransaction>;
  
  // Monthly Results operations
  getMonthlyResults(year: number, month: number, batchIds?: string[]): Promise<any[]>;
  markMonthlyResultSMSSent(monthlyResultId: string): Promise<void>;
  updateUserSmsCredits(userId: string, credits: number): Promise<User>;
  
  // User management
  getAllStudents(): Promise<User[]>;
  
  // Activity logging
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivities(limit?: number): Promise<ActivityLog[]>;

  // Note sharing operations
  createNote(note: InsertNote): Promise<Note>;
  getAllNotes(): Promise<Note[]>;
  getNotesByStudent(studentId: string): Promise<Note[]>;
  getNotesByBatch(batchId: string): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | undefined>;
  updateNote(id: string, data: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  incrementNoteViews(id: string): Promise<void>;
  likeNote(id: string): Promise<void>;

  // Course management operations
  createCourse(course: InsertCourse): Promise<Course>;
  getAllCourses(): Promise<Course[]>;
  getActiveCourses(): Promise<Course[]>;
  getCoursesBySubject(subject: string): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Teacher profile operations
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined>;
  getPublicTeacherProfiles(): Promise<TeacherProfile[]>;
  updateTeacherProfile(id: string, data: Partial<InsertTeacherProfile>): Promise<TeacherProfile>;
  deleteTeacherProfile(id: string): Promise<void>;

  // Praggo AI Key operations
  getAllPraggoAIKeys(): Promise<PraggoAIKey[]>;
  getPraggoAIKeyByName(keyName: string): Promise<PraggoAIKey | undefined>;
  upsertPraggoAIKey(keyName: string, keyValue: string, keyIndex: number, isEnabled?: boolean): Promise<PraggoAIKey>;
  updatePraggoAIKeyStatus(keyName: string, status: 'active' | 'quota_exceeded' | 'error' | 'disabled', lastError?: string): Promise<PraggoAIKey>;
  getActivePraggoAIKeys(): Promise<PraggoAIKey[]>;

  // Question Bank operations
  getQuestionBankCategories(): Promise<QuestionBankCategory[]>;
  getQuestionBankCategoriesByFilter(classLevel: string, subject: string, paper?: string): Promise<QuestionBankCategory[]>;
  createQuestionBankCategory(categoryData: InsertQuestionBankCategory): Promise<QuestionBankCategory>;
  updateQuestionBankCategory(id: string, updates: Partial<InsertQuestionBankCategory>): Promise<QuestionBankCategory>;
  deleteQuestionBankCategory(id: string): Promise<void>;
  
  getQuestionBankItems(categoryId: string): Promise<QuestionBankItem[]>;
  getQuestionBankItemsByChapter(categoryId: string, chapter: string): Promise<QuestionBankItem[]>;
  createQuestionBankItem(itemData: InsertQuestionBankItem): Promise<QuestionBankItem>;
  updateQuestionBankItem(id: string, updates: Partial<InsertQuestionBankItem>): Promise<QuestionBankItem>;
  deleteQuestionBankItem(id: string): Promise<void>;
  incrementDownloadCount(itemId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return user;
  }

  // Exam operations
  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    if (!teacherId) {
      return this.getAllActiveExams();
    }
    
    const isSQLite = process.env.DATABASE_URL?.startsWith('file:');
    
    if (isSQLite) {
      // For SQLite, use direct SQL to avoid schema issues
      const sqlite = (db as any)._.session.db;
      
      const results = sqlite.prepare(`
        SELECT * FROM exams 
        WHERE created_by = ? 
        ORDER BY created_at DESC
      `).all(teacherId);
      
      // Convert SQLite results to expected format
      return results.map((result: any) => ({
        id: result.id,
        title: result.title,
        subject: result.subject,
        chapter: result.chapter,
        targetClass: result.target_class,
        description: result.description,
        instructions: result.instructions,
        examDate: result.exam_date ? new Date(result.exam_date * 1000) : null,
        duration: result.duration,
        examType: result.exam_type,
        examMode: result.exam_mode,
        batchId: result.batch_id,
        targetStudents: result.target_students ? JSON.parse(result.target_students) : null,
        questionSource: result.question_source,
        questionContent: result.question_content,
        questionPaperImage: result.question_paper_image,
        totalMarks: result.total_marks,
        isActive: result.is_active === 1,
        createdBy: result.created_by,
        createdAt: result.created_at ? new Date(result.created_at * 1000) : new Date(),
        updatedAt: result.updated_at ? new Date(result.updated_at * 1000) : new Date()
      }));
    } else {
      // For PostgreSQL, use ORM
      return await db
        .select()
        .from(exams)
        .where(eq(exams.createdBy, teacherId))
        .orderBy(desc(exams.createdAt));
    }
  }

  async getAllActiveExams(): Promise<Exam[]> {
    const isSQLite = process.env.DATABASE_URL?.startsWith('file:');
    
    if (isSQLite) {
      // For SQLite, use direct SQL
      const sqlite = (db as any)._.session.db;
      
      const results = sqlite.prepare(`
        SELECT * FROM exams 
        WHERE is_active = 1 
        ORDER BY created_at DESC
      `).all();
      
      // Convert SQLite results to expected format
      return results.map((result: any) => ({
        id: result.id,
        title: result.title,
        subject: result.subject,
        chapter: result.chapter,
        targetClass: result.target_class,
        description: result.description,
        instructions: result.instructions,
        examDate: result.exam_date ? new Date(result.exam_date * 1000) : null,
        duration: result.duration,
        examType: result.exam_type,
        examMode: result.exam_mode,
        batchId: result.batch_id,
        targetStudents: result.target_students ? JSON.parse(result.target_students) : null,
        questionSource: result.question_source,
        questionContent: result.question_content,
        questionPaperImage: result.question_paper_image,
        totalMarks: result.total_marks,
        isActive: result.is_active === 1,
        createdBy: result.created_by,
        createdAt: result.created_at ? new Date(result.created_at * 1000) : new Date(),
        updatedAt: result.updated_at ? new Date(result.updated_at * 1000) : new Date()
      }));
    } else {
      // For PostgreSQL, use ORM
      return await db
        .select()
        .from(exams)
        .where(eq(exams.isActive, true))
        .orderBy(desc(exams.createdAt));
    }
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    // Check if we're using SQLite
    const isSQLite = process.env.DATABASE_URL?.startsWith('file:');
    
    if (isSQLite) {
      // For SQLite, use direct SQL to avoid schema compatibility issues
      const sqlite = (db as any)._.session.db; // Access underlying SQLite database
      
      const stmt = sqlite.prepare(`
        INSERT INTO exams (title, subject, chapter, target_class, description, instructions, exam_date, duration, exam_type, exam_mode, batch_id, target_students, question_source, question_content, question_paper_image, total_marks, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `);
      
      const result = stmt.get(
        exam.title,
        exam.subject,
        exam.chapter || null,
        exam.targetClass || null,
        exam.description || null,
        exam.instructions || null,
        exam.examDate ? Math.floor(new Date(exam.examDate).getTime() / 1000) : null,
        exam.duration,
        exam.examType,
        exam.examMode,
        exam.batchId || null,
        exam.targetStudents ? JSON.stringify(exam.targetStudents) : null,
        exam.questionSource || null,
        exam.questionContent || null,
        exam.questionPaperImage || null,
        exam.totalMarks || 0,
        exam.isActive ? 1 : 0,
        exam.createdBy
      );
      
      // Convert SQLite result back to expected format
      return {
        ...result,
        examDate: result.exam_date ? new Date(result.exam_date * 1000) : null,
        targetClass: result.target_class,
        examType: result.exam_type,
        examMode: result.exam_mode,
        batchId: result.batch_id,
        targetStudents: result.target_students ? JSON.parse(result.target_students) : null,
        questionSource: result.question_source,
        questionContent: result.question_content,
        questionPaperImage: result.question_paper_image,
        totalMarks: result.total_marks,
        isActive: result.is_active === 1,
        createdBy: result.created_by,
        createdAt: result.created_at ? new Date(result.created_at * 1000) : new Date(),
        updatedAt: result.updated_at ? new Date(result.updated_at * 1000) : new Date()
      } as Exam;
    } else {
      // For PostgreSQL, use the ORM as usual
      const [newExam] = await db.insert(exams).values(exam).returning();
      return newExam;
    }
  }

  async getExamById(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async updateExam(id: string, data: Partial<InsertExam>): Promise<Exam> {
    const [updatedExam] = await db
      .update(exams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning();
    return updatedExam;
  }

  async deleteExam(id: string): Promise<void> {
    await db.delete(exams).where(eq(exams.id, id));
  }

  // Question operations
  async getQuestionsByExam(examId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId))
      .orderBy(asc(questions.orderIndex));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(data)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Submission operations
  async getSubmissionsByExam(examId: string): Promise<ExamSubmission[]> {
    return await db
      .select()
      .from(examSubmissions)
      .where(eq(examSubmissions.examId, examId))
      .orderBy(desc(examSubmissions.createdAt));
  }

  async getSubmissionsByStudent(userId: string): Promise<ExamSubmission[]> {
    return await db
      .select()
      .from(examSubmissions)
      .where(eq(examSubmissions.studentId, userId))
      .orderBy(desc(examSubmissions.submittedAt));
  }

  async getSubmissionByUserAndExam(userId: string, examId: string): Promise<ExamSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(examSubmissions)
      .where(and(eq(examSubmissions.studentId, userId), eq(examSubmissions.examId, examId)));
    return submission;
  }

  async createSubmission(submission: InsertSubmission): Promise<ExamSubmission> {
    const [newSubmission] = await db.insert(examSubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, data: Partial<InsertSubmission>): Promise<ExamSubmission> {
    const [updatedSubmission] = await db
      .update(examSubmissions)
      .set(data)
      .where(eq(examSubmissions.id, id))
      .returning();
    return updatedSubmission;
  }

  async deleteSubmission(id: string): Promise<void> {
    await db.delete(examSubmissions).where(eq(examSubmissions.id, id));
  }

  // Exam Results operations
  async getExamResults(examId: string): Promise<Array<{
    studentId: string;
    marks: number;
    feedback?: string;
    submissionId?: string;
  }>> {
    console.log(`🔍 getExamResults called for examId: ${examId}`);
    
    const submissions = await db
      .select({
        studentId: examSubmissions.studentId,
        score: examSubmissions.score,
        manualMarks: examSubmissions.manualMarks,
        feedback: examSubmissions.feedback,
        submissionId: examSubmissions.id,
        isSubmitted: examSubmissions.isSubmitted,
      })
      .from(examSubmissions)
      .where(eq(examSubmissions.examId, examId)); // Remove isSubmitted filter temporarily for debugging
    
    console.log(`🔍 Raw submissions found: ${submissions.length}`, submissions);
    
    // Filter for submitted results and map the data
    const results = submissions
      .filter(submission => submission.isSubmitted === true)
      .map(submission => ({
        studentId: submission.studentId,
        // Use manual marks if available (teacher entered), otherwise use auto-calculated score
        marks: submission.manualMarks ?? submission.score ?? 0,
        feedback: submission.feedback || '',
        submissionId: submission.submissionId || '',
      }));
    
    console.log(`🔍 Filtered results: ${results.length}`, results);
    
    return results;
  }

  // Message operations
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, userId1), eq(messages.toUserId, userId2)),
          and(eq(messages.fromUserId, userId2), eq(messages.toUserId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async getRecentMessagesForUser(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.createdAt))
      .limit(10);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Notice operations
  async getActiveNotices(): Promise<Notice[]> {
    return await db
      .select()
      .from(notices)
      .where(eq(notices.isActive, true))
      .orderBy(desc(notices.createdAt));
  }

  async createNotice(notice: InsertNotice): Promise<Notice> {
    const [newNotice] = await db.insert(notices).values(notice).returning();
    return newNotice;
  }

  async updateNotice(id: string, data: Partial<InsertNotice>): Promise<Notice> {
    const [updatedNotice] = await db
      .update(notices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notices.id, id))
      .returning();
    return updatedNotice;
  }

  async deleteNotice(id: string): Promise<void> {
    await db.update(notices).set({ isActive: false }).where(eq(notices.id, id));
  }

  // Attendance operations
  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId))
      .orderBy(desc(attendance.date));
  }

  async createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceRecord).returning();
    return newAttendance;
  }

  async getAttendanceByBatchAndDate(batchId: string, date: Date): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.batchId, batchId), eq(attendance.date, date)))
      .orderBy(asc(attendance.studentId));
  }

  async createBulkAttendance(attendanceRecords: InsertAttendance[]): Promise<Attendance[]> {
    if (attendanceRecords.length === 0) return [];
    return await db.insert(attendance).values(attendanceRecords).returning();
  }

  async getStudentsByBatch(batchId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.batchId, batchId), eq(users.role, 'student')))
      .orderBy(asc(users.firstName));
  }

  async getExamsByBatch(batchId: string): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .where(eq(exams.batchId, batchId))
      .orderBy(desc(exams.examDate));
  }

  async deleteAttendanceByBatchAndDate(batchId: string, date: Date): Promise<void> {
    await db.delete(attendance).where(and(eq(attendance.batchId, batchId), eq(attendance.date, date)));
  }

  // Dashboard stats
  async getTeacherStats(teacherId: string): Promise<{
    totalStudents: number;
    activeExams: number;
    averageScore: number;
    attendanceRate: number;
  }> {
    // Get total students (count unique student IDs from submissions)
    const [studentsResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'student'));

    // Get active exams count
    const [examsResult] = await db
      .select({ count: count() })
      .from(exams)
      .where(and(eq(exams.createdBy, teacherId), eq(exams.isActive, true)));

    // Get average score
    const [scoreResult] = await db
      .select({ avg: avg(examSubmissions.score) })
      .from(examSubmissions)
      .innerJoin(exams, eq(examSubmissions.examId, exams.id))
      .where(eq(exams.createdBy, teacherId));

    // Get attendance rate
    const [attendanceResult] = await db
      .select({ avg: avg(sql`CASE WHEN ${attendance.isPresent} THEN 1.0 ELSE 0.0 END`) })
      .from(attendance)
      .where(eq(attendance.createdBy, teacherId));

    return {
      totalStudents: studentsResult.count || 0,
      activeExams: examsResult.count || 0,
      averageScore: Number(scoreResult.avg) || 0,
      attendanceRate: (Number(attendanceResult.avg) || 0) * 100,
    };
  }

  async getStudentStats(studentId: string): Promise<{
    totalExams: number;
    completedExams: number;
    averageScore: number;
    attendanceRate: number;
  }> {
    // Get total available exams
    const [totalExamsResult] = await db
      .select({ count: count() })
      .from(exams)
      .where(eq(exams.isActive, true));

    // Get completed exams
    const [completedExamsResult] = await db
      .select({ count: count() })
      .from(examSubmissions)
      .where(and(eq(examSubmissions.studentId, studentId), eq(examSubmissions.isSubmitted, true)));

    // Get average score
    const [scoreResult] = await db
      .select({ avg: avg(examSubmissions.score) })
      .from(examSubmissions)
      .where(and(eq(examSubmissions.studentId, studentId), eq(examSubmissions.isSubmitted, true)));

    // Get attendance rate
    const [attendanceResult] = await db
      .select({ avg: avg(sql`CASE WHEN ${attendance.isPresent} THEN 1.0 ELSE 0.0 END`) })
      .from(attendance)
      .where(eq(attendance.studentId, studentId));

    return {
      totalExams: totalExamsResult.count || 0,
      completedExams: completedExamsResult.count || 0,
      averageScore: Number(scoreResult.avg) || 0,
      attendanceRate: (Number(attendanceResult.avg) || 0) * 100,
    };
  }

  // SMS Transaction operations
  async createSmsTransaction(transaction: InsertSmsTransaction): Promise<SmsTransaction> {
    const [newTransaction] = await db.insert(smsTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getSmsTransactions(userId: string): Promise<SmsTransaction[]> {
    return await db
      .select()
      .from(smsTransactions)
      .where(eq(smsTransactions.userId, userId))
      .orderBy(desc(smsTransactions.createdAt));
  }

  async updateSmsTransaction(id: string, data: Partial<InsertSmsTransaction>): Promise<SmsTransaction> {
    const [updatedTransaction] = await db
      .update(smsTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smsTransactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async updateUserSmsCredits(userId: string, credits: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ smsCredits: credits, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(userId: string, password: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ studentPassword: password, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getAllStudents(): Promise<User[]> {
    // Optimized with index hint for better performance
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(users.firstName);
  }

  // Student management operations
  async createStudent(student: InsertStudent): Promise<User> {
    // Generate student ID if not provided
    const studentId = student.studentId || await this.generateStudentId();
    
    // Generate username from first name + student ID
    const username = `${(student.firstName || '').toLowerCase().replace(/\s+/g, '')}_${studentId}`;
    
    // Generate a default password for the student
    const password = this.generateStudentPassword();
    
    const [newStudent] = await db.insert(users).values({
      ...student,
      studentId,
      username, // Add username field
      password, // Add password field
      studentPassword: password, // Use same password for studentPassword
      role: 'student',
      isActive: true
    }).returning();
    return newStudent;
  }


  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<User> {
    const [updatedStudent] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedStudent;
  }

  // SMS Billing Methods
  async getSMSLogs(): Promise<any[]> {
    const logs = await db.select().from(smsLogs)
      .orderBy(sql`${smsLogs.sentAt} DESC`)
      .limit(50);
    return logs;
  }

  async getSMSStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // Get all logs for calculations
    const allLogs = await db.select().from(smsLogs);
    
    const todayLogs = allLogs.filter((log: any) => new Date(log.sentAt!) >= today);
    const weekLogs = allLogs.filter((log: any) => new Date(log.sentAt!) >= weekAgo);
    const monthLogs = allLogs.filter((log: any) => new Date(log.sentAt!) >= monthAgo);

    return {
      totalSent: allLogs.length,
      totalCredits: allLogs.reduce((sum: any, log: any) => sum + (log.credits || 0), 0),
      totalCostPaisa: allLogs.reduce((sum: any, log: any) => sum + (log.costPaisa || 0), 0),
      todayCount: todayLogs.length,
      todayCost: todayLogs.reduce((sum: any, log: any) => sum + (log.costPaisa || 0), 0) / 100,
      weeklyCount: weekLogs.length,
      weeklyCost: weekLogs.reduce((sum: any, log: any) => sum + (log.costPaisa || 0), 0) / 100,
      monthlyCount: monthLogs.length,
      monthlyCost: monthLogs.reduce((sum: any, log: any) => sum + (log.costPaisa || 0), 0) / 100,
    };
  }

  async deleteStudent(id: string): Promise<void> {
    // First delete all SMS logs that reference this student
    await db.delete(smsLogs).where(eq(smsLogs.studentId, id));
    
    // Delete all attendance records that reference this student
    await db.delete(attendance).where(eq(attendance.studentId, id));
    
    // Delete all activity logs that reference this user
    await db.delete(activityLogs).where(eq(activityLogs.userId, id));
    await db.delete(activityLogs).where(eq(activityLogs.relatedUserId, id));
    
    // Delete any exam submissions by this student
    await db.delete(examSubmissions).where(eq(examSubmissions.studentId, id));
    
    // Delete any messages sent by or to this student
    await db.delete(messages).where(or(
      eq(messages.fromUserId, id),
      eq(messages.toUserId, id)
    ));
    
    // Finally delete the student
    await db.delete(users).where(eq(users.id, id));
  }

  generateStudentPassword(): string {
    // Generate a 6-character password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async updateStudentPassword(id: string, password: string): Promise<User> {
    const [updatedStudent] = await db
      .update(users)
      .set({ studentPassword: password, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedStudent;
  }

  async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CHM${year}`;
    
    // Get the last student ID for this year
    const [lastStudent] = await db
      .select({ studentId: users.studentId })
      .from(users)
      .where(and(
        eq(users.role, 'student'),
        sql`student_id LIKE ${prefix + '%'}`
      ))
      .orderBy(desc(users.studentId))
      .limit(1);

    let nextNumber = 1;
    if (lastStudent && lastStudent.studentId) {
      const lastNumber = parseInt(lastStudent.studentId.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  async authenticateStudent(studentId: string, batchCode: string, password: string): Promise<User | null> {
    // First get the batch by code
    const [batch] = await db
      .select()
      .from(batches)
      .where(eq(batches.batchCode, batchCode));
    
    if (!batch) {
      return null; // Invalid batch code
    }

    // Get the student by studentId and batchId
    const [student] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.studentId, studentId),
        eq(users.batchId, batch.id),
        eq(users.role, 'student'),
        eq(users.isActive, true)
      ));

    if (!student) {
      return null; // Student not found in this batch
    }

    // Check student's individual password first, fallback to batch password if no individual password set
    const isPasswordValid = 
      (student.studentPassword && student.studentPassword === password) ||
      (!student.studentPassword && batch.password === password);
    
    if (!isPasswordValid) {
      return null; // Wrong password
    }

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, student.id));

    return student;
  }

  // Batch management operations
  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [newBatch] = await db.insert(batches).values(batch).returning();
    return newBatch;
  }

  async getAllBatches(): Promise<Batch[]> {
    return await db.select().from(batches)
      .where(eq(batches.status, 'active'))
      .orderBy(asc(batches.name));
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }

  async getBatchByCode(batchCode: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.batchCode, batchCode));
    return batch;
  }

  async updateBatch(id: string, data: Partial<InsertBatch>): Promise<Batch> {
    const [updatedBatch] = await db
      .update(batches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(batches.id, id))
      .returning();
    return updatedBatch;
  }

  async deleteBatch(id: string): Promise<void> {
    // Hard delete - completely remove from database
    await db.delete(batches).where(eq(batches.id, id));
  }

  // SMS operations
  async createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog> {
    const [newSmsLog] = await db.insert(smsLogs).values(smsLog).returning();
    return newSmsLog;
  }

  async getSmsLogs(userId?: string): Promise<SmsLog[]> {
    if (userId) {
      return await db.select().from(smsLogs)
        .where(eq(smsLogs.sentBy, userId))
        .orderBy(desc(smsLogs.sentAt));
    }
    
    return await db.select().from(smsLogs)
      .orderBy(desc(smsLogs.sentAt));
  }

  async getSmsUsageStats(userId: string): Promise<{
    totalSent: number;
    totalCost: number;
    thisMonth: number;
    thisMonthCost: number;
    smsByType: Array<{ type: string; count: number; cost: number }>;
    recentLogs: SmsLog[];
    monthlyStats: Array<{ month: string; count: number; cost: number }>;
  }> {
    const logs = await db.select().from(smsLogs)
      .where(eq(smsLogs.sentBy, userId))
      .orderBy(desc(smsLogs.sentAt));

    const totalSent = logs.length;
    const totalCost = logs.reduce((sum: any, log: any) => sum + (log.costPaisa || 39), 0);

    // Calculate current month data
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const thisMonthLogs = logs.filter((log: any) => {
      const date = new Date(log.sentAt || log.createdAt || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === currentMonthKey;
    });
    
    const thisMonth = thisMonthLogs.length;
    const thisMonthCost = thisMonthLogs.reduce((sum: any, log: any) => sum + (log.costPaisa || 39), 0);

    // Group by SMS type
    const typeGroups = logs.reduce((acc: any, log: any) => {
      const type = log.smsType || 'general';
      if (!acc[type]) {
        acc[type] = { count: 0, cost: 0 };
      }
      acc[type].count++;
      acc[type].cost += log.costPaisa || 39;
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    const smsByType = Object.entries(typeGroups).map(([type, stats]: any) => ({
      type,
      count: (stats as any).count,
      cost: (stats as any).cost
    }));

    // Group by month for the last 6 months
    const monthlyGroups = logs.reduce((acc: any, log: any) => {
      const date = new Date(log.sentAt || log.createdAt || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, cost: 0 };
      }
      acc[monthKey].count++;
      acc[monthKey].cost += log.costPaisa || 39;
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    const monthlyStats = Object.entries(monthlyGroups)
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: (stats as any).count,
        cost: (stats as any).cost
      }))
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
      .slice(0, 6);

    const recentLogs = logs.slice(0, 10);

    return {
      totalSent,
      totalCost,
      thisMonth,
      thisMonthCost,
      smsByType,
      recentLogs,
      monthlyStats
    };
  }


  // Activity logging operations
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db.insert(activityLogs).values(activity).returning();
    return newActivity;
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Note sharing operations
  async createNote(noteData: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values({
      ...noteData,
      tags: noteData.tags ? JSON.stringify(noteData.tags) : null,
    }).returning();
    return note;
  }

  async getAllNotes(): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.isPublic, true))
      .orderBy(desc(notes.createdAt));
  }

  async getNotesByStudent(studentId: string): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.studentId, studentId))
      .orderBy(desc(notes.createdAt));
  }

  async getNotesByBatch(batchId: string): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.batchId, batchId), eq(notes.isPublic, true)))
      .orderBy(desc(notes.createdAt));
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async updateNote(id: string, data: Partial<InsertNote>): Promise<Note> {
    const updateData = {
      ...data,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
      updatedAt: new Date(),
    };
    
    const [note] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async incrementNoteViews(id: string): Promise<void> {
    await db
      .update(notes)
      .set({ 
        viewCount: sql`${notes.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(notes.id, id));
  }

  async likeNote(id: string): Promise<void> {
    await db
      .update(notes)
      .set({ 
        likes: sql`${notes.likes} + 1`,
        updatedAt: new Date()
      })
      .where(eq(notes.id, id));
  }

  // Course management operations
  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .orderBy(asc(courses.displayOrder), asc(courses.createdAt));
  }

  async getActiveCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.displayOrder), asc(courses.createdAt));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.update(courses)
      .set({ isActive: false })
      .where(eq(courses.id, id));
  }

  async getCoursesBySubject(subject: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(and(eq(courses.subject, subject as any), eq(courses.isActive, true)))
      .orderBy(asc(courses.displayOrder));
  }

  // Teacher profile operations
  async createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile> {
    const [newProfile] = await db.insert(teacherProfiles).values(profile).returning();
    return newProfile;
  }

  async getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db
      .select()
      .from(teacherProfiles)
      .where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  async getPublicTeacherProfiles(): Promise<TeacherProfile[]> {
    return await db
      .select()
      .from(teacherProfiles)
      .where(eq(teacherProfiles.isPublic, true))
      .orderBy(desc(teacherProfiles.createdAt));
  }

  async updateTeacherProfile(id: string, data: Partial<InsertTeacherProfile>): Promise<TeacherProfile> {
    const [updatedProfile] = await db
      .update(teacherProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teacherProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  async deleteTeacherProfile(id: string): Promise<void> {
    await db.delete(teacherProfiles).where(eq(teacherProfiles.id, id));
  }

  // Praggo AI Key operations
  async getAllPraggoAIKeys(): Promise<PraggoAIKey[]> {
    return await db.select().from(praggoAIKeys).orderBy(praggoAIKeys.keyIndex);
  }

  async getPraggoAIKeyByName(keyName: string): Promise<PraggoAIKey | undefined> {
    const [key] = await db.select().from(praggoAIKeys).where(eq(praggoAIKeys.keyName, keyName));
    return key;
  }

  async upsertPraggoAIKey(keyName: string, keyValue: string, keyIndex: number, isEnabled: boolean = true): Promise<PraggoAIKey> {
    const [key] = await db
      .insert(praggoAIKeys)
      .values({
        keyName,
        keyValue,
        keyIndex,
        isEnabled,
        status: 'active',
        dailyUsageCount: 0,
      })
      .onConflictDoUpdate({
        target: praggoAIKeys.keyName,
        set: {
          keyValue,
          keyIndex,
          isEnabled,
          updatedAt: new Date(),
        },
      })
      .returning();
    return key;
  }

  async updatePraggoAIKeyStatus(
    keyName: string, 
    status: 'active' | 'quota_exceeded' | 'error' | 'disabled', 
    lastError?: string
  ): Promise<PraggoAIKey> {
    const [key] = await db
      .update(praggoAIKeys)
      .set({
        status,
        lastError,
        lastUsed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(praggoAIKeys.keyName, keyName))
      .returning();
    return key;
  }

  async getActivePraggoAIKeys(): Promise<PraggoAIKey[]> {
    return await db
      .select()
      .from(praggoAIKeys)
      .where(and(eq(praggoAIKeys.isEnabled, true), eq(praggoAIKeys.status, 'active')))
      .orderBy(praggoAIKeys.keyIndex);
  }

  async getRecentSmsLogs(userId: string, limit: number = 50): Promise<SmsLog[]> {
    return await db
      .select()
      .from(smsLogs)
      .where(eq(smsLogs.sentBy, userId))
      .orderBy(desc(smsLogs.sentAt))
      .limit(limit);
  }

  async getBatch(batchId: string): Promise<Batch | undefined> {
    const batchData = await db
      .select()
      .from(batches)
      .where(eq(batches.id, batchId))
      .limit(1);
    return batchData[0];
  }


  // Question Bank operations
  async getQuestionBankCategories(): Promise<QuestionBankCategory[]> {
    return await db
      .select()
      .from(questionBankCategories)
      .where(eq(questionBankCategories.isActive, true))
      .orderBy(questionBankCategories.classLevel, questionBankCategories.subject, questionBankCategories.category);
  }

  async getQuestionBankCategoriesByFilter(classLevel: string, subject: string, paper?: string): Promise<QuestionBankCategory[]> {
    const conditions = [
      eq(questionBankCategories.isActive, true),
      eq(questionBankCategories.classLevel, classLevel as any),
      eq(questionBankCategories.subject, subject as any)
    ];
    
    if (paper) {
      conditions.push(eq(questionBankCategories.paper, paper as any));
    }

    return await db
      .select()
      .from(questionBankCategories)
      .where(and(...conditions))
      .orderBy(questionBankCategories.category);
  }

  async createQuestionBankCategory(categoryData: InsertQuestionBankCategory): Promise<QuestionBankCategory> {
    const [category] = await db
      .insert(questionBankCategories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateQuestionBankCategory(id: string, updates: Partial<InsertQuestionBankCategory>): Promise<QuestionBankCategory> {
    const [category] = await db
      .update(questionBankCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(questionBankCategories.id, id))
      .returning();
    return category;
  }

  async deleteQuestionBankCategory(id: string): Promise<void> {
    await db.delete(questionBankCategories).where(eq(questionBankCategories.id, id));
  }

  async getQuestionBankItems(categoryId: string): Promise<QuestionBankItem[]> {
    return await db
      .select()
      .from(questionBankItems)
      .where(and(eq(questionBankItems.categoryId, categoryId), eq(questionBankItems.isActive, true)))
      .orderBy(questionBankItems.order, questionBankItems.chapter, questionBankItems.createdAt);
  }

  async getQuestionBankItemsByChapter(categoryId: string, chapter: string): Promise<QuestionBankItem[]> {
    return await db
      .select()
      .from(questionBankItems)
      .where(and(
        eq(questionBankItems.categoryId, categoryId),
        eq(questionBankItems.chapter, chapter),
        eq(questionBankItems.isActive, true)
      ))
      .orderBy(questionBankItems.order, questionBankItems.createdAt);
  }

  async createQuestionBankItem(itemData: InsertQuestionBankItem): Promise<QuestionBankItem> {
    const [item] = await db
      .insert(questionBankItems)
      .values(itemData)
      .returning();
    return item;
  }

  async updateQuestionBankItem(id: string, updates: Partial<InsertQuestionBankItem>): Promise<QuestionBankItem> {
    const [item] = await db
      .update(questionBankItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(questionBankItems.id, id))
      .returning();
    return item;
  }

  async deleteQuestionBankItem(id: string): Promise<void> {
    await db.delete(questionBankItems).where(eq(questionBankItems.id, id));
  }

  async incrementDownloadCount(itemId: string): Promise<void> {
    await db
      .update(questionBankItems)
      .set({ 
        downloadCount: sql`${questionBankItems.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(questionBankItems.id, itemId));
  }




  // Super User operations implementation
  async changeTeacherPassword(teacherId: string, newPassword: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, teacherId))
      .returning();
    return updatedUser;
  }

  async addSmsCredits(teacherId: string, credits: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        smsCredits: sql`COALESCE(${users.smsCredits}, 0) + ${credits}`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, teacherId))
      .returning();
    return updatedUser;
  }

  async getUserSmsCredits(userId: string): Promise<number> {
    const [user] = await db
      .select({ smsCredits: users.smsCredits })
      .from(users)
      .where(eq(users.id, userId));
    return user?.smsCredits || 0;
  }

  async deductSmsCredits(userId: string, credits: number): Promise<boolean> {
    const currentCredits = await this.getUserSmsCredits(userId);
    
    if (currentCredits < credits) {
      return false; // Insufficient credits
    }

    await db
      .update(users)
      .set({ 
        smsCredits: sql`${users.smsCredits} - ${credits}`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
    
    return true; // Successfully deducted
  }

  async getAllTeachers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'teacher'))
      .orderBy(asc(users.firstName));
  }

  async getUsersByRole(role: 'student' | 'teacher' | 'superUser'): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .orderBy(asc(users.firstName));
  }

  // Monthly Results operations
  async getMonthlyResults(year: number, month: number, batchIds?: string[]): Promise<any[]> {
    try {
      let query = db
        .select()
        .from(monthlyResults)
        .where(and(
          eq(monthlyResults.year, year),
          eq(monthlyResults.month, month)
        ));

      if (batchIds && batchIds.length > 0) {
        query = query.where(inArray(monthlyResults.batchId, batchIds)) as any;
      }

      return await query.orderBy(asc(monthlyResults.batchId), asc(monthlyResults.classRank));
    } catch (error) {
      console.error('Error fetching monthly results:', error);
      throw error;
    }
  }

  async markMonthlyResultSMSSent(monthlyResultId: string): Promise<void> {
    try {
      await db
        .update(monthlyResults)
        .set({ 
          smsNotificationSent: true,
          updatedAt: new Date()
        })
        .where(eq(monthlyResults.id, monthlyResultId));
    } catch (error) {
      console.error('Error marking monthly result SMS as sent:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
