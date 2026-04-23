# RentNao

A modern rental property management backend API built with Hono, TypeScript, and PostgreSQL.

## Quick Start

### Prerequisites

Install [Bun](https://bun.sh) and [Docker](https://www.docker.com/products/docker-desktop):

**macOS (Homebrew):**
```bash
brew install oven-sh/bun/bun
brew install --cask docker
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://bun.sh/install | bash
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER  # Add user to docker group
```

**Windows:**
Download and install from:
- [Bun](https://bun.sh)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Installation

1. **Clone & Install dependencies:**
   ```bash
   bun install
   ```

2. **Start Docker containers** (PostgreSQL, Redis, MinIO):
   ```bash
   docker compose up -d
   ```

3. **Setup the database:**
   ```bash
   bun run db:push
   ```

4. **Start development server:**
   ```bash
   bun run dev
   ```

   Server runs at `http://localhost:3000`  
   OpenAPI docs: `http://localhost:3000/docs`

## Docker Services

The `docker-compose.yml` includes three containerized services:

| Service | Port | Credentials | Volume |
|---------|------|-------------|--------|
| **PostgreSQL** | 5432 | user/password | `postgres_data` |
| **Redis** | 6379 | (no auth) | `redis_data` |
| **MinIO (S3)** | 9000, 9001 | minioadmin/minioadmin | `minio_data` |

**Start containers:**
```bash
docker-compose up -d
```

**Stop containers:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

**Access MinIO console:**
Open `http://localhost:9001` with credentials: `minioadmin` / `minioadmin`

## Environment Setup

1. **Copy example env file:**
   ```bash
   cp .env.example .env
   ```

2. **For Docker services, use defaults:**
   - Database: `postgresql://user:password@localhost:5432/rentnao?schema=public`
   - Redis: `localhost:6379`
   - MinIO S3: `http://localhost:9000` (minioadmin/minioadmin)

## Available Commands

```bash
bun run dev              # Watch mode development server
bun run start            # Start production server
bun run build            # Build for production
bun run db:push          # Sync Prisma schema to database
bun run db:migrate       # Run database migrations
bun run db:generate      # Generate Prisma client
bun run db:studio        # Open Prisma Studio
bun run lint             # Check code style
bun run format           # Format code with Prettier
```

## Project Structure

```
src/
├── index.ts                              # Application entry point
├── config/
│   ├── env.ts                           # Environment variables
│   └── openapi.ts                       # Scalar configuration
├── db/
│   ├── client.ts                        # PostgreSQL connection pool
│   └── redis.ts                         # Redis cache client
├── errors/
│   ├── base.ts                          # AppError base class
│   ├── auth.ts                          # Auth-specific errors
│   ├── admin.ts                         # Admin-specific errors
│   ├── database.ts                      # Database errors
│   ├── validation.ts                    # Validation errors
│   ├── redis.ts                         # Redis errors
│   └── index.ts                         # Error exports
├── middlewares/
│   └── error-handler.ts                 # Global error handler
├── modules/
│   ├── admin/                           # Admin operations
│   │   ├── controllers/                 # Request handlers
│   │   ├── services/                    # Business logic
│   │   ├── routes/                      # API routes
│   │   ├── schemas/                     # Zod validation schemas
│   │   └── middlewares/
│   │       └── admin-auth.ts            # Admin authorization
│   ├── auth/                            # Authentication & JWT
│   │   ├── controllers/                 # Login, register, password, verification handlers
│   │   ├── services/                    # Auth logic, token storage
│   │   ├── routes/                      # Auth endpoints
│   │   ├── schemas/                     # Request/response validation
│   │   ├── middlewares/
│   │   │   └── auth.ts                  # JWT verification
│   │   ├── config/
│   │   │   └── token-ttl.ts             # Token expiration times
│   │   ├── types/
│   │   │   └── auth.types.ts            # TypeScript types
│   │   └── utils/                       # JWT, password, token utilities
│   ├── health/
│   │   └── routes.ts                    # Health check endpoint
│   └── users/
│       ├── controllers/                 # Profile, verification handlers
│       ├── services/                    # User profile, KYC logic
│       ├── routes/                      # User endpoints
│       ├── schemas/                     # User validation schemas
│       └── types/                       # User types
├── types/
│   ├── common.ts                        # Shared types
│   └── enums.ts                         # Enums (UserRole, Status, etc)
└── utils/
    └── response.ts                      # Response utilities
```

## API Documentation

Full OpenAPI documentation available after starting the server:
```
http://localhost:3000/docs
```

## Development

**Code style:**
```bash
bun run format      # Auto-format code
bun run lint        # Check formatting
```

**Database changes:**
```bash
# Edit prisma/schema.prisma, then:
bun run db:migrate
```

## Production Build

```bash
bun run build       # Creates dist/index.js (2.52MB)
bun run dist/index.js
```

## Troubleshooting

**Port already in use:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Docker container issues:**
```bash
# Remove containers and volumes (data loss)
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

**Database connection error:**
```bash
# Check PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
```

---

Built with [Hono](https://hono.dev), [Bun](https://bun.sh), and [Prisma](https://www.prisma.io)
