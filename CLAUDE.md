# Loomis – Claude Code Reference

## Project Overview

Loomis is a distributed task queue system demonstrating production-grade async job processing patterns. Backend is NestJS/BullMQ/Redis, frontend is React/Vite/Tailwind v4. Includes a live-polling dashboard showing queue health and recent jobs.

## Tech Stack

- **Backend**: TypeScript, NestJS, BullMQ (Redis queue), class-validator DTOs
- **Frontend**: React 18, Vite, Tailwind CSS v4, TypeScript
- **Infrastructure**: Redis 6+ (via Homebrew or Docker)

## Key Architectural Decisions

### Hybrid Storage Approach
- **BullMQ (Redis)**: Source of truth for job queue state, handles retries, job distribution, persistence
- **In-Memory Map**: Stores job metadata (`Map<string, Job>`) for creation timestamps and custom fields
- **Why**: Separation of concerns — queue mechanics vs. business metadata. Acceptable for demos; production would use PostgreSQL for metadata.

### Why BullMQ
- Modern Redis-based queue library (successor to Bull)
- Built-in retry with exponential backoff
- Native TypeScript support
- Lightweight for this scale

### Concurrency Settings
- Concurrency is not explicitly configured, so BullMQ defaults to processing 1 job at a time (sequential, not parallel)
- Retry policy: 3 attempts, exponential backoff starting at 1000ms

## Known Limitations

1. **In-Memory Metadata Lost on Restart**: The `Map<string, Job>` in `jobs.service.ts` is ephemeral. Jobs in Redis persist, but custom metadata (createdAt, etc.) is lost if the backend restarts. Production would persist this to PostgreSQL.

2. **BullMQ Job Retention**: BullMQ eventually discards old completed/failed jobs based on retention settings (default: keeps recent jobs). This means:
   - `GET /jobs/stats/summary` counts will persist (BullMQ maintains counters)
   - `GET /jobs/:id` for very old jobs will fail with 404 even if the job originally existed
   - `GET /jobs` only returns jobs still in Redis

## Project Structure

```
loomis/
├── src/                          # Backend (NestJS)
│   ├── jobs/
│   │   ├── jobs.controller.ts    # REST endpoints: POST /jobs, GET /jobs/:id, GET /jobs, GET /jobs/stats/summary
│   │   ├── jobs.service.ts       # Business logic, in-memory metadata Map
│   │   ├── jobs.processor.ts     # BullMQ worker (@Process() handlers)
│   │   ├── jobs.module.ts        # Module wiring, BullMQ config
│   │   ├── dto/
│   │   │   ├── create-job.dto.ts
│   │   │   └── queue-stats.dto.ts
│   │   └── entities/
│   │       └── job.entity.ts     # Job, JobStatus enum
│   ├── app.module.ts             # Root module, imports JobsModule + BullModule
│   └── main.ts                   # Bootstrap, CORS config
│
├── frontend/                     # React dashboard
│   ├── src/
│   │   ├── Dashboard.tsx         # Main component (stat cards, job table, polling logic)
│   │   ├── api.ts                # getQueueStats(), getRecentJobs()
│   │   ├── types.ts              # QueueStats, Job types
│   │   ├── utils.ts              # formatRelativeTime()
│   │   └── main.tsx              # React entrypoint
│   ├── public/
│   │   └── favicon.svg           # Custom Loomis "L" icon
│   └── index.html
│
├── test-retry.sh                 # Manual retry verification script
├── .env                          # REDIS_HOST, REDIS_PORT, PORT (not committed)
└── tsconfig.json                 # Backend config (excludes frontend/)
```

## Development Workflow

### Prerequisites
- Redis must be running: `brew services start redis`
- Node.js 18+

### Running the System
Two servers must run simultaneously:

1. **Backend** (port 3000):
   ```bash
   npm run start:dev
   ```

2. **Frontend** (port 5173):
   ```bash
   cd frontend
   npm run dev
   ```

Dashboard: http://localhost:5173  
API: http://localhost:3000

### Verify Setup
```bash
# Check Redis
redis-cli ping

# Check backend
curl http://localhost:3000/jobs/stats/summary

# Submit test job
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"type": "test-job", "payload": {"message": "Hello!"}}'
```

## Common Gotchas

### 1. Tailwind v4 PostCSS Version Mismatches
**Issue**: Tailwind v4 beta may conflict with Vite's bundled PostCSS version.  
**Solution**: Frontend uses Tailwind v4.0.0-beta.5. If CSS isn't compiling, check `npm list postcss` for version conflicts.

### 2. Backend tsconfig Must Exclude frontend/
**Issue**: TypeScript compiler scans nested `frontend/` directory by default, causing slow builds and type errors.  
**Solution**: Backend `tsconfig.json` has explicit `include: ["src"]` and `exclude: ["node_modules", "dist", "frontend"]`.

### 3. CORS for Local Development
**Issue**: Frontend (localhost:5173) cannot fetch from backend (localhost:3000) without CORS.  
**Solution**: `main.ts` enables CORS with `origin: 'http://localhost:5173'`. Update if frontend port changes.

### 4. NestJS Logs ERROR to stderr, Not stdout
**Issue**: When piping NestJS output to a file (`npm run start:dev > server.log`), errors disappear.  
**Solution**: Use `2>&1` to merge stderr into stdout: `npm run start:dev > server.log 2>&1` or use `tee` for console + file.

### 5. Job Processor Must Be Registered
**Issue**: Jobs stay in "waiting" state forever.  
**Solution**: Ensure `JobsProcessor` is listed in `JobsModule` providers and decorated with `@Processor('jobs')`.

### 6. Redis Connection Errors
**Issue**: Backend fails to start with "ECONNREFUSED 127.0.0.1:6379".  
**Solution**: Verify Redis is running: `brew services list` or `redis-cli ping`. Start with `brew services start redis`.

## Testing

### Manual Retry Verification
```bash
./test-retry.sh
```

Submits a test job and polls `GET /jobs/:id` every second to observe:
- Status transitions: pending → processing → completed/failed
- Attempts incrementing on retries
- Final status after exhausting retries

**Expected behavior**: Job processor logs simulate failures, triggering BullMQ retries. Check `attemptsMade` incrementing from 1 → 2 → 3.

### Unit/E2E Tests
Not yet implemented. Future work:
- Jest unit tests for `jobs.service.ts` logic
- E2E tests for API endpoints using `@nestjs/testing`

## Debugging Tips

- **BullMQ Job Details**: Use Redis CLI to inspect job data:
  ```bash
  redis-cli
  > KEYS bull:jobs:*
  > HGETALL bull:jobs:<job-id>
  ```

- **Dashboard Not Updating**: Check browser console for CORS errors or failed fetch requests. Verify backend is running on :3000.

- **Jobs Stuck in "waiting"**: Restart backend to reload processor. Check `JobsProcessor` is properly registered in module.

- **TypeScript Errors in frontend/**: Run `npm run build` from `frontend/` to check for TS issues independently.

## Environment Variables

Create `.env` in project root:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

Frontend hardcodes `http://localhost:3000` in `api.ts` — update `API_BASE` if backend port changes.

## Git Workflow

- Backend and frontend changes are committed separately when they represent distinct features
- Frontend is a subdirectory (not a git submodule) — commit frontend changes from repo root
- Use conventional commit prefixes: `feat:`, `fix:`, `style:`, `docs:`, `refactor:`

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `src/jobs/jobs.service.ts` | In-memory metadata Map, business logic |
| `src/jobs/jobs.processor.ts` | Worker that actually executes jobs |
| `src/app.module.ts` | BullMQ config (Redis connection; concurrency could be configured here but currently isn't) |
| `src/main.ts` | CORS config, port binding |
| `frontend/src/Dashboard.tsx` | Main UI component, polling logic |
| `frontend/src/api.ts` | Backend API client functions |

## Future Improvements

- [ ] Add PostgreSQL for persistent job metadata
- [ ] Implement WebSocket for real-time dashboard updates (eliminate polling)
- [ ] Add authentication/rate limiting
- [ ] Implement job cancellation endpoint
- [ ] Add Prometheus metrics exporter
