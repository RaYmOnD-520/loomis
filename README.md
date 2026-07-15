# Loomis

A production-style distributed task queue system built with TypeScript, NestJS, and React.

## Overview

Loomis is a robust asynchronous job processing system that demonstrates modern backend and frontend patterns for handling distributed task queues. The system provides:

- **Async Job Processing**: Submit jobs via REST API and track their lifecycle from pending → processing → completed/failed
- **Automatic Retries**: Built-in retry mechanism with exponential backoff for transient failures
- **Real-time Monitoring**: Live dashboard showing queue health, job statistics, and recent job history
- **Production-Ready Patterns**: Redis-backed persistence, configurable concurrency, structured logging

Perfect for demonstrating skills in distributed systems, queue architecture, and full-stack TypeScript development.

## Tech Stack

**Backend:**
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Redis](https://redis.io/) - In-memory data store for queue persistence
- [BullMQ](https://docs.bullmq.io/) - Modern Redis-based queue library

**Frontend:**
- [React 18](https://react.dev/) - UI library
- [Vite](https://vite.dev/) - Next-generation frontend tooling
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Full type safety across the stack

## Features

- ✅ **Job Submission API** - REST endpoint with payload validation using class-validator DTOs
- ✅ **Redis-Backed Queue** - Persistent job storage with configurable concurrency (default: 1 worker, sequential processing)
- ✅ **Automatic Retry with Exponential Backoff** - 3 attempts with delays of 1s/2s/4s
- ✅ **Real-Time Queue Statistics** - Endpoint returning pending, processing, completed, and failed job counts
- ✅ **Live Dashboard** - React frontend polling every 5 seconds, displaying:
  - Queue health metrics (color-coded stat cards)
  - Recent jobs table with truncated UUIDs
  - Responsive layout for mobile/tablet/desktop
  - Connection status indicators and error handling
- ✅ **Job Lifecycle Tracking** - Full visibility into job status, attempts made, and timestamps

## Architecture

Loomis uses a **hybrid storage approach** for demonstration purposes:

- **BullMQ (Redis)**: Source of truth for job queue state, handles job distribution, retries, and persistence
- **In-Memory Metadata Map**: Stores job creation timestamps and custom metadata in a `Map<string, Job>`

**Known Limitation**: The in-memory metadata map is lost on server restart. In a production system, this metadata would be persisted to a database like PostgreSQL or MongoDB alongside the job ID as a foreign key, allowing BullMQ to remain the queue authority while persistent storage handles audit trails and historical data.

### Why This Approach?

This architecture demonstrates:
- **Separation of Concerns**: Queue mechanics (BullMQ) vs. business metadata (application layer)
- **Pragmatic Trade-offs**: Acceptable for demos/MVPs; clear path to production hardening
- **Real-World Patterns**: Many production systems use Redis for hot data + SQL for cold/audit data

## API Endpoints

| Method | Path                   | Description                                                                 |
|--------|------------------------|-----------------------------------------------------------------------------|
| POST   | `/jobs`                | Create a new job. Body: `{ type: string, payload: object }`               |
| GET    | `/jobs/:id`            | Get job details by UUID (status, attempts, timestamps)                     |
| GET    | `/jobs`                | List recent jobs, most recent first. Query param: `?limit=N` (default 20, max 100) |
| GET    | `/jobs/stats/summary`  | Get queue statistics (pending, processing, completed, failed counts)       |

### Example: Create a Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "send-email",
    "payload": {
      "to": "user@example.com",
      "subject": "Welcome!",
      "body": "Thanks for signing up."
    }
  }'
```

**Response:**
```json
{
  "id": "a7f3c8d2-4b1e-4f9a-8c6d-2e5b9f1a3c7e",
  "type": "send-email",
  "payload": { "to": "user@example.com", "subject": "Welcome!", "body": "Thanks for signing up." },
  "status": "pending",
  "createdAt": "2026-07-15T10:30:00.000Z",
  "updatedAt": "2026-07-15T10:30:00.000Z"
}
```

### Example: Get Job Status

```bash
curl http://localhost:3000/jobs/a7f3c8d2-4b1e-4f9a-8c6d-2e5b9f1a3c7e
```

**Response:**
```json
{
  "id": "a7f3c8d2-4b1e-4f9a-8c6d-2e5b9f1a3c7e",
  "type": "send-email",
  "payload": { "to": "user@example.com", "subject": "Welcome!", "body": "Thanks for signing up." },
  "status": "completed",
  "createdAt": "2026-07-15T10:30:00.000Z",
  "updatedAt": "2026-07-15T10:30:15.000Z",
  "attemptsMade": 1,
  "maxAttempts": 3
}
```

### Example: Get Queue Stats

```bash
curl http://localhost:3000/jobs/stats/summary
```

**Response:**
```json
{
  "pending": 5,
  "processing": 2,
  "completed": 147,
  "failed": 3,
  "total": 157
}
```

## Setup

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Redis** 6+ installed via Homebrew (macOS):
  ```bash
  brew install redis
  brew services start redis
  ```

  Or via Docker:
  ```bash
  docker run -d -p 6379:6379 redis:7-alpine
  ```

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Create a `.env` file in the project root:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=3000
   ```

3. **Start the backend server:**
   ```bash
   npm run start:dev
   ```

   The API will be available at `http://localhost:3000`.

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The dashboard will be available at `http://localhost:5173`.

### Verify the Setup

1. Backend health check:
   ```bash
   curl http://localhost:3000/jobs/stats/summary
   ```

2. Open the dashboard in your browser:
   ```
   http://localhost:5173
   ```

3. Submit a test job:
   ```bash
   curl -X POST http://localhost:3000/jobs \
     -H "Content-Type: application/json" \
     -d '{"type": "test-job", "payload": {"message": "Hello, Loomis!"}}'
   ```

   You should see the job appear in the dashboard within 5 seconds.

## Project Structure

```
loomis/
├── src/                      # Backend source code
│   ├── jobs/                 # Jobs module (controllers, services, DTOs)
│   │   ├── jobs.controller.ts
│   │   ├── jobs.service.ts
│   │   ├── jobs.processor.ts
│   │   ├── dto/              # Data transfer objects
│   │   └── entities/         # Type definitions
│   ├── app.module.ts
│   └── main.ts
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── Dashboard.tsx     # Main dashboard component
│   │   ├── api.ts            # API client functions
│   │   ├── types.ts          # TypeScript types
│   │   └── utils.ts          # Helper functions
│   ├── public/
│   └── index.html
├── .env                      # Environment variables (not committed)
├── package.json
└── README.md
```

## Screenshots

_Coming soon: Dashboard screenshots showing queue statistics and job table_

## Development Notes

### Job Status Mapping

BullMQ's internal job states are mapped to simplified application statuses:

| BullMQ State | Application Status | Description                              |
|--------------|-------------------|------------------------------------------|
| `waiting`    | `pending`         | Job is queued, waiting for a worker      |
| `delayed`    | `pending`         | Job is scheduled for future execution    |
| `active`     | `processing`      | Job is currently being executed          |
| `completed`  | `completed`       | Job finished successfully                |
| `failed` (retries remaining) | `processing` | Job failed but will automatically retry |
| `failed` (all retries exhausted) | `failed` | Job failed permanently after 3 attempts |

### Adding Custom Job Types

Jobs are processed by `jobs.processor.ts`. To add custom job handling:

```typescript
@Processor('jobs')
export class JobsProcessor {
  @Process()
  async processJob(job: BullMQJob<any>) {
    const { type, payload } = job.data;

    switch (type) {
      case 'send-email':
        return this.handleEmailJob(payload);
      case 'generate-report':
        return this.handleReportJob(payload);
      // Add your custom job types here
      default:
        console.log(`Processing job: ${type}`, payload);
    }
  }
}
```

## Future Enhancements

- [ ] Add PostgreSQL for persistent metadata storage
- [ ] Implement job cancellation endpoint
- [ ] Add job filtering/search in dashboard
- [ ] Support scheduled/delayed jobs via API
- [ ] Add WebSocket support for real-time dashboard updates (eliminate polling)
- [ ] Implement authentication and rate limiting
- [ ] Add job priority levels
- [ ] Support bulk job submission
- [ ] Add Prometheus metrics and Grafana dashboards

## License

MIT License - feel free to use this project as a reference or starting point for your own queue systems.

---

**Built with ❤️ as a demonstration of production-grade TypeScript architecture**
