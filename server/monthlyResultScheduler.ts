/**
 * Monthly Result Scheduler
 * Handles automated scheduling and triggering of monthly result processing
 */

import { automatedMonthlyResultsService } from './automatedMonthlyResults';

export class MonthlyResultScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private lastProcessedMonth = '';
  
  /**
   * Start the scheduler - checks every hour for month changes
   */
  startScheduler() {
    if (this.intervalId) {
      console.log('⏰ Monthly result scheduler already running');
      return;
    }
    
    // Check every hour for new month
    this.intervalId = setInterval(async () => {
      await this.checkForNewMonth();
    }, 60 * 60 * 1000); // 1 hour
    
    // Also run initial check
    this.checkForNewMonth();
    
    console.log('🚀 Monthly result scheduler started - checking every hour for new months');
  }
  
  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Monthly result scheduler stopped');
    }
  }
  
  /**
   * Check if we've entered a new month and process previous month
   */
  private async checkForNewMonth() {
    try {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      // If this is the same month we've already checked, skip
      if (this.lastProcessedMonth === currentMonthKey) {
        return;
      }
      
      // If it's the first day of the month, process last month
      if (now.getDate() === 1) {
        await this.processLastMonth();
      }
      
      this.lastProcessedMonth = currentMonthKey;
      
    } catch (error) {
      console.error('Error checking for new month:', error);
    }
  }
  
  /**
   * Process previous month's results
   */
  async processLastMonth() {
    if (this.isProcessing) {
      console.log('⚠️ Monthly processing already in progress, skipping...');
      return;
    }
    
    try {
      this.isProcessing = true;
      
      // Get last month's year and month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;
      
      console.log(`📅 Starting automated processing for ${month}/${year}`);
      
      // Check if already processed
      const alreadyProcessed = await automatedMonthlyResultsService.isMonthAlreadyProcessed(year, month);
      
      if (alreadyProcessed) {
        console.log(`✅ Monthly results for ${month}/${year} already processed, skipping`);
        return;
      }
      
      // Process the results
      const stats = await automatedMonthlyResultsService.processMonthlyResults(year, month);
      
      console.log(`🎉 Successfully processed monthly results for ${month}/${year}:`, stats);
      
    } catch (error) {
      console.error('💥 Error in automated monthly processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Manually trigger processing for current or specific month
   */
  async manualTrigger(year?: number, month?: number) {
    if (this.isProcessing) {
      throw new Error('Monthly processing already in progress');
    }
    
    try {
      this.isProcessing = true;
      
      // Use current month if not specified
      if (!year || !month) {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
      }
      
      console.log(`🚀 Manual trigger: processing ${month}/${year}`);
      
      const stats = await automatedMonthlyResultsService.processMonthlyResults(year, month);
      
      console.log(`✅ Manual processing completed for ${month}/${year}:`, stats);
      return stats;
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isProcessing,
      lastProcessedMonth: this.lastProcessedMonth,
      nextCheck: 'Every hour for new months'
    };
  }
}

// Export singleton instance
export const monthlyResultScheduler = new MonthlyResultScheduler();