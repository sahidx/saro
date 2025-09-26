import pg from 'pg'; 
const { Pool } = pg;
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as pgSchema from "@shared/schema";
import * as sqliteSchema from "@shared/sqlite-schema";

// Environment validation
class DatabaseConfig {
  private static instance: DatabaseConfig;
  private _pool: typeof Pool.prototype | null = null;
  private _sqlite: Database.Database | null = null;
  private _db: any = null;
  private _isPostgreSQL: boolean = false;
  
  private constructor() {
    this.validateEnvironment();
    this.initializeConnection();
  }
  
  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }
  
  private validateEnvironment(): void {
    const requiredVars = ['DATABASE_URL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please ensure your database is properly configured and environment variables are set.'
      );
    }
    
    // Check database type
    const dbUrl = process.env.DATABASE_URL!;
    this._isPostgreSQL = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
    const isSQLite = dbUrl.startsWith('file:');
    
    if (!this._isPostgreSQL && !isSQLite) {
      throw new Error(
        'DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...) or SQLite file path (file:...)'
      );
    }
    
    console.log('✅ Database environment validation passed');
  }
  
  private initializeConnection(): void {
    try {
      const dbUrl = process.env.DATABASE_URL!;
      
      if (this._isPostgreSQL) {
        // PostgreSQL connection
        const parsedUrl = new URL(dbUrl);
        
        this._pool = new Pool({
          connectionString: dbUrl,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          maxUses: 7500,
        });
        
        this._db = drizzleNeon(this._pool, { schema: pgSchema });
        console.log(`✅ PostgreSQL connection initialized for host: ${parsedUrl.hostname}`);
      } else {
        // SQLite connection
        const sqlitePath = dbUrl.replace('file:', '');
        this._sqlite = new Database(sqlitePath);
        this._db = drizzleSQLite(this._sqlite, { schema: sqliteSchema });
        console.log(`✅ SQLite connection initialized for file: ${sqlitePath}`);
      }
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error(
        `Failed to initialize database connection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  public get pool(): any {
    if (this._isPostgreSQL && !this._pool) {
      throw new Error('Database pool not initialized');
    }
    if (!this._isPostgreSQL && !this._sqlite) {
      throw new Error('SQLite database not initialized');
    }
    return this._pool || this._sqlite;
  }
  
  public get db(): any {
    if (!this._db) {
      throw new Error('Database client not initialized');
    }
    return this._db;
  }
  
  // Health check method for VPS monitoring
  public async healthCheck(): Promise<{ status: string; timestamp: string; details?: any }> {
    try {
      if (this._isPostgreSQL) {
        const result = await this._db.execute('SELECT 1 as health_check');
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          details: {
            connected: true,
            result: result.rows?.[0] || result[0]
          }
        };
      } else {
        // SQLite health check
        const result = this._sqlite?.prepare('SELECT 1 as health_check').get();
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          details: {
            connected: true,
            result: result
          }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  // Graceful shutdown for VPS deployment
  public async close(): Promise<void> {
    try {
      if (this._pool && this._isPostgreSQL) {
        await this._pool.end();
        console.log('✅ PostgreSQL connection pool closed gracefully');
      } else if (this._sqlite && !this._isPostgreSQL) {
        this._sqlite.close();
        console.log('✅ SQLite database closed gracefully');
      }
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }
}

// Export singleton instance
const dbConfig = DatabaseConfig.getInstance();
export const pool = dbConfig.pool;
export const db = dbConfig.db;
export const dbHealthCheck = dbConfig.healthCheck.bind(dbConfig);
export const closeDatabase = dbConfig.close.bind(dbConfig);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, closing database connections...');
  await closeDatabase();
  process.exit(0);
});