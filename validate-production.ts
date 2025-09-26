#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * This script validates that all systems are ready for production deployment
 * Usage: npm run validate-production
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// ANSI colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

class ProductionValidator {
  private results: CheckResult[] = [];

  private log(type: 'info' | 'success' | 'warn' | 'error', message: string) {
    const prefix = {
      info: `${colors.blue}ℹ${colors.reset}`,
      success: `${colors.green}✅${colors.reset}`,
      warn: `${colors.yellow}⚠️${colors.reset}`,
      error: `${colors.red}❌${colors.reset}`
    }[type];
    
    console.log(`${prefix} ${message}`);
  }

  private addResult(result: CheckResult) {
    this.results.push(result);
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    this.log(result.status === 'pass' ? 'success' : result.status === 'warn' ? 'warn' : 'error',
      `${result.name}: ${result.message}`);
    
    if (result.details) {
      console.log(`   ${colors.blue}Details:${colors.reset} ${result.details}`);
    }
  }

  private async runCommand(command: string, args: string[] = []): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`));
        }
      });
    });
  }

  // Check Node.js version
  async checkNodeVersion() {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.substring(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.addResult({
          name: 'Node.js Version',
          status: 'pass',
          message: `Node.js ${version} is compatible`,
        });
      } else {
        this.addResult({
          name: 'Node.js Version',
          status: 'fail',
          message: `Node.js ${version} is outdated. Minimum required: v18.0.0`,
        });
      }
    } catch (error) {
      this.addResult({
        name: 'Node.js Version',
        status: 'fail',
        message: 'Failed to check Node.js version',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Check if all required files exist
  async checkRequiredFiles() {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'drizzle.config.ts',
      'server/index.ts',
      'server/routes.ts',
      'server/db.ts',
      'shared/schema.ts',
      'client/src/App.tsx',
      'server/production-db.ts',
      'server/error-handling.ts',
      'server/health-monitoring.ts'
    ];

    let missingFiles: string[] = [];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length === 0) {
      this.addResult({
        name: 'Required Files',
        status: 'pass',
        message: 'All required files are present'
      });
    } else {
      this.addResult({
        name: 'Required Files',
        status: 'fail',
        message: `Missing required files: ${missingFiles.join(', ')}`
      });
    }
  }

  // Check environment configuration
  async checkEnvironmentConfig() {
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'SESSION_SECRET',
      'PORT'
    ];

    const recommendedEnvVars = [
      'SMS_API_KEY',
      'SMTP_USER',
      'UPLOAD_DIR',
      'ALLOWED_ORIGINS'
    ];

    try {
      // Check if .env.production exists
      let envFile = '.env';
      try {
        await fs.access('.env.production');
        envFile = '.env.production';
      } catch {
        // Use .env if .env.production doesn't exist
      }

      const envContent = await fs.readFile(envFile, 'utf8');
      
      // Parse .env content
      const envVars = new Set<string>();
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key] = trimmed.split('=');
          if (key) envVars.add(key.trim());
        }
      });

      const missing = requiredEnvVars.filter(env => !envVars.has(env));
      const missingRecommended = recommendedEnvVars.filter(env => !envVars.has(env));

      if (missing.length === 0) {
        this.addResult({
          name: 'Environment Variables',
          status: missingRecommended.length > 0 ? 'warn' : 'pass',
          message: 'All required environment variables configured',
          details: missingRecommended.length > 0 ? `Recommended missing: ${missingRecommended.join(', ')}` : undefined
        });
      } else {
        this.addResult({
          name: 'Environment Variables',
          status: 'fail',
          message: `Missing required environment variables: ${missing.join(', ')}`
        });
      }
    } catch {
      this.addResult({
        name: 'Environment Variables',
        status: 'fail',
        message: 'Environment file not found (.env or .env.production)'
      });
    }
  }

  // Check production-ready features
  async checkProductionFeatures() {
    try {
      const serverContent = await fs.readFile('server/index.ts', 'utf8');
      
      const features = [
        { check: 'health-monitoring', name: 'Health monitoring system' },
        { check: 'safeInitializeDatabase', name: 'Production database initialization' },
        { check: 'helmet', name: 'Security headers' },
        { check: 'rateLimit', name: 'Rate limiting' }
      ];
      
      // Check for error handling files separately
      let errorHandlingExists = false;
      try {
        await fs.access('server/error-handling.ts');
        errorHandlingExists = true;
      } catch {}
      
      if (errorHandlingExists) {
        features.push({ check: 'errorHandler', name: 'Error handling middleware' });
      }
      
      const configuredFeatures = features.filter(({ check }) => 
        serverContent.includes(check)
      );
      
      if (configuredFeatures.length === features.length) {
        this.addResult({
          name: 'Production Features',
          status: 'pass',
          message: 'All production features are configured'
        });
      } else {
        const missing = features.filter(({ check }) => 
          !serverContent.includes(check)
        );
        this.addResult({
          name: 'Production Features',
          status: 'warn',
          message: `Missing features: ${missing.map(f => f.name).join(', ')}`
        });
      }
    } catch (error) {
      this.addResult({
        name: 'Production Features',
        status: 'fail',
        message: 'Failed to check production features',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Check fee collection system
  async checkFeeCollectionSystem() {
    try {
      // Check schema for studentFees table
      const schemaContent = await fs.readFile('shared/schema.ts', 'utf8');
      const hasFeesTable = schemaContent.includes('studentFees') || schemaContent.includes('studentFeesTable');
      
      // Check API routes
      const routesContent = await fs.readFile('server/routes.ts', 'utf8');
      const hasFeeRoutes = routesContent.includes('/api/fees');
      
      // Check UI component
      let hasFeesUI = false;
      try {
        await fs.access('client/src/pages/FeeCollection.tsx');
        hasFeesUI = true;
      } catch {}
      
      if (hasFeesTable && hasFeeRoutes && hasFeesUI) {
        this.addResult({
          name: 'Fee Collection System',
          status: 'pass',
          message: 'Fee collection system is complete'
        });
      } else {
        const missing = [];
        if (!hasFeesTable) missing.push('database schema');
        if (!hasFeeRoutes) missing.push('API routes');
        if (!hasFeesUI) missing.push('UI component');
        
        this.addResult({
          name: 'Fee Collection System',
          status: 'fail',
          message: `Incomplete fee collection system: missing ${missing.join(', ')}`
        });
      }
    } catch (error) {
      this.addResult({
        name: 'Fee Collection System',
        status: 'fail',
        message: 'Failed to validate fee collection system',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Check dependencies
  async checkDependencies() {
    try {
      // Check if node_modules exists
      try {
        await fs.access('node_modules');
        this.addResult({
          name: 'Dependencies',
          status: 'pass',
          message: 'Dependencies are installed'
        });
      } catch {
        this.addResult({
          name: 'Dependencies',
          status: 'fail',
          message: 'Dependencies not installed. Run: npm ci'
        });
      }
      
    } catch (error) {
      this.addResult({
        name: 'Dependencies',
        status: 'fail',
        message: 'Failed to check dependencies',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Check if build works
  async checkBuildProcess() {
    try {
      // Check if dist directories exist (from previous builds)
      const buildPaths = ['dist/index.js', 'dist/public/index.html'];
      let foundArtifacts = 0;
      
      for (const buildPath of buildPaths) {
        try {
          await fs.access(buildPath);
          foundArtifacts++;
        } catch {}
      }
      
      if (foundArtifacts === buildPaths.length) {
        this.addResult({
          name: 'Build Process',
          status: 'pass',
          message: 'Application has been built successfully'
        });
      } else if (foundArtifacts > 0) {
        this.addResult({
          name: 'Build Process',
          status: 'warn',
          message: 'Partial build artifacts found. Run: npm run build'
        });
      } else {
        this.addResult({
          name: 'Build Process',
          status: 'warn',
          message: 'No build artifacts found. Run: npm run build'
        });
      }
    } catch (error) {
      this.addResult({
        name: 'Build Process',
        status: 'fail',
        message: 'Failed to check build process',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Check deployment files
  async checkDeploymentFiles() {
    const deploymentFiles = [
      'vps-setup.sh',
      '.env.production',
      'ecosystem.config.js'
    ];

    let missingFiles: string[] = [];
    
    for (const file of deploymentFiles) {
      try {
        await fs.access(file);
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length === 0) {
      this.addResult({
        name: 'Deployment Files',
        status: 'pass',
        message: 'All deployment files are present'
      });
    } else {
      this.addResult({
        name: 'Deployment Files',
        status: 'warn',
        message: `Missing deployment files: ${missingFiles.join(', ')}`
      });
    }
  }

  // Run all validation checks
  async validate() {
    console.log(`${colors.bold}🔍 CoachManager Production Validation${colors.reset}\n`);
    
    this.log('info', 'Starting production readiness validation...\n');

    // Run all checks
    await this.checkNodeVersion();
    await this.checkRequiredFiles();
    await this.checkEnvironmentConfig();
    await this.checkProductionFeatures();
    await this.checkFeeCollectionSystem();
    await this.checkDependencies();
    await this.checkBuildProcess();
    await this.checkDeploymentFiles();

    // Summary
    console.log(`\n${colors.bold}📊 Validation Summary${colors.reset}`);
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    
    if (failed > 0) {
      console.log(`\n${colors.red}${colors.bold}🚨 VALIDATION FAILED${colors.reset}`);
      console.log('Please fix the failed checks before deploying to production.');
      
      console.log('\n📋 Quick Fixes:');
      const failedChecks = this.results.filter(r => r.status === 'fail');
      failedChecks.forEach(check => {
        console.log(`   • ${check.name}: ${check.message}`);
      });
      
      process.exit(1);
    } else if (warnings > 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  VALIDATION PASSED WITH WARNINGS${colors.reset}`);
      console.log('Consider addressing the warnings for optimal production deployment.');
    } else {
      console.log(`\n${colors.green}${colors.bold}🎉 ALL VALIDATIONS PASSED${colors.reset}`);
      console.log('Your application is ready for production deployment!');
    }
    
    console.log('\n🚀 Next Steps for VPS Deployment:');
    console.log('1. Copy all files to your VPS');
    console.log('2. Run: chmod +x vps-setup.sh && ./vps-setup.sh');
    console.log('3. Configure your .env file with production values');
    console.log('4. Set up your domain and SSL certificate');
    console.log('5. Run: npm run build && npm start');
    console.log('6. Test all functionality');
    
    console.log('\n📍 Production URLs will be:');
    console.log('   • Application: https://yourdomain.com');
    console.log('   • Health Check: https://yourdomain.com/health');
    console.log('   • Metrics: https://yourdomain.com/metrics');
  }
}

// Run validation
const validator = new ProductionValidator();
validator.validate().catch(error => {
  console.error(`\n${colors.red}${colors.bold}💥 Validation script failed:${colors.reset}`, error.message);
  process.exit(1);
});