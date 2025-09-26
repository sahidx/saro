import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  sqliteTable,
  index,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = sqliteTable(
  "sessions", 
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON stored as text
    expire: integer("expire").notNull(), // Unix timestamp
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  username: text("username"),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("student"), // 'teacher', 'student', 'super_user'
  email: text("email"),
  smsCredits: integer("sms_credits").default(0),
  studentId: text("student_id"),
  phoneNumber: text("phone_number"),
  parentPhoneNumber: text("parent_phone_number"),
  studentPassword: text("student_password"),
  address: text("address"),
  dateOfBirth: integer("date_of_birth"), // Unix timestamp
  gender: text("gender"),
  institution: text("institution"),
  classLevel: text("class_level"),
  batchId: text("batch_id"),
  admissionDate: integer("admission_date"), // Unix timestamp
  isActive: integer("is_active").default(1), // 0 = false, 1 = true
  lastLogin: integer("last_login"), // Unix timestamp
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Batches table
export const batches = sqliteTable("batches", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  subject: text("subject").notNull(), // 'science', 'math'
  batchCode: text("batch_code").notNull().unique(),
  password: text("password").notNull(),
  maxStudents: integer("max_students").default(50),
  currentStudents: integer("current_students").default(0),
  startDate: integer("start_date"), // Unix timestamp
  endDate: integer("end_date"), // Unix timestamp
  classTime: text("class_time"),
  classDays: text("class_days"),
  schedule: text("schedule"),
  status: text("status").default("active"), // 'active', 'inactive', 'completed'
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Exams table
export const exams = sqliteTable("exams", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text("title").notNull(),
  subject: text("subject").notNull(), // 'science', 'math'
  chapter: text("chapter"),
  targetClass: text("target_class"),
  description: text("description"),
  instructions: text("instructions"),
  examDate: integer("exam_date"), // Unix timestamp
  duration: integer("duration").notNull(),
  examType: text("exam_type").notNull(),
  examMode: text("exam_mode").notNull(),
  batchId: text("batch_id"),
  targetStudents: text("target_students"), // JSON stored as text
  questionSource: text("question_source"),
  questionContent: text("question_content"),
  questionPaperImage: text("question_paper_image"),
  totalMarks: integer("total_marks").default(0),
  isActive: integer("is_active").default(1), // 0 = false, 1 = true
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Questions table
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  examId: text("exam_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: text("options"), // JSON stored as text
  correctAnswer: text("correct_answer"),
  questionImage: text("question_image"),
  driveLink: text("drive_link"),
  marks: integer("marks").default(1),
  orderIndex: integer("order_index").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Messages table
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  fromUserId: text("from_user_id").notNull(),
  toUserId: text("to_user_id").notNull(),
  content: text("content").notNull(),
  isRead: integer("is_read").default(0), // 0 = false, 1 = true
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Notices table
export const notices = sqliteTable("notices", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  isActive: integer("is_active").default(1), // 0 = false, 1 = true
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  batches: many(batches, { relationName: "userBatches" }),
  exams: many(exams, { relationName: "userExams" }),
  messagesFrom: many(messages, { relationName: "messagesFrom" }),
  messagesTo: many(messages, { relationName: "messagesTo" }),
  notices: many(notices, { relationName: "userNotices" }),
}));

export const batchesRelations = relations(batches, ({ many, one }) => ({
  creator: one(users, {
    fields: [batches.createdBy],
    references: [users.id],
    relationName: "userBatches"
  }),
  exams: many(exams, { relationName: "batchExams" }),
}));

export const examsRelations = relations(exams, ({ many, one }) => ({
  creator: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
    relationName: "userExams"
  }),
  batch: one(batches, {
    fields: [exams.batchId],
    references: [batches.id],
    relationName: "batchExams"
  }),
  questions: many(questions, { relationName: "examQuestions" }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
    relationName: "examQuestions"
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertBatchSchema = createInsertSchema(batches);
export const insertExamSchema = createInsertSchema(exams);
export const insertQuestionSchema = createInsertSchema(questions);
export const insertMessageSchema = createInsertSchema(messages);
export const insertNoticeSchema = createInsertSchema(notices);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type NewNotice = typeof notices.$inferInsert;