import dotenv from 'dotenv';
import path from 'path';

// Explicitly load from .env.local
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
}

console.log('--- ENV DEBUG ---');
console.log('Parsed:', result.parsed);
console.log('Process.env User:', process.env.POSTGRES_USER);
console.log('Process.env Pass:', process.env.POSTGRES_PASSWORD);
console.log('Process.env Port:', process.env.POSTGRES_PORT);
console.log('-----------------');
