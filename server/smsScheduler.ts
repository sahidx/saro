/**
 * SMS Scheduler for Automated Monthly Alerts
 * Handles day-before month-end SMS alerts and monthly result notifications
 */

import { bulkSMSService } from './bulkSMS';
import { storage } from './storage';
import { monthlyResultScheduler } from './monthlyResultScheduler';

interface SMSSchedulerConfig {
  alertDayBefore: boolean; // Send alert day before month end
  alertTime: string; // Time to send alerts (HH:MM format)
  enabled: boolean; // Master enable/disable
}

export class SMSScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private config: SMSSchedulerConfig = {
    alertDayBefore: true,
    alertTime: '10:00',
    enabled: true
  };
  
  /**
   * Start the SMS scheduler - checks every hour for SMS alerts
   */
  startScheduler() {
    if (this.intervalId) {
      console.log('📱 SMS scheduler already running');
      return;
    }
    
    if (!this.config.enabled) {
      console.log('📱 SMS scheduler disabled in config');
      return;
    }
    
    // Check every hour for SMS alerts
    this.intervalId = setInterval(async () => {
      await this.checkForSMSAlerts();
    }, 60 * 60 * 1000); // 1 hour
    
    // Also run initial check
    this.checkForSMSAlerts();
    
    console.log('📱 SMS scheduler started - checking every hour for SMS alerts');
  }
  
  /**
   * Stop the SMS scheduler
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📱 SMS scheduler stopped');
    }
  }
  
  /**
   * Check for SMS alerts that need to be sent
   */
  private async checkForSMSAlerts() {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Parse configured alert time
      const [alertHour, alertMinute] = this.config.alertTime.split(':').map(Number);
      
      // Only run at the configured time (within 1 hour window)
      if (currentHour !== alertHour || currentMinute < 0 || currentMinute > 59) {
        return;
      }
      
      // Check if it's the day before month end
      if (this.config.alertDayBefore && this.isSecondToLastDayOfMonth(now)) {
        await this.sendMonthEndAlerts();
      }
      
      // Check if it's the first day of month (send monthly results)
      if (now.getDate() === 1) {
        await this.sendMonthlyResultsSMS();
      }
      
    } catch (error) {
      console.error('Error checking for SMS alerts:', error);
    }
  }
  
  /**
   * Check if today is the second-to-last day of the month (day before month end)
   */
  private isSecondToLastDayOfMonth(date: Date): boolean {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    
    // If tomorrow is the first day of next month, today is the last day
    // We want the day before that (second-to-last day)
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
    
    return dayAfterTomorrow.getDate() === 1;
  }
  
  /**
   * Send day-before month-end alerts to teachers showing SMS requirements
   */
  async sendMonthEndAlerts() {
    if (this.isProcessing) {
      console.log('📱 SMS alert processing already in progress, skipping...');
      return;
    }
    
    try {
      this.isProcessing = true;
      
      console.log('📱 Sending day-before month-end SMS alerts...');
      
      // Get monthly alert preview (this shows SMS needed per batch)
      const alertPreview = await bulkSMSService.getMonthlyAlertPreview();
      
      if (!alertPreview.length) {
        console.log('📱 No SMS alerts needed for month end');
        return;
      }
      
      // Get all teachers to notify
      const teachers = await storage.getUsersByRole('teacher');
      
      let totalAlertsSent = 0;
      
      for (const teacher of teachers) {
        try {
          // Create alert message showing SMS requirements
          const totalSMSNeeded = alertPreview.reduce((sum, batch) => sum + batch.smsRequired, 0);
          const batchDetails = alertPreview
            .map(batch => `${batch.batchName}: ${batch.smsRequired} SMS`)
            .join(', ');
          
          const alertMessage = `
🚨 Monthly SMS Alert (Day Before Month End)

Total SMS needed tomorrow: ${totalSMSNeeded}
Batch breakdown: ${batchDetails}

Please ensure sufficient SMS balance for automated monthly results.

- CoachManager SMS System
          `.trim();
          
          // For now, we'll use a simple notification system
          // In a real system, you might want to send this via email or internal notification
          console.log(`📱 Alert for teacher ${teacher.firstName}: ${alertMessage}`);
          
          // You could also save this as a notification in the database
          await this.saveNotificationAlert(teacher.id, alertMessage, 'monthly_sms_alert');
          
          totalAlertsSent++;
          
        } catch (error) {
          console.error(`Error sending alert to teacher ${teacher.id}:`, error);
        }
      }
      
      console.log(`📱 Successfully sent ${totalAlertsSent} month-end SMS alerts to teachers`);
      
    } catch (error) {
      console.error('💥 Error sending month-end alerts:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Send monthly results SMS (triggered on first day of month)
   */
  async sendMonthlyResultsSMS() {
    try {
      console.log('📱 Processing monthly results SMS...');
      
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;
      
      // Get all active teachers
      const teachers = await storage.getUsersByRole('teacher');
      
      for (const teacher of teachers) {
        try {
          // Send monthly results SMS for each teacher
          const result = await bulkSMSService.sendMonthlyResultSMS(month, year, teacher.id);
          
          if (result && result.length > 0) {
            const totalSent = result.reduce((sum, batch) => sum + batch.smsRequired, 0);
            console.log(`📱 Teacher ${teacher.firstName}: ${totalSent} monthly result SMS sent`);
          }
          
        } catch (error) {
          console.error(`Error sending monthly SMS for teacher ${teacher.id}:`, error);
          
          // If balance is insufficient, save the results but don't send SMS
          if (error instanceof Error && error.message?.includes('insufficient balance')) {
            console.log(`💰 Insufficient balance for teacher ${teacher.firstName}, results saved without SMS`);
            
            // Send alert to teacher about saved results
            const alertMessage = `
⚠️ Monthly Results Saved (SMS Not Sent)

Your monthly results for ${month}/${year} have been saved successfully.

SMS notifications were not sent due to insufficient balance.
Please request SMS credits from the super admin.

- CoachManager System
            `.trim();
            
            await this.saveNotificationAlert(teacher.id, alertMessage, 'insufficient_balance_alert');
          }
        }
      }
      
    } catch (error) {
      console.error('💥 Error in monthly results SMS processing:', error);
    }
  }
  
  /**
   * Save notification alert in database (you can implement this based on your notification system)
   */
  private async saveNotificationAlert(userId: string, message: string, type: string) {
    try {
      // This is a placeholder - implement based on your notification system
      console.log(`💾 Saving notification for user ${userId}: ${type}`);
      
      // You might want to save this in a notifications table or send via another method
      // For now, we'll just log it
      
    } catch (error) {
      console.error('Error saving notification alert:', error);
    }
  }
  
  /**
   * Manually trigger month-end alerts (for testing)
   */
  async manualTriggerMonthEndAlerts() {
    console.log('🚀 Manual trigger: month-end SMS alerts');
    await this.sendMonthEndAlerts();
  }
  
  /**
   * Manually trigger monthly results SMS (for testing)
   */
  async manualTriggerMonthlyResults(year?: number, month?: number) {
    console.log('🚀 Manual trigger: monthly results SMS');
    
    if (year && month) {
      // Override dates for manual testing
      const originalSend = bulkSMSService.sendMonthlyResultSMS;
      bulkSMSService.sendMonthlyResultSMS = async (m: number, y: number, teacherId: string) => {
        return originalSend.call(bulkSMSService, month, year, teacherId);
      };
    }
    
    await this.sendMonthlyResultsSMS();
  }
  
  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SMSSchedulerConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    console.log('📱 SMS scheduler config updated:', this.config);
    
    // Restart scheduler if it was running
    if (this.intervalId) {
      this.stopScheduler();
      this.startScheduler();
    }
  }
  
  /**
   * Get current scheduler status
   */
  getStatus() {
    const now = new Date();
    const isSecondToLastDay = this.isSecondToLastDayOfMonth(now);
    const isFirstDayOfMonth = now.getDate() === 1;
    
    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isProcessing,
      config: this.config,
      nextCheck: 'Every hour for SMS alerts',
      todayIsMonthEndAlert: isSecondToLastDay,
      todayIsMonthlyResults: isFirstDayOfMonth,
      currentTime: now.toISOString()
    };
  }
}

// Export singleton instance
export const smsScheduler = new SMSScheduler();

// Auto-start the SMS scheduler when module loads
if (process.env.NODE_ENV !== 'test') {
  smsScheduler.startScheduler();
  console.log('📱 SMS Scheduler auto-started');
}