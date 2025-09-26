import { Request, Response } from 'express';
import { db } from './db.js';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    fileSystem: HealthCheck;
    memory: HealthCheck;
    env: HealthCheck;
    sms?: HealthCheck;
  };
  system: {
    platform: string;
    nodeVersion: string;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: any;
}

// Performance monitoring
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
const startTime = Date.now();

export function incrementRequestCount() {
  requestCount++;
}

export function incrementErrorCount() {
  errorCount++;
}

export function addResponseTime(time: number) {
  totalResponseTime += time;
}

// Database health check
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    // Simple query to check database connectivity
    await db.execute(sql`SELECT 1`);
    
    const responseTime = Date.now() - startTime;
    return {
      status: 'pass',
      responseTime,
      message: 'Database connection successful'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      responseTime,
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// File system health check
async function checkFileSystem(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // Check if upload directory exists and is writable
    await fs.access(uploadDir, fs.constants.F_OK | fs.constants.W_OK);
    
    // Test write operation
    const testFile = path.join(uploadDir, '.health-check');
    await fs.writeFile(testFile, 'health-check');
    await fs.unlink(testFile);
    
    const responseTime = Date.now() - startTime;
    return {
      status: 'pass',
      responseTime,
      message: 'File system accessible and writable'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      responseTime,
      message: 'File system check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Memory health check
function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memoryUsagePercent = (usedMem / totalMem) * 100;
  
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let message = `Memory usage: ${memoryUsagePercent.toFixed(2)}%`;
  
  if (memoryUsagePercent > 90) {
    status = 'fail';
    message += ' - Critical memory usage';
  } else if (memoryUsagePercent > 80) {
    status = 'warn';
    message += ' - High memory usage';
  }
  
  return {
    status,
    message,
    details: {
      heapUsed: Math.round(usedMem / 1024 / 1024) + ' MB',
      heapTotal: Math.round(totalMem / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
    }
  };
}

// Environment health check
function checkEnvironment(): HealthCheck {
  const requiredEnvVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'SESSION_SECRET',
    'PORT'
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    return {
      status: 'fail',
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  const warnings = [];
  if (!process.env.SMS_API_KEY) warnings.push('SMS_API_KEY not configured');
  if (!process.env.SMTP_USER) warnings.push('Email SMTP not configured');
  
  return {
    status: warnings.length > 0 ? 'warn' : 'pass',
    message: warnings.length > 0 ? `Warnings: ${warnings.join(', ')}` : 'All required environment variables present',
    details: { warnings }
  };
}

// SMS service health check (optional)
async function checkSMSService(): Promise<HealthCheck> {
  if (!process.env.SMS_API_KEY) {
    return {
      status: 'warn',
      message: 'SMS service not configured'
    };
  }
  
  // For now, just check if credentials are present
  // In a real implementation, you might want to test with the SMS provider
  return {
    status: 'pass',
    message: 'SMS service configured'
  };
}

// Main health check handler
export async function healthCheck(req: Request, res: Response) {
  const checkStartTime = Date.now();
  
  try {
    // Run all health checks
    const [database, fileSystem, memory, env, sms] = await Promise.allSettled([
      checkDatabase(),
      checkFileSystem(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkEnvironment()),
      checkSMSService()
    ]);
    
    // Determine overall status
    const checks = {
      database: database.status === 'fulfilled' ? database.value : { status: 'fail' as const, message: 'Check failed' },
      fileSystem: fileSystem.status === 'fulfilled' ? fileSystem.value : { status: 'fail' as const, message: 'Check failed' },
      memory: memory.status === 'fulfilled' ? memory.value : { status: 'fail' as const, message: 'Check failed' },
      env: env.status === 'fulfilled' ? env.value : { status: 'fail' as const, message: 'Check failed' },
      sms: sms.status === 'fulfilled' ? sms.value : { status: 'fail' as const, message: 'Check failed' }
    };
    
    // Determine overall health status
    const hasFailures = Object.values(checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasFailures) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    }
    
    const uptime = Date.now() - startTime;
    const avgResponseTime = requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0;
    
    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime / 1000), // in seconds
      version: process.env.npm_package_version || '1.0.0',
      checks,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
    
    // Set appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(healthResult);
    
    // Log health check results
    console.log(`Health check completed in ${Date.now() - checkStartTime}ms - Status: ${overallStatus}`);
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Metrics endpoint for monitoring
export function getMetrics(req: Request, res: Response) {
  const uptime = Date.now() - startTime;
  const avgResponseTime = requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0;
  const errorRate = requestCount > 0 ? Math.round((errorCount / requestCount) * 100) : 0;
  
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime / 1000),
    requests: {
      total: requestCount,
      errors: errorCount,
      errorRate: `${errorRate}%`,
      averageResponseTime: `${avgResponseTime}ms`
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };
  
  res.json(metrics);
}

// Middleware to track request metrics
export function requestMetrics(req: Request, res: Response, next: Function) {
  const startTime = Date.now();
  
  incrementRequestCount();
  
  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    addResponseTime(responseTime);
    
    // Track errors (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      incrementErrorCount();
    }
  });
  
  next();
}

// Graceful shutdown handler
export function setupGracefulShutdown() {
  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    // Close database connections, servers, etc.
    process.exit(0);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}