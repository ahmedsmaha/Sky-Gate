import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

function prismaAdapter() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
}

export { prismaAdapter };

