CREATE TYPE "public"."execution_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."target_audience" AS ENUM('students', 'parents', 'both');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('monthly_exam', 'attendance_reminder', 'exam_notification', 'custom_schedule');--> statement-breakpoint
ALTER TABLE "sms_automation_rules" ALTER COLUMN "batch_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "sms_automation_rules" ALTER COLUMN "created_by" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "sms_templates" ALTER COLUMN "created_by" SET DATA TYPE varchar;