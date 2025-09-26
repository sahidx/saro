CREATE TYPE "public"."api_key_status" AS ENUM('active', 'quota_exceeded', 'error', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'excused', 'absent');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('active', 'inactive', 'completed');--> statement-breakpoint
CREATE TYPE "public"."class_level" AS ENUM('6', '7', '8', '9', '10');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('pdf', 'google_drive', 'link', 'text');--> statement-breakpoint
CREATE TYPE "public"."paper" AS ENUM('১ম পত্র', '২য় পত্র');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."question_bank_category" AS ENUM('board_questions', 'test_paper', 'ndc_admission', 'holy_cross_admission', 'board_book_questions', 'general_university', 'engineering_university', 'medical_university');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('pdf', 'google_drive', 'link', 'text');--> statement-breakpoint
CREATE TYPE "public"."sms_type" AS ENUM('attendance', 'exam_result', 'exam_notification', 'notice', 'reminder');--> statement-breakpoint
CREATE TYPE "public"."subject" AS ENUM('science', 'math');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('teacher', 'student', 'super_user');--> statement-breakpoint
CREATE TABLE "academic_calendar" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_working_day" boolean DEFAULT true NOT NULL,
	"day_type" varchar DEFAULT 'regular',
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"message" text NOT NULL,
	"icon" varchar,
	"user_id" varchar,
	"related_user_id" varchar,
	"related_entity_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"batch_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"calendar_id" varchar,
	"attendance_status" "attendance_status" DEFAULT 'present' NOT NULL,
	"subject" "subject",
	"notes" text,
	"marked_by" varchar NOT NULL,
	"marked_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"subject" "subject" NOT NULL,
	"batch_code" varchar NOT NULL,
	"password" varchar NOT NULL,
	"max_students" integer DEFAULT 50,
	"current_students" integer DEFAULT 0,
	"start_date" timestamp,
	"end_date" timestamp,
	"class_time" varchar,
	"class_days" text,
	"schedule" text,
	"status" "batch_status" DEFAULT 'active' NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "batches_batch_code_unique" UNIQUE("batch_code")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"title_bangla" varchar NOT NULL,
	"description" text NOT NULL,
	"subject" "subject" NOT NULL,
	"target_class" varchar NOT NULL,
	"icon_name" varchar DEFAULT 'FlaskConical' NOT NULL,
	"color_scheme" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"answers" jsonb,
	"score" integer,
	"manual_marks" integer,
	"total_marks" integer,
	"percentage" integer,
	"rank" integer,
	"is_submitted" boolean DEFAULT false,
	"submitted_at" timestamp,
	"time_spent" integer,
	"feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"subject" "subject" NOT NULL,
	"chapter" varchar,
	"target_class" varchar,
	"description" text,
	"instructions" text,
	"exam_date" timestamp,
	"duration" integer NOT NULL,
	"exam_type" varchar NOT NULL,
	"exam_mode" varchar NOT NULL,
	"batch_id" varchar,
	"target_students" jsonb,
	"question_source" varchar,
	"question_content" text,
	"question_paper_image" text,
	"total_marks" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grading_schemes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"grade_ranges" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_calendar_summary" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"total_days" integer NOT NULL,
	"working_days" integer NOT NULL,
	"holidays" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_exam_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_result_id" varchar NOT NULL,
	"exam_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"marks_obtained" integer DEFAULT 0,
	"total_marks" integer NOT NULL,
	"percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "monthly_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"batch_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"class_level" varchar NOT NULL,
	"exam_average" integer DEFAULT 0,
	"total_exams" integer DEFAULT 0,
	"present_days" integer DEFAULT 0,
	"absent_days" integer DEFAULT 0,
	"excused_days" integer DEFAULT 0,
	"working_days" integer NOT NULL,
	"attendance_percentage" integer DEFAULT 0,
	"bonus_marks" integer DEFAULT 0,
	"final_score" integer DEFAULT 0,
	"class_rank" integer DEFAULT 0,
	"total_students" integer DEFAULT 0,
	"sms_notification_sent" boolean DEFAULT false,
	"generated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"note_type" "note_type" NOT NULL,
	"file_url" text,
	"subject" "subject" NOT NULL,
	"tags" text,
	"student_id" varchar NOT NULL,
	"batch_id" varchar NOT NULL,
	"is_public" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"created_by" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "online_exam_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" varchar NOT NULL,
	"question_text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" varchar NOT NULL,
	"explanation" text,
	"marks" integer DEFAULT 1 NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "praggo_ai_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_name" varchar NOT NULL,
	"key_value" text NOT NULL,
	"key_index" integer NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"daily_usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"last_error" text,
	"quota_reset_date" timestamp,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "praggo_ai_keys_key_name_unique" UNIQUE("key_name"),
	CONSTRAINT "praggo_ai_keys_key_index_unique" UNIQUE("key_index")
);
--> statement-breakpoint
CREATE TABLE "praggo_ai_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"user_role" "user_role" NOT NULL,
	"request_type" varchar NOT NULL,
	"key_used" varchar NOT NULL,
	"subject" "subject" NOT NULL,
	"prompt_length" integer,
	"response_length" integer,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"processing_time" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_bank" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_id" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"category" varchar NOT NULL,
	"sub_category" varchar NOT NULL,
	"chapter" varchar NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar NOT NULL,
	"options" jsonb,
	"correct_answer" varchar,
	"question_image" text,
	"drive_link" text,
	"difficulty" varchar DEFAULT 'medium' NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_bank_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"class_level" "class_level" NOT NULL,
	"subject" "subject" NOT NULL,
	"paper" "paper",
	"category" "question_bank_category" NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_bank_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"chapter" varchar NOT NULL,
	"description" text,
	"resource_type" "resource_type" NOT NULL,
	"resource_url" text,
	"content" text,
	"file_size" varchar,
	"download_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" varchar NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar NOT NULL,
	"options" jsonb,
	"correct_answer" varchar,
	"question_image" text,
	"drive_link" text,
	"marks" integer DEFAULT 1 NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_automation_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"recipient_count" integer NOT NULL,
	"success_count" integer NOT NULL,
	"failed_count" integer NOT NULL,
	"total_cost" numeric(10, 4),
	"execution_status" "execution_status" NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "sms_automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"template_id" integer NOT NULL,
	"trigger_type" "trigger_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"target_audience" "target_audience" NOT NULL,
	"batch_id" integer,
	"schedule_day" integer,
	"schedule_time" time,
	"last_executed" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_type" varchar NOT NULL,
	"recipient_phone" varchar NOT NULL,
	"recipient_name" varchar,
	"student_id" varchar,
	"sms_type" "sms_type" NOT NULL,
	"subject" varchar,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'sent' NOT NULL,
	"credits" integer DEFAULT 1,
	"cost_paisa" integer DEFAULT 39,
	"sent_by" varchar NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_template_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"variable_name" varchar(50) NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"default_value" text
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "sms_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"template" text NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"package_name" varchar NOT NULL,
	"sms_count" integer NOT NULL,
	"price" integer NOT NULL,
	"payment_method" varchar NOT NULL,
	"transaction_id" varchar,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"phone_number" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"education" text,
	"current_position" text,
	"specialization" text,
	"motto" text,
	"bio" text,
	"avatar_url" text,
	"contact_email" varchar,
	"contact_phone" varchar,
	"social_links" jsonb,
	"years_of_experience" integer,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "teacher_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "top_performers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"class_level" varchar NOT NULL,
	"rank" integer NOT NULL,
	"final_score" integer NOT NULL,
	"student_name" varchar NOT NULL,
	"student_photo" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"email" varchar,
	"sms_credits" integer DEFAULT 0,
	"student_id" varchar,
	"phone_number" varchar,
	"parent_phone_number" varchar,
	"student_password" varchar,
	"address" text,
	"date_of_birth" timestamp,
	"gender" varchar,
	"institution" varchar,
	"class_level" varchar,
	"batch_id" varchar,
	"admission_date" timestamp,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "academic_calendar" ADD CONSTRAINT "academic_calendar_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_calendar_id_academic_calendar_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."academic_calendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_exam_records" ADD CONSTRAINT "monthly_exam_records_monthly_result_id_monthly_results_id_fk" FOREIGN KEY ("monthly_result_id") REFERENCES "public"."monthly_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_exam_records" ADD CONSTRAINT "monthly_exam_records_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_exam_records" ADD CONSTRAINT "monthly_exam_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_results" ADD CONSTRAINT "monthly_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_results" ADD CONSTRAINT "monthly_results_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_exam_questions" ADD CONSTRAINT "online_exam_questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "praggo_ai_usage" ADD CONSTRAINT "praggo_ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "praggo_ai_usage" ADD CONSTRAINT "praggo_ai_usage_key_used_praggo_ai_keys_key_name_fk" FOREIGN KEY ("key_used") REFERENCES "public"."praggo_ai_keys"("key_name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank" ADD CONSTRAINT "question_bank_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_category_id_question_bank_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."question_bank_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_automation_executions" ADD CONSTRAINT "sms_automation_executions_rule_id_sms_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."sms_automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_automation_rules" ADD CONSTRAINT "sms_automation_rules_template_id_sms_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."sms_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_automation_rules" ADD CONSTRAINT "sms_automation_rules_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_automation_rules" ADD CONSTRAINT "sms_automation_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_template_variables" ADD CONSTRAINT "sms_template_variables_template_id_sms_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."sms_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_templates" ADD CONSTRAINT "sms_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_transactions" ADD CONSTRAINT "sms_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_performers" ADD CONSTRAINT "top_performers_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");