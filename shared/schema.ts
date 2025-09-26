import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  serial,
  decimal,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User role enum
export const userRoleEnum = pgEnum('user_role', ['teacher', 'student', 'super_user']);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'cancelled']);

// Academic Calendar - Daily calendar management for attendance tracking
export const academicCalendar = pgTable("academic_calendar", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(), // Specific date (YYYY-MM-DD)
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  isWorkingDay: boolean("is_working_day").notNull().default(true), // Working day or holiday
  dayType: varchar("day_type").default('regular'), // regular, holiday, exam_day, etc.
  notes: text("notes"), // Optional notes for the day (holiday reason, etc.)
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly calendar summary for quick calculations
export const monthlyCalendarSummary = pgTable("monthly_calendar_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  totalDays: integer("total_days").notNull(), // Total days in month
  workingDays: integer("working_days").notNull(), // Calculated working days
  holidays: integer("holidays").notNull().default(0), // Holiday count
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subject enum - Re-aligned to NCTB core subjects (science, math)
// NOTE: Previously used subjects included 'chemistry' and 'ict'. These are now mapped to 'science'.
export const subjectEnum = pgEnum('subject', ['science', 'math']);

// Attendance status enum for three-state system
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",    // Full attendance credit (20%) + bonus credit (10%)
  "excused",    // No attendance credit but gets bonus credit (10%) 
  "absent"      // No credit for attendance or bonus (0%)
]);

// SMS type enum
export const smsTypeEnum = pgEnum('sms_type', ['attendance', 'exam_result', 'exam_notification', 'notice', 'reminder']);

// SMS template system enums
export const triggerTypeEnum = pgEnum('trigger_type', ['monthly_exam', 'attendance_reminder', 'exam_notification', 'custom_schedule']);
export const targetAudienceEnum = pgEnum('target_audience', ['students', 'parents', 'both']);
export const executionStatusEnum = pgEnum('execution_status', ['pending', 'in_progress', 'completed', 'failed']);

// Note type enum for note sharing feature
export const noteTypeEnum = pgEnum('note_type', ['pdf', 'google_drive', 'link', 'text']);

// Praggo AI API key status enum
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'quota_exceeded', 'error', 'disabled']);

// Grading scheme table for dynamic grading system
export const gradingSchemes = pgTable("grading_schemes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Bangladesh NCTB Standard", "International IB"
  description: text("description"),
  gradeRanges: jsonb("grade_ranges").notNull(), // Array of grade objects with letter, minPercent, maxPercent, gpa, color
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Batch status enum
export const batchStatusEnum = pgEnum('batch_status', ['active', 'inactive', 'completed']);

// Batches table (declare first to avoid circular dependency)
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: subjectEnum("subject").notNull(),
  batchCode: varchar("batch_code").notNull().unique(),
  password: varchar("password").notNull(), // Students use this to login
  maxStudents: integer("max_students").default(50),
  currentStudents: integer("current_students").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  classTime: varchar("class_time"), // e.g., "10:00 AM - 12:00 PM"
  classDays: text("class_days"), // JSON array of days ["Monday", "Wednesday", "Friday"]
  schedule: text("schedule"), // JSON string with class schedule
  status: batchStatusEnum("status").notNull().default('active'),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table for real coaching center
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"), // Added username field to match database
  password: varchar("password"), // General password field for authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('student'),
  
  // Teacher/Super User specific fields
  email: varchar("email"),
  smsCredits: integer("sms_credits").default(0), // SMS balance for teachers
  
  // Student-specific fields
  studentId: varchar("student_id"),
  phoneNumber: varchar("phone_number"),
  parentPhoneNumber: varchar("parent_phone_number"),
  studentPassword: varchar("student_password"), // Password managed by teacher
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender"),
  institution: varchar("institution"), // School/College name
  classLevel: varchar("class_level"), // Class 9, 10, 11, 12, etc.
  batchId: varchar("batch_id"),
  admissionDate: timestamp("admission_date"), // Date when student was admitted to the batch
  
  // Authentication
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exams table
export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  subject: subjectEnum("subject").notNull(), // Science or Math
  chapter: varchar("chapter"), // Chapter name (optional)
  targetClass: varchar("target_class"), // 6, 7, 8, 9, 10
  description: text("description"),
  instructions: text("instructions"),
  examDate: timestamp("exam_date"), // Optional for regular exams
  duration: integer("duration").notNull(), // in minutes
  examType: varchar("exam_type").notNull(), // mcq, written, mixed
  examMode: varchar("exam_mode").notNull(), // online, offline (regular)
  batchId: varchar("batch_id").references(() => batches.id),
  targetStudents: jsonb("target_students"), // Array of student IDs for specific targeting
  questionSource: varchar("question_source"), // drive_link, file_upload (for online exams)
  questionContent: text("question_content"), // Google Drive link or base64 file data (for online exams)
  questionPaperImage: text("question_paper_image"), // Base64 image data for regular exams
  totalMarks: integer("total_marks").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type").notNull(), // mcq, written
  options: jsonb("options"), // for MCQ questions
  correctAnswer: varchar("correct_answer"), // for MCQ questions
  questionImage: text("question_image"), // Image URL or file path
  driveLink: text("drive_link"), // Google Drive link or other resource links
  marks: integer("marks").notNull().default(1),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Question Bank for shared questions (not tied to specific exams)
export const questionBank = pgTable("question_bank", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar("subject").notNull(), // Science or Math (legacy chemistry/ict mapped at input layer)
  category: varchar("category").notNull(), // Academic or Admission
  subCategory: varchar("sub_category").notNull(), // Board/Test Paper for Academic, Admission for Admission  
  chapter: varchar("chapter").notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type").notNull(), // mcq, written
  options: jsonb("options"), // for MCQ questions
  correctAnswer: varchar("correct_answer"), // for MCQ questions
  questionImage: text("question_image"), // Image URL or file path
  driveLink: text("drive_link"), // Google Drive link or other resource links
  difficulty: varchar("difficulty").notNull().default('medium'), // easy, medium, hard
  marks: integer("marks").notNull().default(1),
  isPublic: boolean("is_public").notNull().default(true), // Available to all students
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam submissions table
export const examSubmissions = pgTable("exam_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id),
  answers: jsonb("answers"), // For online exams
  score: integer("score"),
  manualMarks: integer("manual_marks"), // For offline exams - manually entered marks
  totalMarks: integer("total_marks"),
  percentage: integer("percentage"), // Score percentage
  rank: integer("rank"), // Student rank in this exam
  isSubmitted: boolean("is_submitted").default(false),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // in minutes
  feedback: text("feedback"), // Teacher feedback for offline exams
  createdAt: timestamp("created_at").defaultNow(),
});

// Online exam questions table (separate from regular questions for better management)
export const onlineExamQuestions = pgTable("online_exam_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(), 
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: varchar("correct_answer").notNull(), // A, B, C, or D
  explanation: text("explanation"), // Explanation for the correct answer
  marks: integer("marks").notNull().default(1),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notices table
export const notices = pgTable("notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance table - updated for daily calendar-based tracking
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  date: timestamp("date").notNull(), // YYYY-MM-DD date
  calendarId: varchar("calendar_id").references(() => academicCalendar.id), // Link to academic calendar
  attendanceStatus: attendanceStatusEnum("attendance_status").notNull().default("present"), // present, excused, absent
  subject: subjectEnum("subject"), // Optional - which subject class
  notes: text("notes"), // Optional notes about attendance
  markedBy: varchar("marked_by").notNull().references(() => users.id), // Teacher who marked attendance
  markedAt: timestamp("marked_at").defaultNow(), // When attendance was marked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS logs table
export const smsLogs = pgTable("sms_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientType: varchar("recipient_type").notNull(), // 'student' or 'parent'
  recipientPhone: varchar("recipient_phone").notNull(),
  recipientName: varchar("recipient_name"),
  studentId: varchar("student_id").references(() => users.id), // If SMS is about a student
  smsType: smsTypeEnum("sms_type").notNull(),
  subject: varchar("subject"), // Subject related to SMS
  message: text("message").notNull(),
  status: varchar("status").notNull().default('sent'), // sent, delivered, failed
  credits: integer("credits").default(1), // Credits used for this SMS
  costPaisa: integer("cost_paisa").default(39), // Cost in paisa (0.39 Tk = 39 paisa)
  sentBy: varchar("sent_by").notNull().references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS transactions table
export const smsTransactions = pgTable("sms_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  packageName: varchar("package_name").notNull(),
  smsCount: integer("sms_count").notNull(),
  price: integer("price").notNull(), // in paisa (1 taka = 100 paisa)
  paymentMethod: varchar("payment_method").notNull(), // bkash, nagad, rocket, bank
  transactionId: varchar("transaction_id"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('pending'),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity logs table - tracks real system activities
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // student_joined, exam_created, message_sent, login, etc.
  message: text("message").notNull(),
  icon: varchar("icon"), // emoji or icon identifier
  userId: varchar("user_id").references(() => users.id), // Who performed the action
  relatedUserId: varchar("related_user_id").references(() => users.id), // Who the action affects
  relatedEntityId: varchar("related_entity_id"), // ID of exam, batch, etc.
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

// Notes sharing table - Students can share notes with PDF links or Google Drive links
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  noteType: noteTypeEnum("note_type").notNull(),
  fileUrl: text("file_url"), // PDF direct link, Google Drive link, or any other link
  subject: subjectEnum("subject").notNull(),
  tags: text("tags"), // JSON array of tags for easy filtering
  studentId: varchar("student_id").notNull().references(() => users.id),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  isPublic: boolean("is_public").default(true), // Whether teachers can see this note
  viewCount: integer("view_count").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table for landing page course management
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(), // e.g., "রসায়ন (নবম-দশম)"
  titleBangla: varchar("title_bangla").notNull(), // Bengali title
  description: text("description").notNull(), // Course description
  subject: subjectEnum("subject").notNull(),
  targetClass: varchar("target_class").notNull(), // e.g., "6", "7", "8", "9", "10"
  iconName: varchar("icon_name").notNull().default('FlaskConical'), // Lucide icon name
  colorScheme: varchar("color_scheme").notNull(), // e.g., "cyan", "purple", "green", "yellow"
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0), // For ordering on landing page
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher profiles table for teacher profile management
export const teacherProfiles = pgTable("teacher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  displayName: varchar("display_name").notNull(), // e.g., "Belal Sir"
  education: text("education"), // e.g., "Graduate from Rajshahi University"
  currentPosition: text("current_position"), // e.g., "Teacher at Jahangirpur Girls School and College"
  specialization: text("specialization"), // e.g., "Specialist in Science & Math"
  motto: text("motto"), // e.g., "Dedicated to Excellence in Education"
  bio: text("bio"), // Detailed biography/description
  avatarUrl: text("avatar_url"), // Profile picture URL
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  socialLinks: jsonb("social_links"), // JSON object with social media links
  yearsOfExperience: integer("years_of_experience"),
  isPublic: boolean("is_public").default(true), // Whether to show on landing page
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  batch: one(batches, {
    fields: [users.batchId],
    references: [batches.id],
  }),
  createdBatches: many(batches),
  createdExams: many(exams),
  submissions: many(examSubmissions),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  createdNotices: many(notices),
  attendanceRecords: many(attendance),
  smsTransactions: many(smsTransactions),
  smsLogs: many(smsLogs),
  smsTemplates: many(smsTemplates),
  smsAutomationRules: many(smsAutomationRules),
  sharedNotes: many(notes),
  questionBankEntries: many(questionBank),
  studentFees: many(studentFees, { relationName: "studentFees" }),
  collectedFees: many(studentFees, { relationName: "collectedFees" }),
  feePayments: many(feePayments),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  creator: one(users, {
    fields: [batches.createdBy],
    references: [users.id],
  }),
  students: many(users),
  attendanceRecords: many(attendance),
  notes: many(notes),
  smsAutomationRules: many(smsAutomationRules),
  studentFees: many(studentFees),
  feeSettings: many(batchFeeSettings),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  creator: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  questions: many(questions),
  submissions: many(examSubmissions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
}));

export const questionBankRelations = relations(questionBank, ({ one }) => ({
  teacher: one(users, {
    fields: [questionBank.teacherId],
    references: [users.id],
  }),
}));

export const examSubmissionsRelations = relations(examSubmissions, ({ one }) => ({
  exam: one(exams, {
    fields: [examSubmissions.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examSubmissions.studentId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  creator: one(users, {
    fields: [notices.createdBy],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [attendance.batchId],
    references: [batches.id],
  }),
  markedBy: one(users, {
    fields: [attendance.markedBy],
    references: [users.id],
  }),
}));

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  student: one(users, {
    fields: [smsLogs.studentId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [smsLogs.sentBy],
    references: [users.id],
  }),
}));

export const smsTransactionsRelations = relations(smsTransactions, ({ one }) => ({
  user: one(users, {
    fields: [smsTransactions.userId],
    references: [users.id],
  }),
}));





// SMS Templates System
export const smsTemplates = pgTable("sms_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: smsTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  template: text("template").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const smsTemplateVariables = pgTable("sms_template_variables", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => smsTemplates.id, { onDelete: "cascade" }).notNull(),
  variableName: varchar("variable_name", { length: 50 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true).notNull(),
  defaultValue: text("default_value"),
});

export const smsAutomationRules = pgTable("sms_automation_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  templateId: integer("template_id").references(() => smsTemplates.id).notNull(),
  triggerType: triggerTypeEnum("trigger_type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  targetAudience: targetAudienceEnum("target_audience").notNull(),
  batchId: varchar("batch_id").references(() => batches.id),
  scheduleDay: integer("schedule_day"), // Day of month for monthly automation (1-31)
  scheduleTime: time("schedule_time"), // Time of day to send
  lastExecuted: timestamp("last_executed"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const smsAutomationExecutions = pgTable("sms_automation_executions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").references(() => smsAutomationRules.id, { onDelete: "cascade" }).notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  recipientCount: integer("recipient_count").notNull(),
  successCount: integer("success_count").notNull(),
  failedCount: integer("failed_count").notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 4 }),
  status: executionStatusEnum("execution_status").notNull(),
  errorMessage: text("error_message"),
});

// SMS Template Relations
export const smsTemplatesRelations = relations(smsTemplates, ({ one, many }) => ({
  creator: one(users, {
    fields: [smsTemplates.createdBy],
    references: [users.id],
  }),
  variables: many(smsTemplateVariables),
  automationRules: many(smsAutomationRules),
}));

export const smsTemplateVariablesRelations = relations(smsTemplateVariables, ({ one }) => ({
  template: one(smsTemplates, {
    fields: [smsTemplateVariables.templateId],
    references: [smsTemplates.id],
  }),
}));

export const smsAutomationRulesRelations = relations(smsAutomationRules, ({ one, many }) => ({
  template: one(smsTemplates, {
    fields: [smsAutomationRules.templateId],
    references: [smsTemplates.id],
  }),
  batch: one(batches, {
    fields: [smsAutomationRules.batchId],
    references: [batches.id],
  }),
  creator: one(users, {
    fields: [smsAutomationRules.createdBy],
    references: [users.id],
  }),
  executions: many(smsAutomationExecutions),
}));

export const smsAutomationExecutionsRelations = relations(smsAutomationExecutions, ({ one }) => ({
  rule: one(smsAutomationRules, {
    fields: [smsAutomationExecutions.ruleId],
    references: [smsAutomationRules.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  student: one(users, {
    fields: [notes.studentId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [notes.batchId],
    references: [batches.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [activityLogs.relatedUserId],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one }) => ({
  creator: one(users, {
    fields: [courses.createdBy],
    references: [users.id],
  }),
}));

export const teacherProfilesRelations = relations(teacherProfiles, ({ one }) => ({
  user: one(users, {
    fields: [teacherProfiles.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
}).extend({
  email: z.string().optional().nullable(),
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  currentStudents: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(users).omit({
  id: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.literal('student'),
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Accept new subjects; keep legacy mapping through transform
  subject: z.string().transform((val) => normalizeLegacySubject(val)),
  examMode: z.enum(['online', 'offline']).default('online'),
  questionSource: z.enum(['drive_link', 'file_upload']).default('drive_link'),
  examDate: z.string().transform((str) => new Date(str)),
  targetStudents: z.array(z.string()).nullable().optional(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(examSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertOnlineExamQuestionSchema = createInsertSchema(onlineExamQuestions).omit({
  id: true,
  createdAt: true,
}).extend({
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertSmsTransactionSchema = createInsertSchema(smsTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotesSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tags: z.array(z.string()).optional(),
});

export const insertQuestionBankSchema = createInsertSchema(questionBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  subject: z.string().transform((val) => normalizeLegacySubject(val)),
  category: z.enum(['Academic', 'Admission']),
  subCategory: z.enum(['Board', 'Test Paper', 'Admission']),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  options: z.record(z.string()).nullable().optional(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  socialLinks: z.record(z.string()).nullable().optional(),
});

// Praggo AI API Keys table for rotation and usage tracking
export const praggoAIKeys = pgTable("praggo_ai_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyName: varchar("key_name").notNull().unique(), // GEMINI_API_KEY, GEMINI_API_KEY_2, etc.
  keyValue: text("key_value").notNull(), // The actual API key value
  keyIndex: integer("key_index").notNull().unique(), // 0, 1, 2, 3, 4, 5, 6
  status: apiKeyStatusEnum("status").notNull().default('active'),
  dailyUsageCount: integer("daily_usage_count").default(0),
  lastUsed: timestamp("last_used"),
  lastError: text("last_error"),
  quotaResetDate: timestamp("quota_reset_date"),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Praggo AI Usage Logs for tracking API usage
export const praggoAIUsage = pgTable("praggo_ai_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  userRole: userRoleEnum("user_role").notNull(), // teacher or student
  requestType: varchar("request_type").notNull(), // generate_questions, solve_doubt
  keyUsed: varchar("key_used").notNull().references(() => praggoAIKeys.keyName),
  subject: subjectEnum("subject").notNull(),
  promptLength: integer("prompt_length"),
  responseLength: integer("response_length"),
  success: boolean("success").notNull().default(false),
  errorMessage: text("error_message"),
  processingTime: integer("processing_time"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Question Bank System - NCTB Based Structure
export const classLevelEnum = pgEnum('class_level', ['6', '7', '8', '9', '10']);
export const paperEnum = pgEnum('paper', ['১ম পত্র', '২য় পত্র']);
export const questionBankCategoryEnum = pgEnum('question_bank_category', [
  'board_questions', 
  'test_paper', 
  'ndc_admission', 
  'holy_cross_admission',
  'board_book_questions',
  'general_university',
  'engineering_university', 
  'medical_university'
]);
export const resourceTypeEnum = pgEnum('resource_type', ['pdf', 'google_drive', 'link', 'text']);

// Question Bank Categories Table
export const questionBankCategories = pgTable("question_bank_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  classLevel: classLevelEnum("class_level").notNull(),
  subject: subjectEnum("subject").notNull(),
  paper: paperEnum("paper"), // Only for 11-12, null for 9-10
  category: questionBankCategoryEnum("category").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Question Bank Items Table
export const questionBankItems = pgTable("question_bank_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => questionBankCategories.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  chapter: varchar("chapter").notNull(), // Bengali chapter name
  description: text("description"),
  resourceType: resourceTypeEnum("resource_type").notNull(),
  resourceUrl: text("resource_url"), // Google Drive link or other URL
  content: text("content"), // For text-based content
  fileSize: varchar("file_size"), // For PDF files
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0), // For sorting
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Praggo AI tables
export const insertPraggoAIKeySchema = createInsertSchema(praggoAIKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPraggoAIUsageSchema = createInsertSchema(praggoAIUsage).omit({
  id: true,
  createdAt: true,
});

// ============================
// Legacy Subject Normalization
// ============================
// Maps old subject identifiers to the new enum values.
export function normalizeLegacySubject(value: string): 'science' | 'math' {
  const lowered = value.toLowerCase();
  if (lowered === 'chemistry' || lowered === 'ict' || lowered === 'general_science') return 'science';
  if (lowered === 'general_math' || lowered === 'higher_math' || lowered === 'math' || lowered === 'mathematics') return 'math';
  // Default fallback
  if (lowered === 'science') return 'science';
  return 'math';
}

// Question Bank Schema Validations
export const insertQuestionBankCategorySchema = createInsertSchema(questionBankCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionBankItemSchema = createInsertSchema(questionBankItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================
// MONTHLY RESULTS SYSTEM
// ============================

// Monthly Results - stores calculated monthly results for each student
export const monthlyResults = pgTable("monthly_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  classLevel: varchar("class_level").notNull(), // 6, 7, 8, 9, 10
  
  // Exam Performance
  examAverage: integer("exam_average").default(0), // Percentage (0-100)
  totalExams: integer("total_exams").default(0),
  
  // Attendance Performance  
  presentDays: integer("present_days").default(0),
  absentDays: integer("absent_days").default(0),
  excusedDays: integer("excused_days").default(0),
  workingDays: integer("working_days").notNull(),
  attendancePercentage: integer("attendance_percentage").default(0), // 0-100
  
  // Bonus Calculation
  bonusMarks: integer("bonus_marks").default(0), // 30 - working_days
  
  // Final Results
  finalScore: integer("final_score").default(0), // Weighted final score (0-100)
  classRank: integer("class_rank").default(0),
  totalStudents: integer("total_students").default(0),
  
  // SMS Status
  smsNotificationSent: boolean("sms_notification_sent").default(false),
  
  // Timestamps
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly Exam Records - links exams to monthly calculations
export const monthlyExamRecords = pgTable("monthly_exam_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthlyResultId: varchar("monthly_result_id").notNull().references(() => monthlyResults.id, { onDelete: 'cascade' }),
  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  marksObtained: integer("marks_obtained").default(0),
  totalMarks: integer("total_marks").notNull(),
  percentage: integer("percentage").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

// Top Performers - cached monthly rankings for homepage display
export const topPerformers = pgTable("top_performers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  classLevel: varchar("class_level").notNull(),
  rank: integer("rank").notNull(), // 1-5 for top 5
  finalScore: integer("final_score").notNull(),
  studentName: varchar("student_name").notNull(),
  studentPhoto: text("student_photo"), // Base64 or URL
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for monthly results
export const insertAcademicCalendarSchema = createInsertSchema(academicCalendar).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyResultSchema = createInsertSchema(monthlyResults).omit({
  id: true,
  generatedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyExamRecordSchema = createInsertSchema(monthlyExamRecords).omit({
  id: true,
  createdAt: true,
});

export const insertTopPerformerSchema = createInsertSchema(topPerformers).omit({
  id: true,
  createdAt: true,
});

// Monthly Calendar Summary Zod schema
export const insertMonthlyCalendarSummarySchema = createInsertSchema(monthlyCalendarSummary).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type ExamSubmission = typeof examSubmissions.$inferSelect;
export type InsertOnlineExamQuestion = z.infer<typeof insertOnlineExamQuestionSchema>;
export type OnlineExamQuestion = typeof onlineExamQuestions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof notices.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertSmsTransaction = z.infer<typeof insertSmsTransactionSchema>;
export type SmsTransaction = typeof smsTransactions.$inferSelect;
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogs.$inferSelect;

// Question Bank Types
export type InsertQuestionBankCategory = z.infer<typeof insertQuestionBankCategorySchema>;
export type QuestionBankCategory = typeof questionBankCategories.$inferSelect;
export type InsertQuestionBankItem = z.infer<typeof insertQuestionBankItemSchema>;
export type QuestionBankItem = typeof questionBankItems.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertNote = z.infer<typeof insertNotesSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type QuestionBank = typeof questionBank.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertPraggoAIKey = z.infer<typeof insertPraggoAIKeySchema>;
export type PraggoAIKey = typeof praggoAIKeys.$inferSelect;
export type InsertPraggoAIUsage = z.infer<typeof insertPraggoAIUsageSchema>;
export type PraggoAIUsage = typeof praggoAIUsage.$inferSelect;

// Monthly Results Types
export type InsertAcademicCalendar = z.infer<typeof insertAcademicCalendarSchema>;
export type AcademicCalendar = typeof academicCalendar.$inferSelect;
export type InsertMonthlyResult = z.infer<typeof insertMonthlyResultSchema>;
export type MonthlyResult = typeof monthlyResults.$inferSelect;
export type InsertMonthlyExamRecord = z.infer<typeof insertMonthlyExamRecordSchema>;
export type MonthlyExamRecord = typeof monthlyExamRecords.$inferSelect;
// Fee Collection Tables
export const studentFees = pgTable("student_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  month: varchar("month").notNull(), // e.g. '2025-01'
  amount: integer("amount").notNull(),
  amountPaid: integer("amount_paid").notNull().default(0),
  status: varchar("status").notNull().default('unpaid'), // paid, unpaid, partial
  dueDate: timestamp("due_date").notNull(),
  remarks: text("remarks"),
  collectedBy: varchar("collected_by").references(() => users.id), // teacher/admin
  collectedAt: timestamp("collected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fee Payments Table - for tracking individual payment transactions
export const feePayments = pgTable("fee_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feeId: varchar("fee_id").notNull().references(() => studentFees.id),
  amount: integer("amount").notNull(),
  paymentMethod: varchar("payment_method").notNull().default('cash'), // cash, bank, online
  transactionId: varchar("transaction_id"), // for bank/online payments
  collectedBy: varchar("collected_by").notNull().references(() => users.id),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Batch Fee Settings Table - for setting monthly fees per batch
export const batchFeeSettings = pgTable("batch_fee_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  monthlyFee: integer("monthly_fee").notNull(),
  admissionFee: integer("admission_fee").default(0),
  examFee: integer("exam_fee").default(0),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fee collection schemas
export const insertStudentFeeSchema = createInsertSchema(studentFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({
  id: true,
  createdAt: true,
});

export const insertBatchFeeSettingSchema = createInsertSchema(batchFeeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Fee collection types
export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;
export type StudentFee = typeof studentFees.$inferSelect;
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type FeePayment = typeof feePayments.$inferSelect;
export type InsertBatchFeeSetting = z.infer<typeof insertBatchFeeSettingSchema>;
export type BatchFeeSetting = typeof batchFeeSettings.$inferSelect;
export type InsertTopPerformer = z.infer<typeof insertTopPerformerSchema>;
export type TopPerformer = typeof topPerformers.$inferSelect;
export type InsertMonthlyCalendarSummary = z.infer<typeof insertMonthlyCalendarSummarySchema>;
export type MonthlyCalendarSummary = typeof monthlyCalendarSummary.$inferSelect;

// Fee Collection Relations
export const studentFeesRelations = relations(studentFees, ({ one, many }) => ({
  student: one(users, {
    fields: [studentFees.studentId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [studentFees.batchId],
    references: [batches.id],
  }),
  collector: one(users, {
    fields: [studentFees.collectedBy],
    references: [users.id],
  }),
  payments: many(feePayments),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  fee: one(studentFees, {
    fields: [feePayments.feeId],
    references: [studentFees.id],
  }),
  collector: one(users, {
    fields: [feePayments.collectedBy],
    references: [users.id],
  }),
}));

export const batchFeeSettingsRelations = relations(batchFeeSettings, ({ one }) => ({
  batch: one(batches, {
    fields: [batchFeeSettings.batchId],
    references: [batches.id],
  }),
}));
