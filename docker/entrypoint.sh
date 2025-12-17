#!/bin/sh
set -e

echo "Starting initialization sequence..."

echo "Running migrations..."
npx prisma migrate dev --name init

echo "Generating Prisma client..."
npx prisma generate

echo "Seeding database..."
npm run seed

echo "Building application..."
npm run build

echo "Starting application..."
npm run start
