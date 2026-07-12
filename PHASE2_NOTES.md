# Phase 2: BullMQ Integration Notes

## Storage Approach

**Hybrid approach: BullMQ's native job storage + lightweight in-memory metadata map**

### Why this approach?

1. **BullMQ as source of truth for job state**: BullMQ already tracks job state (waiting, active, completed, failed) in Redis, which is authoritative and persistent.

2. **In-memory map for metadata**: We use a `Map<string, Job>` to store our custom job metadata (id, type, payload, createdAt) for quick lookups. This avoids duplicating all job data in a separate database.

3. **Hybrid lookup in getJobById()**:
   - Retrieve base metadata from our in-memory map
   - Fetch current state from BullMQ's Redis-backed job
   - Merge them to return the complete, current Job object

### Trade-offs

**Pros:**
- Simple implementation
- No additional database needed
- BullMQ handles all state management and persistence
- Fast lookups for job metadata

**Cons:**
- In-memory metadata is lost on server restart (jobs continue processing in BullMQ, but API lookups will fail for jobs created before restart)
- Not suitable for production at scale (Phase 3+ will likely need a real database like PostgreSQL)

### Future improvements (Phase 3+)

- Add PostgreSQL to persist job metadata
- Sync job state changes via BullMQ event listeners (onCompleted, onFailed, etc.)
- Keep the in-memory map as a cache layer for performance

## Configuration

- Redis connection configured via `.env`:
  - `REDIS_HOST=localhost`
  - `REDIS_PORT=6379`
- BullMQ queue name: `jobs`
- ConfigModule is global-scoped

## Job Processing

The `JobsProcessor` simulates real work with delays:
- `send-email`: 2 seconds
- `process-image`: 4 seconds  
- `generate-report`: 5 seconds
- Unknown types: 3 seconds (default)

~10% of jobs fail randomly to test failure handling.

## Testing

```bash
# Create a job
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"type": "send-email", "payload": {"to": "user@example.com"}}'

# Get job status
curl http://localhost:3000/jobs/{job-id}
```

Expected statuses: `pending` → `processing` → `completed` or `failed`
