import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export class Database {
    public prisma: PrismaClient;

    constructor() {
        const connectionString = `${process.env.DATABASE_URL}`;
        const adapter = new PrismaPg({ connectionString });
        this.prisma = new PrismaClient({ adapter });
    }

    async getClient(): Promise<PrismaClient> {
        await this.prisma.$connect();
        console.log('Database connected successfully');
        return this.prisma;
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
        console.log('Database disconnected successfully');
    }
}

export const db = new Database();
export const prisma = db.prisma;