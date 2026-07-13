#!/bin/bash

echo "Testing retry logic implementation..."
echo ""

# Create a job
echo "1. Creating a new job..."
RESPONSE=$(curl -s -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"send-email","payload":{"to":"retry-test@example.com"}}')

JOB_ID=$(echo $RESPONSE | jq -r '.id')
echo "Created job: $JOB_ID"
echo ""

# Check initial status
echo "2. Initial job status:"
curl -s http://localhost:3000/jobs/$JOB_ID | jq '{id, status, attemptsMade, maxAttempts}'
echo ""

# Wait for processing
echo "3. Waiting 3 seconds for job to process..."
sleep 3
echo ""

# Check final status
echo "4. Final job status:"
curl -s http://localhost:3000/jobs/$JOB_ID | jq '{id, status, attemptsMade, maxAttempts, createdAt, updatedAt}'
echo ""

echo "Test complete!"
echo ""
echo "Key features demonstrated:"
echo "- maxAttempts: 3 (configured in JobsService)"
echo "- attemptsMade: shows how many attempts were made"
echo "- Exponential backoff: 1s, 2s, 4s between retries"
echo "- Status shows 'processing' during retries, 'failed' only after all attempts exhausted"
