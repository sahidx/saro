import { db } from './db';
import { smsLogs } from '@shared/schema';
import type { IStorage } from './storage';

interface SMSRecipient {
  id: string;
  name: string;
  phoneNumber: string;
}

interface SMSResponse {
  success: boolean;
  code: number;
  message: string;
  messageId?: string;
  smsCount?: number;
  totalCost?: number;
  billing?: SMSBilling;
}

// SMS Billing Information Interface
interface SMSBilling {
  messageLength: number;
  smsParts: number;
  costPerPart: number; // 0.39 paisa
  totalCost: number;
  characterType: 'bengali' | 'english';
}

interface BulkSMSResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  totalCreditsUsed: number;
  message?: string;
  code?: number;
  failedMessages: Array<{
    recipient: SMSRecipient;
    error: string;
    code: number;
  }>;
}

interface SMSBalanceInfo {
  hasBalance: boolean;
  currentBalance: number;
  requiredCredits: number;
  recipientCount: number;
  message?: string;
}

interface BatchSMSPreview {
  batchId: string;
  batchName: string;
  studentCount: number;
  parentCount: number;
  totalRecipients: number;
  smsRequired: number;
}

export class BulkSMSService {
  private apiKey: string;
  private baseUrl = 'http://bulksmsbd.net/api/smsapi';
  private senderId = '8809617628909'; // Admin account with infinite SMS
  private costPerPart = 0.39; // 0.39 paisa per SMS part (for tracking purposes)
  private storage: IStorage;

  constructor(storage: IStorage) {
    // Hardcoded admin API key with infinite SMS capability
    this.apiKey = 'gsOKLO6XtKsANCvgPHNt';
    this.storage = storage;
    console.log('📱 BulkSMS Bangladesh API initialized with professional billing and credit management');
  }

  // Calculate SMS parts and billing information
  private calculateSMSBilling(message: string): SMSBilling {
    const messageLength = message.length;
    
    // Check if message contains Bengali characters
    const hasBengaliChars = /[\u0980-\u09FF]/.test(message);
    const characterType: 'bengali' | 'english' = hasBengaliChars ? 'bengali' : 'english';
    
    // Character limits per SMS part (industry standard)
    const charLimit = characterType === 'bengali' ? 67 : 160;
    
    // Calculate SMS parts (minimum 1 part)
    const smsParts = Math.max(1, Math.ceil(messageLength / charLimit));
    
    // Calculate total cost
    const totalCost = smsParts * this.costPerPart;
    
    console.log(`📊 SMS Billing: ${messageLength} chars, ${smsParts} parts, ${totalCost.toFixed(2)} paisa (${characterType})`);
    
    return {
      messageLength,
      smsParts,
      costPerPart: this.costPerPart,
      totalCost,
      characterType
    };
  }

  // Send single SMS using exact BulkSMS BD API format with professional billing
  async sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
      // Calculate billing information first
      const billing = this.calculateSMSBilling(message);
      
      // Ensure phone number is in correct format (88017XXXXXXXX)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // URL encode the message for special characters like &, $, @ etc
      const encodedMessage = encodeURIComponent(message);
      
      // Use EXACT API format as specified by user:
      // http://bulksmsbd.net/api/smsapi?api_key=gsOKLO6XtKsANCvgPHNt&type=text&number=Receiver&senderid=8809617628909&message=TestSMS
      const apiUrl = `${this.baseUrl}?api_key=${this.apiKey}&type=text&number=${formattedNumber}&senderid=${this.senderId}&message=${encodedMessage}`;
      
      console.log(`📤 Sending SMS to ${formattedNumber}`);
      console.log(`🔗 API URL: ${apiUrl.replace(this.apiKey, '***API_KEY***')}`); // Hide API key in logs
      
      // Use GET method as specified in user's API format
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'BelalSir-ChemistryICT/1.0'
        }
      });
      
      const responseText = await response.text();
      console.log(`📨 SMS API Response: ${responseText}`);
      
      // Parse response - can be JSON or plain text
      let responseCode = 0;
      
      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(responseText);
        responseCode = jsonResponse.response_code || jsonResponse.code || 0;
      } catch {
        // Fallback to plain text parsing (simple numeric code)
        responseCode = parseInt(responseText.trim()) || 0;
      }
      
      const result = this.parseResponse(responseCode, responseText);
      
      // Add billing information to response
      result.smsCount = billing.smsParts;
      result.totalCost = billing.totalCost;
      result.billing = billing;
      
      return result;
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      return {
        success: false,
        code: 1005,
        message: 'Internal Error - Network or API issue',
        smsCount: 0,
        totalCost: 0
      };
    }
  }

  // Send bulk SMS to multiple recipients
  async sendBulkSMS(
    recipients: SMSRecipient[], 
    message: string, 
    sentBy: string,
    smsType: string = 'general'
  ): Promise<BulkSMSResult> {
    const result: BulkSMSResult = {
      success: true,
      sentCount: 0,
      failedCount: 0,
      totalCreditsUsed: 0,
      failedMessages: []
    };

    // Calculate total SMS credits needed
    const billing = this.calculateSMSBilling(message);
    const totalCreditsNeeded = billing.smsParts * recipients.length;
    
    // CRITICAL SECURITY: Check credits BEFORE any API calls
    const senderCredits = await this.storage.getUserSmsCredits(sentBy);
    console.log(`💳 SECURITY CHECK: Need ${totalCreditsNeeded}, Available ${senderCredits}`);
    
    if (senderCredits < totalCreditsNeeded) {
      console.log(`🔒 BLOCKED: Insufficient credits - NO API CALLS MADE for accurate tracking`);
      // Return failure immediately WITHOUT making any SMS API calls
      // This ensures super admin can track actual SMS usage accurately
      return {
        success: false,
        sentCount: 0,
        failedCount: recipients.length,
        totalCreditsUsed: 0,
        failedMessages: recipients.map(recipient => ({
          recipient,
          error: `BLOCKED: Insufficient SMS credits. Need ${totalCreditsNeeded}, available ${senderCredits}`,
          code: 1003
        }))
      };
    }

    console.log(`🚀 Starting bulk SMS to ${recipients.length} recipients`);

    // Send SMS to each recipient
    for (const recipient of recipients) {
      try {
        const smsResult = await this.sendSMS(recipient.phoneNumber, message);
        
        if (smsResult.success) {
          result.sentCount++;
          
          // Deduct SMS credits from sender's account
          const billing = this.calculateSMSBilling(message);
          const creditsDeducted = await this.storage.deductSmsCredits(sentBy, billing.smsParts);
          
          if (creditsDeducted) {
            console.log(`💳 Deducted ${billing.smsParts} SMS credits from ${sentBy}`);
          } else {
            console.log(`⚠️ Warning: Could not deduct credits from ${sentBy}`);
          }
          
          // Log successful SMS with professional billing - fix SMS type enum
          const validSmsType = ['attendance', 'exam_result', 'exam_notification', 'notice', 'reminder'].includes(smsType) 
            ? smsType : 'reminder';
            
          // Only include studentId if it's a real student in database
          const logData: any = {
            recipientType: 'student',
            recipientPhone: recipient.phoneNumber,
            recipientName: recipient.name,
            smsType: validSmsType,
            message,
            status: 'sent',
            credits: billing.smsParts,
            sentBy,
            billing
          };
          
          // Only add studentId if it exists in database (avoid foreign key errors)
          if (recipient.id && !recipient.id.startsWith('test') && !recipient.id.startsWith('parent-')) {
            const studentExists = await this.storage.getUser(recipient.id);
            if (studentExists) {
              logData.studentId = recipient.id;
            }
          }
            
          await this.logSMS(logData);
          
          result.totalCreditsUsed += billing.smsParts;
          
          console.log(`✅ SMS sent successfully to ${recipient.name} (${recipient.phoneNumber})`);
        } else {
          result.failedCount++;
          result.failedMessages.push({
            recipient,
            error: smsResult.message,
            code: smsResult.code
          });
          
          // Log failed SMS - no credit deduction for failed SMS
          const validSmsType = ['attendance', 'exam_result', 'exam_notification', 'notice', 'reminder'].includes(smsType) 
            ? smsType : 'reminder';
            
          await this.logSMS({
            recipientType: 'student',
            recipientPhone: recipient.phoneNumber,
            recipientName: recipient.name,
            studentId: typeof recipient.id === 'string' ? recipient.id : undefined,
            smsType: validSmsType,
            message,
            status: 'failed',
            credits: 0, // No charge for failed SMS
            sentBy,
            billing: {
              messageLength: message.length,
              smsParts: 0,
              costPerPart: this.costPerPart,
              totalCost: 0,
              characterType: /[\u0980-\u09FF]/.test(message) ? 'bengali' : 'english'
            }
          });
          
          console.log(`❌ SMS failed to ${recipient.name}: ${smsResult.message}`);
        }
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        result.failedCount++;
        result.failedMessages.push({
          recipient,
          error: 'Network or processing error',
          code: 1005
        });
        console.error(`💥 Error sending SMS to ${recipient.name}:`, error);
      }
    }

    result.success = result.sentCount > 0;
    
    console.log(`📊 Bulk SMS completed: ${result.sentCount} sent, ${result.failedCount} failed, ${result.totalCreditsUsed} credits used`);
    
    return result;
  }

  // Balance checking functionality removed per user request
  // SMS sending will work without balance verification

  // Format phone number for Bangladesh (ensure 88017XXXXXXXX format)
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('88')) {
      return cleaned; // Already in correct format
    } else if (cleaned.startsWith('017') || cleaned.startsWith('018') || cleaned.startsWith('019') || 
               cleaned.startsWith('013') || cleaned.startsWith('014') || cleaned.startsWith('015') || 
               cleaned.startsWith('016')) {
      return '88' + cleaned; // Add country code
    } else if (cleaned.length === 11 && cleaned.startsWith('01')) {
      return '88' + cleaned; // Standard BD mobile number
    }
    
    return cleaned; // Return as-is if format unclear
  }

  // Parse BulkSMS API response codes
  private parseResponse(code: number, rawResponse: string): SMSResponse {
    const responseMap: { [key: number]: { success: boolean; message: string } } = {
      202: { success: true, message: 'SMS Submitted Successfully' },
      1001: { success: false, message: 'Invalid Number' },
      1002: { success: false, message: 'Sender ID not correct/disabled' },
      1003: { success: false, message: 'Please provide all required fields' },
      1005: { success: false, message: 'Internal Error' },
      1006: { success: false, message: 'Balance Validity Not Available' },
      1007: { success: false, message: 'Balance Insufficient' },
      1011: { success: false, message: 'User ID not found' },
      1012: { success: false, message: 'Masking SMS must be sent in Bengali' },
      1013: { success: false, message: 'Sender ID not found in gateway' },
      1014: { success: false, message: 'Sender Type Name not found' },
      1015: { success: false, message: 'No valid gateway for sender ID' },
      1016: { success: false, message: 'Sender Type Active Price Info not found' },
      1017: { success: false, message: 'Sender Type Price Info not found' },
      1018: { success: false, message: 'Account is disabled' },
      1019: { success: false, message: 'Sender type price is disabled' },
      1020: { success: false, message: 'Parent account not found' },
      1021: { success: false, message: 'Parent active price not found' },
      1031: { success: false, message: 'Account not verified' },
      1032: { success: false, message: 'IP not whitelisted' }
    };

    const result = responseMap[code] || {
      success: false,
      message: `Unknown response code: ${code}`
    };

    return {
      success: result.success,
      code,
      message: result.message,
      messageId: result.success ? `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
    };
  }

  // Log SMS to database with professional billing
  private async logSMS(data: {
    recipientType: string;
    recipientPhone: string;
    recipientName?: string;
    studentId?: string;
    smsType: string;
    message: string;
    status: string;
    credits: number;
    sentBy: string;
    billing?: SMSBilling;
  }) {
    try {
      // Calculate billing if not provided
      let billing = data.billing;
      if (!billing) {
        billing = this.calculateSMSBilling(data.message);
      }

      await db.insert(smsLogs).values({
        recipientType: data.recipientType,
        recipientPhone: data.recipientPhone,
        recipientName: data.recipientName,
        studentId: data.studentId,
        smsType: data.smsType as any,
        message: data.message,
        status: data.status,
        credits: billing.smsParts, // Use calculated SMS parts
        costPaisa: Math.round(billing.totalCost * 100), // Convert to paisa (0.39 Tk = 39 paisa)
        sentBy: data.sentBy,
        sentAt: new Date(),
        deliveredAt: data.status === 'sent' ? new Date() : null
      });
      
      console.log(`💾 SMS logged: ${billing.smsParts} parts, ${billing.totalCost.toFixed(2)} paisa cost`);
    } catch (error) {
      console.error('📝 Failed to log SMS to database:', error);
    }
  }

  // Check SMS balance and preview requirements
  async checkSMSBalance(userId: string, recipientCount: number, message: string): Promise<SMSBalanceInfo> {
    try {
      const user = await this.storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const billing = this.calculateSMSBilling(message);
      const requiredSMS = billing.smsParts * recipientCount;
      const availableBalance = user.smsCredits || 0;
      const hasBalance = availableBalance >= requiredSMS;

      return {
        hasBalance,
        currentBalance: availableBalance,
        requiredCredits: requiredSMS,
        recipientCount,
        message: hasBalance ? 
          `Balance sufficient. You have ${availableBalance} credits, need ${requiredSMS}` : 
          `Insufficient balance. You have ${availableBalance} credits, need ${requiredSMS}`
      };
    } catch (error) {
      console.error('Error checking SMS balance:', error);
      throw error;
    }
  }

  // Get batch-wise SMS preview for monthly results
  async getBatchSMSPreview(batchIds?: string[], message: string = 'Sample message'): Promise<BatchSMSPreview[]> {
    try {
      const billing = this.calculateSMSBilling(message);
      let batches;
      
      if (batchIds && batchIds.length > 0) {
        batches = [];
        for (const batchId of batchIds) {
          const batch = await this.storage.getBatchById(batchId);
          if (batch) batches.push(batch);
        }
      } else {
        batches = await this.storage.getAllBatches();
      }

      const batchPreviews: BatchSMSPreview[] = [];

      for (const batch of batches) {
        const students = await this.storage.getStudentsByBatch(batch.id);
        const studentCount = students.filter(s => s.phoneNumber).length;
        const parentCount = students.filter(s => s.parentPhoneNumber).length;
        const totalRecipients = studentCount + parentCount; // Assuming we send to both
        const smsRequired = billing.smsParts * totalRecipients;

        batchPreviews.push({
          batchId: batch.id,
          batchName: batch.name,
          studentCount,
          parentCount,
          totalRecipients,
          smsRequired
        });
      }

      return batchPreviews;
    } catch (error) {
      console.error('Error getting batch SMS preview:', error);
      throw error;
    }
  }

  // Send attendance SMS with balance check
  async sendAttendanceSMS(studentId: string, batchId: string, attendanceData: any, teacherId: string): Promise<SMSResponse> {
    try {
      const student = await this.storage.getUser(studentId);
      const teacher = await this.storage.getUser(teacherId);
      const batch = await this.storage.getBatchById(batchId);
      
      if (!student || !teacher || !batch) {
        throw new Error('Required data not found');
      }

      const message = `প্রিয় ${student.firstName} ${student.lastName} এর অভিভাবক, ${new Date().toLocaleDateString('bn-BD')} তারিখে আপনার সন্তান ক্লাসে ${attendanceData.status === 'present' ? 'উপস্থিত' : 'অনুপস্থিত'} ছিল। ${batch.name} - ${teacher.firstName} ${teacher.lastName}`;

      // Check balance for parent SMS
      const recipients: string[] = [];
      if (student.parentPhoneNumber) recipients.push(student.parentPhoneNumber);
      if (student.phoneNumber && student.phoneNumber !== student.parentPhoneNumber) recipients.push(student.phoneNumber);

      if (recipients.length === 0) {
        return { success: false, code: 0, message: 'No valid phone numbers found' };
      }

      const balanceInfo = await this.checkSMSBalance(teacherId, recipients.length, message);
      
      if (!balanceInfo.hasBalance) {
        // Save attendance data but don't send SMS
        console.log(`⚠️  SMS balance insufficient. Required: ${balanceInfo.requiredCredits}, Available: ${balanceInfo.currentBalance}`);
        return {
          success: false,
          code: 1001,
          message: balanceInfo.message || `SMS balance insufficient. Required: ${balanceInfo.requiredCredits}, Available: ${balanceInfo.currentBalance}`,
          smsCount: balanceInfo.requiredCredits
        };
      }

      // Send SMS to all recipients
      let sentCount = 0;
      let failedCount = 0;

      for (const phone of recipients) {
        const recipientType = phone === student.parentPhoneNumber ? 'parent' : 'student';
        const result = await this.sendSMS(phone, message);
        
        if (result.success) {
          sentCount++;
          // Deduct credits from teacher
          await this.storage.deductSmsCredits(teacherId, result.smsCount || 1);
        } else {
          failedCount++;
        }

        // Log SMS
        await this.logSMS({
          recipientType,
          recipientPhone: phone,
          recipientName: recipientType === 'parent' ? `${student.firstName} এর অভিভাবক` : `${student.firstName} ${student.lastName}`,
          studentId: student.id,
          smsType: 'attendance',
          message,
          status: result.success ? 'sent' : 'failed',
          credits: result.smsCount || 1,
          sentBy: teacherId
        });
      }

      return {
        success: sentCount > 0,
        code: sentCount > 0 ? 1000 : 1006,
        message: `SMS sent to ${sentCount} recipients, ${failedCount} failed`,
        smsCount: sentCount
      };

    } catch (error) {
      console.error('Error sending attendance SMS:', error);
      throw error;
    }
  }

  // Send monthly result SMS for all batches
  async sendMonthlyResultSMS(month: number, year: number, teacherId: string, batchIds?: string[]): Promise<BatchSMSPreview[]> {
    try {
      const teacher = await this.storage.getUser(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        throw new Error('Invalid teacher');
      }

      // Get monthly results for specified batches or all batches
      const monthlyResults = await this.storage.getMonthlyResults(year, month, batchIds);
      const batchSummaries: BatchSMSPreview[] = [];
      
      for (const result of monthlyResults) {
        const student = await this.storage.getUser(result.studentId);
        const batch = await this.storage.getBatchById(result.batchId);
        
        if (!student || !batch) continue;

        const message = `প্রিয় ${student.firstName} ${student.lastName} এর অভিভাবক, ${month}/${year} মাসের ফলাফল: গড় নম্বর ${result.examAverage}%, হাজিরা ${result.attendancePercentage}%, অবস্থান ${result.classRank}/${result.totalStudents}। মোট পরীক্ষা: ${result.totalExams}টি। - ${teacher.firstName} ${teacher.lastName}`;

        const recipients: string[] = [];
        if (student.parentPhoneNumber) recipients.push(student.parentPhoneNumber);
        if (student.phoneNumber && student.phoneNumber !== student.parentPhoneNumber) recipients.push(student.phoneNumber);

        if (recipients.length === 0) continue;

        const balanceInfo = await this.checkSMSBalance(teacherId, recipients.length, message);
        
        if (!balanceInfo.hasBalance) {
          console.log(`⚠️  Insufficient balance for ${student.firstName} ${student.lastName}. Required: ${balanceInfo.requiredCredits}, Available: ${balanceInfo.currentBalance}`);
          continue;
        }

        // Send SMS to recipients
        for (const phone of recipients) {
          const recipientType = phone === student.parentPhoneNumber ? 'parent' : 'student';
          const smsResult = await this.sendSMS(phone, message);
          
          if (smsResult.success) {
            await this.storage.deductSmsCredits(teacherId, smsResult.smsCount || 1);
          }

          await this.logSMS({
            recipientType,
            recipientPhone: phone,
            recipientName: recipientType === 'parent' ? `${student.firstName} এর অভিভাবক` : `${student.firstName} ${student.lastName}`,
            studentId: student.id,
            smsType: 'exam_result',
            message,
            status: smsResult.success ? 'sent' : 'failed',
            credits: smsResult.smsCount || 1,
            sentBy: teacherId
          });
        }

        // Update monthly result SMS notification flag
        await this.storage.markMonthlyResultSMSSent(result.id);
      }

      return batchSummaries;
    } catch (error) {
      console.error('Error sending monthly result SMS:', error);
      throw error;
    }
  }

  // Generate monthly SMS alert for day before
  async getMonthlyAlertPreview(): Promise<BatchSMSPreview[]> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if tomorrow is the last day of the month
      const lastDayOfMonth = new Date(tomorrow.getFullYear(), tomorrow.getMonth() + 1, 0);
      
      if (tomorrow.getDate() !== lastDayOfMonth.getDate()) {
        return []; // Not the day before month end
      }

      const currentMonth = tomorrow.getMonth() + 1;
      const currentYear = tomorrow.getFullYear();
      
      // Get all batches with pending monthly results
      const sampleMessage = `প্রিয় অভিভাবক, ${currentMonth}/${currentYear} মাসের ফলাফল: গড় নম্বর ৮৫%, হাজিরা ৯০%, অবস্থান ৫/৩০। মোট পরীক্ষা: ৪টি। - বেলাল স্যার`;
      
      return await this.getBatchSMSPreview(undefined, sampleMessage);
    } catch (error) {
      console.error('Error generating monthly alert preview:', error);
      throw error;
    }
  }

  // Request SMS credits from super admin
  async requestSMSCredits(teacherId: string, requestedAmount: number, justification: string): Promise<boolean> {
    try {
      // In a real system, this would create a notification for super admin
      // For now, we'll log the request
      console.log(`📱 SMS Credit Request - Teacher: ${teacherId}, Amount: ${requestedAmount}, Reason: ${justification}`);
      
      // This would typically create a notification or database entry for super admin approval
      // For demo purposes, we'll just log it
      return true;
    } catch (error) {
      console.error('Error requesting SMS credits:', error);
      return false;
    }
  }
}

// Export singleton instance
// Will be initialized with storage from routes
export let bulkSMSService: BulkSMSService;

export function initializeBulkSMSService(storage: IStorage): void {
  bulkSMSService = new BulkSMSService(storage);
}