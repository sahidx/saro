/**
 * Automated Monthly Results API Routes
 * Provides endpoints for automated monthly result management
 */

import { Router } from 'express';
import { automatedMonthlyResultsService } from './automatedMonthlyResults';
import { monthlyResultScheduler } from './monthlyResultScheduler';
import { isAuthenticated } from './localAuth';

// Simple role check middleware
const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    
    next();
  };
};

const router = Router();

/**
 * GET /api/automated-monthly/status
 * Get automated processing status
 */
router.get('/status', requireRole(['teacher', 'superUser']), async (req, res) => {
  try {
    const schedulerStatus = monthlyResultScheduler.getStatus();
    res.json({
      success: true,
      data: schedulerStatus
    });
  } catch (error) {
    console.error('Error getting automation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get automation status'
    });
  }
});

/**
 * POST /api/automated-monthly/manual-trigger
 * Manually trigger monthly result processing
 */
router.post('/manual-trigger', requireRole(['superUser']), async (req, res) => {
  try {
    const { year, month } = req.body;
    
    // Validate inputs
    if (year && (year < 2020 || year > 2030)) {
      return res.status(400).json({
        success: false,
        error: 'Year must be between 2020 and 2030'
      });
    }
    
    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({
        success: false,
        error: 'Month must be between 1 and 12'
      });
    }
    
    const stats = await monthlyResultScheduler.manualTrigger(year, month);
    
    res.json({
      success: true,
      message: `Monthly results processed successfully for ${month || 'current month'}/${year || 'current year'}`,
      data: stats
    });
    
  } catch (error) {
    console.error('Error in manual trigger:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process monthly results'
    });
  }
});

/**
 * GET /api/automated-monthly/processing-stats/:year/:month
 * Get processing statistics for a specific month
 */
router.get('/processing-stats/:year/:month', requireRole(['teacher', 'superUser']), async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month parameter'
      });
    }
    
    const stats = await automatedMonthlyResultsService.getProcessingStats(year, month);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `No results found for ${month}/${year}`
      });
    }
    
    res.json({
      success: true,
      data: {
        year,
        month,
        ...stats
      }
    });
    
  } catch (error) {
    console.error('Error getting processing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get processing statistics'
    });
  }
});

/**
 * GET /api/automated-monthly/check-processed/:year/:month
 * Check if a month has been processed
 */
router.get('/check-processed/:year/:month', requireRole(['teacher', 'superUser']), async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month parameter'
      });
    }
    
    const isProcessed = await automatedMonthlyResultsService.isMonthAlreadyProcessed(year, month);
    
    res.json({
      success: true,
      data: {
        year,
        month,
        isProcessed,
        message: isProcessed 
          ? `Results for ${month}/${year} have been processed` 
          : `Results for ${month}/${year} have not been processed yet`
      }
    });
    
  } catch (error) {
    console.error('Error checking processed status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check processing status'
    });
  }
});

/**
 * POST /api/automated-monthly/start-scheduler
 * Start the automated scheduler
 */
router.post('/start-scheduler', requireRole(['superUser']), async (req, res) => {
  try {
    monthlyResultScheduler.startScheduler();
    
    res.json({
      success: true,
      message: 'Automated monthly result scheduler started'
    });
    
  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler'
    });
  }
});

/**
 * POST /api/automated-monthly/stop-scheduler
 * Stop the automated scheduler
 */
router.post('/stop-scheduler', requireRole(['superUser']), async (req, res) => {
  try {
    monthlyResultScheduler.stopScheduler();
    
    res.json({
      success: true,
      message: 'Automated monthly result scheduler stopped'
    });
    
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler'
    });
  }
});

/**
 * GET /api/automated-monthly/available-months
 * Get list of months that can be processed (have regular exams)
 */
router.get('/available-months', requireRole(['teacher', 'superUser']), async (req, res) => {
  try {
    // This would typically query for months that have regular exams
    // For now, return last 6 months
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const isProcessed = await automatedMonthlyResultsService.isMonthAlreadyProcessed(year, month);
      
      months.push({
        year,
        month,
        monthName: date.toLocaleString('default', { month: 'long' }),
        isProcessed,
        canProcess: month < now.getMonth() + 1 || year < now.getFullYear() // Can't process future months
      });
    }
    
    res.json({
      success: true,
      data: months
    });
    
  } catch (error) {
    console.error('Error getting available months:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available months'
    });
  }
});

export { router as automatedMonthlyResultsRouter };