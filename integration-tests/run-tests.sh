#!/bin/bash

# Set environment variables for testing
export TEST_DATABASE_URI="postgresql://localhost:5432/rwp_test"
export NODE_ENV="test"

# Create test database if it doesn't exist
psql postgres -c "DROP DATABASE IF EXISTS rwp_test;"
psql postgres -c "CREATE DATABASE rwp_test;"

# Run database migrations
echo "Running database migrations..."
NODE_ENV=test npx prisma migrate deploy

# Start test services
echo "Starting test services..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Run the integration tests
echo "Running integration tests..."
jest --config jest.config.js --testMatch "**/integration-tests/**/*.test.ts" --runInBand --forceExit

# Cleanup
echo "Cleaning up..."
docker-compose -f docker-compose.test.yml down
psql postgres -c "DROP DATABASE IF EXISTS rwp_test;"

# Check exit code
if [ $? -eq 0 ]; then
    echo "Integration tests completed successfully"
    exit 0
else
    echo "Integration tests failed"
    exit 1
fi