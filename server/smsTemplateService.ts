import { and, eq, desc } from 'drizzle-orm';
import { db } from './db.js';
import { 
  smsTemplates, 
  smsTemplateVariables, 
  smsAutomationRules, 
  smsAutomationExecutions,
  users,
  batches,
  smsLogs
} from '../shared/schema.js';

export interface SMSTemplate {
  id: number;
  name: string;
  type: 'attendance' | 'exam_result' | 'exam_notification' | 'notice' | 'reminder';
  isActive: boolean;
  template: string;
  description?: string;
  createdBy: string;
  variables?: SMSTemplateVariable[];
}

export interface SMSTemplateVariable {
  id: number;
  templateId: number;
  variableName: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
}

interface CreateVariableData {
  variableName: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
}

export interface SMSAutomationRule {
  id: number;
  name: string;
  templateId: number;
  triggerType: 'monthly_exam' | 'attendance_reminder' | 'exam_notification' | 'custom_schedule';
  isActive: boolean;
  targetAudience: 'students' | 'parents' | 'both';
  batchId?: string;
  scheduleDay?: number; // 1-31 for monthly
  scheduleTime?: string; // HH:MM format
  lastExecuted?: Date;
  createdBy: string;
}

class SMSTemplateService {
  // Get all templates for a user
  async getTemplates(userId: string): Promise<SMSTemplate[]> {
    const templates = await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.createdBy, userId))
      .orderBy(desc(smsTemplates.createdAt));

    const templatesWithVariables = await Promise.all(
      templates.map(async (template) => {
        const variables = await db
          .select()
          .from(smsTemplateVariables)
          .where(eq(smsTemplateVariables.templateId, template.id));
        
        return {
          ...template,
          variables
        };
      })
    );

    return templatesWithVariables;
  }

  // Create a new template
  async createTemplate(templateData: Omit<SMSTemplate, 'id'>, variables?: Omit<SMSTemplateVariable, 'id' | 'templateId'>[]): Promise<SMSTemplate> {
    const [newTemplate] = await db
      .insert(smsTemplates)
      .values(templateData)
      .returning();

    if (variables && variables.length > 0) {
      await db
        .insert(smsTemplateVariables)
        .values(variables.map(v => ({ ...v, templateId: newTemplate.id })));
    }

    return this.getTemplateById(newTemplate.id);
  }

  // Get template by ID
  async getTemplateById(id: number): Promise<SMSTemplate> {
    const template = await db
      .select()
      .from(smsTemplates)
      .where(eq(smsTemplates.id, id))
      .limit(1);

    if (!template[0]) {
      throw new Error('Template not found');
    }

    const variables = await db
      .select()
      .from(smsTemplateVariables)
      .where(eq(smsTemplateVariables.templateId, id));

    return {
      ...template[0],
      variables
    };
  }

  // Update template
  async updateTemplate(id: number, updates: Partial<SMSTemplate & { variables?: CreateVariableData[] }>): Promise<SMSTemplate> {
    try {
      // Update the template
      await db
        .update(smsTemplates)
        .set({
          name: updates.name,
          type: updates.type,
          template: updates.template,
          description: updates.description,
          isActive: updates.isActive,
          updatedAt: new Date()
        })
        .where(eq(smsTemplates.id, id));

      // Update variables if provided
      if (updates.variables) {
        // Delete existing variables
        await db.delete(smsTemplateVariables).where(eq(smsTemplateVariables.templateId, id));

        // Insert new variables
        if (updates.variables.length > 0) {
          await db.insert(smsTemplateVariables).values(
            updates.variables.map(variable => ({
              templateId: id,
              variableName: variable.variableName,
              description: variable.description,
              isRequired: variable.isRequired,
              defaultValue: variable.defaultValue
            }))
          );
        }
      }

      const template = await this.getTemplateById(id);
      if (!template) {
        throw new Error('Template not found after update');
      }
      
      console.log(`📝 Template updated: ${template.name} (ID: ${id})`);
      return template;
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete template
  async deleteTemplate(id: number): Promise<void> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  }

  // Get automation rules
  async getAutomationRules(userId: string): Promise<SMSAutomationRule[]> {
    return await db
      .select()
      .from(smsAutomationRules)
      .where(eq(smsAutomationRules.createdBy, userId))
      .orderBy(desc(smsAutomationRules.createdAt));
  }

  // Create automation rule
  async createAutomationRule(ruleData: Omit<SMSAutomationRule, 'id'>): Promise<SMSAutomationRule> {
    const [newRule] = await db
      .insert(smsAutomationRules)
      .values(ruleData)
      .returning();

    return newRule;
  }

  // Update automation rule
  async updateAutomationRule(id: number, updates: Partial<SMSAutomationRule>): Promise<SMSAutomationRule> {
    const [updatedRule] = await db
      .update(smsAutomationRules)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(smsAutomationRules.id, id))
      .returning();

    return updatedRule;
  }

  // Delete automation rule
  async deleteAutomationRule(id: number): Promise<void> {
    await db.delete(smsAutomationRules).where(eq(smsAutomationRules.id, id));
  }

  // Process template with variables
  processTemplate(template: string, variables: Record<string, string>): string {
    let processedMessage = template;
    
    // Replace variables in format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedMessage = processedMessage.replace(regex, value);
    });

    return processedMessage;
  }

  // Get default templates for different types
  getDefaultTemplates() {
    return {
      attendance: {
        name: 'হাজিরা অনুস্মারক',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{date}} তারিখে আপনার সন্তান ক্লাসে {{attendanceStatus}} ছিল। {{batchName}} - {{teacherName}}',
        description: 'দৈনিক হাজিরার জন্য SMS টেমপ্লেট',
        variables: [
          { variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { variableName: 'date', description: 'তারিখ', isRequired: true },
          { variableName: 'attendanceStatus', description: 'হাজিরার অবস্থা', isRequired: true },
          { variableName: 'batchName', description: 'ব্যাচের নাম', isRequired: true },
          { variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      },
      exam_notification: {
        name: 'পরীক্ষার বিজ্ঞপ্তি',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{examTitle}} পরীক্ষা {{examDate}} তারিখে {{examTime}} সময়ে অনুষ্ঠিত হবে। সিলেবাস: {{syllabus}}। সময়কাল: {{duration}} মিনিট। - {{teacherName}}',
        description: 'পরীক্ষার জন্য বিজ্ঞপ্তি SMS',
        variables: [
          { variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { variableName: 'examTitle', description: 'পরীক্ষার নাম', isRequired: true },
          { variableName: 'examDate', description: 'পরীক্ষার তারিখ', isRequired: true },
          { variableName: 'examTime', description: 'পরীক্ষার সময়', isRequired: true },
          { variableName: 'syllabus', description: 'সিলেবাস', isRequired: false },
          { variableName: 'duration', description: 'পরীক্ষার সময়কাল', isRequired: true },
          { variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      },
      exam_result: {
        name: 'পরীক্ষার ফলাফল',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{examTitle}} পরীক্ষায় আপনার সন্তানের নম্বর {{marks}}/{{totalMarks}} ({{percentage}}%)। অবস্থান: {{rank}}/{{totalStudents}}। - {{teacherName}}',
        description: 'পরীক্ষার ফলাফলের জন্য SMS',
        variables: [
          { variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { variableName: 'examTitle', description: 'পরীক্ষার নাম', isRequired: true },
          { variableName: 'marks', description: 'প্রাপ্ত নম্বর', isRequired: true },
          { variableName: 'totalMarks', description: 'পূর্ণমান', isRequired: true },
          { variableName: 'percentage', description: 'শতকরা নম্বর', isRequired: true },
          { variableName: 'rank', description: 'অবস্থান', isRequired: true },
          { variableName: 'totalStudents', description: 'মোট ছাত্রসংখ্যা', isRequired: true },
          { variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      },
      monthly_exam: {
        name: 'মাসিক পরীক্ষার ফলাফল',
        template: 'প্রিয় {{studentName}} এর অভিভাবক, {{month}} মাসের ফলাফল: গড় নম্বর {{averageMarks}}%, হাজিরা {{attendancePercentage}}%, অবস্থান {{rank}}/{{totalStudents}}। মোট পরীক্ষা: {{totalExams}}টি। - {{teacherName}}',
        description: 'মাসিক ফলাফলের জন্য SMS',
        variables: [
          { variableName: 'studentName', description: 'ছাত্র/ছাত্রীর নাম', isRequired: true },
          { variableName: 'month', description: 'মাসের নাম', isRequired: true },
          { variableName: 'averageMarks', description: 'গড় নম্বর', isRequired: true },
          { variableName: 'attendancePercentage', description: 'হাজিরার শতকরা', isRequired: true },
          { variableName: 'rank', description: 'অবস্থান', isRequired: true },
          { variableName: 'totalStudents', description: 'মোট ছাত্রসংখ্যা', isRequired: true },
          { variableName: 'totalExams', description: 'মোট পরীক্ষা', isRequired: true },
          { variableName: 'teacherName', description: 'শিক্ষকের নাম', isRequired: true }
        ]
      }
    };
  }

  // Create default templates for a user
  async createDefaultTemplates(userId: string): Promise<void> {
    const defaultTemplates = this.getDefaultTemplates();

    for (const [type, templateData] of Object.entries(defaultTemplates)) {
      const { variables, ...template } = templateData;
      
      await this.createTemplate(
        {
          ...template,
          type: type as any,
          isActive: true,
          createdBy: userId
        },
        variables
      );
    }
  }

  // Send templated SMS (using automation or direct send)
  async sendTemplatedSMS(params: {
    templateId: number;
    batchId: string;
    audience: 'students' | 'parents' | 'both';
    variables: Record<string, string>;
    sentBy: string;
  }) {
    try {
      const { templateId, batchId, audience, variables, sentBy } = params;
      
      // Get the template
      const template = await this.getTemplateById(templateId);
      if (!template || !template.isActive) {
        throw new Error('Template not found or inactive');
      }

      // Process template with variables
      const message = this.processTemplate(template.template, variables);

      // Import bulkSMS service and send
      const { bulkSMSService } = await import('./bulkSMS');
      
      // Get batch students to create recipients list
      const batchStudents = await db
        .select()
        .from(users)
        .where(and(eq(users.batchId, batchId), eq(users.role, 'student')));

      if (batchStudents.length === 0) {
        throw new Error('No students found in the specified batch');
      }

      // Create recipients list based on audience
      const recipients = [];
      for (const student of batchStudents) {
        if (audience === 'students' || audience === 'both') {
          if (student.phoneNumber) {
            recipients.push({
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              phoneNumber: student.phoneNumber
            });
          }
        }
        if (audience === 'parents' || audience === 'both') {
          if (student.parentPhoneNumber) {
            recipients.push({
              id: `${student.id}_parent`,
              name: `${student.firstName} ${student.lastName} (Parent)`,
              phoneNumber: student.parentPhoneNumber
            });
          }
        }
      }

      if (recipients.length === 0) {
        throw new Error('No valid phone numbers found for the selected audience');
      }

      // Send SMS using bulk SMS service
      const result = await bulkSMSService.sendBulkSMS(
        recipients,
        message,
        sentBy,
        `template_${template.type}`
      );

      // Log the execution
      await db.insert(smsAutomationExecutions).values({
        ruleId: null, // Direct send, not from automation rule
        templateId: templateId,
        executedAt: new Date(),
        status: result.success ? 'success' : 'failed',
        recipientCount: result.sentCount || 0,
        errorMessage: result.success ? null : `${result.failedCount} messages failed`
      });

      return result;
    } catch (error) {
      console.error('Error sending templated SMS:', error);
      throw new Error(`Failed to send templated SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const smsTemplateService = new SMSTemplateService();