// Schema adapter to use the correct schema based on database type
const isPostgreSQL = process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://');
const isSQLite = process.env.DATABASE_URL?.startsWith('file:');

let schemaModule;

if (isPostgreSQL) {
  schemaModule = await import('@shared/schema');
} else if (isSQLite) {
  schemaModule = await import('@shared/sqlite-schema');
} else {
  throw new Error('Unsupported database type. Please use PostgreSQL or SQLite.');
}

export const {
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
  sessions,
  insertUserSchema,
  insertBatchSchema,
  insertExamSchema,
  insertQuestionSchema,
  insertMessageSchema,
  insertNoticeSchema
} = schemaModule;

export type {
  User,
  NewUser,
  Batch,
  NewBatch,
  Exam,
  NewExam,
  Question,
  NewQuestion,
  Message,
  NewMessage,
  Notice,
  NewNotice
} = schemaModule;