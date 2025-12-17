# Product Management Service

This project is a Product Management Service built with Node.js, Express, Prisma, and PostgreSQL.

## Prerequisites

- Docker
- Docker Compose

## Installation & Running

1.  Ensure you have a `.env` file in the root directory. You can use the provided `.env` file as a reference.

2.  Start the application and its dependencies (PostgreSQL, Redis) using Docker Compose:

    ```bash
    docker compose up -d
    ```

    This command will:
    - Start the PostgreSQL database and Redis cache.
    - Run database migrations (`npx prisma migrate dev --name init`).
    - Generate the Prisma client.
    - Seed the database.
    - Build and start the application.

3.  The application will be available at `http://localhost:3000`.

## Testing

To run the tests (optional):

```bash
npm run test
```
