// Debug environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test database URL validation
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL starts with file:?', dbUrl.startsWith('file:'));
console.log('Database URL starts with postgresql:?', dbUrl.startsWith('postgresql://'));
console.log('Database URL starts with postgres:?', dbUrl.startsWith('postgres://'));

const isPostgreSQL = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const isSQLite = dbUrl.startsWith('file:');

console.log('Is PostgreSQL?', isPostgreSQL);
console.log('Is SQLite?', isSQLite);
console.log('Valid database type?', isPostgreSQL || isSQLite);