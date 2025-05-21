# AI Benchmarking & Analytics Integration Tests

This directory contains comprehensive integration tests for the AI Benchmarking & Analytics system. The tests cover end-to-end data flow, performance, security, and error handling scenarios.

## Test Coverage

1. Data Flow Integration
   - JobAdder job synchronization
   - Event tracking
   - Analytics data aggregation
   - Real-time updates

2. Performance Testing
   - Concurrent event processing
   - API response times
   - Database query optimization
   - Caching effectiveness

3. Security & Privacy
   - Data access controls
   - Privacy consent management
   - Data masking
   - Audit logging

4. Error Handling
   - API failure scenarios
   - Data validation
   - Recovery mechanisms
   - Error logging

## Test Infrastructure

The test environment uses:
- PostgreSQL for data storage
- Redis for caching
- WireMock for JobAdder API simulation
- Docker Compose for service orchestration

### Directory Structure
```
integration-tests/
├── analytics.test.ts    # Main test suite
├── types.ts            # TypeScript definitions
├── run-tests.sh        # Test runner script
├── mocks/              # API mock responses
│   └── jobadder/
│       └── mappings/
│           ├── oauth.json
│           └── jobs.json
└── README.md
```

## Running Tests

1. Ensure Docker and Docker Compose are installed

2. Set up environment:
   ```bash
   # Make test runner executable
   chmod +x integration-tests/run-tests.sh
   
   # Create .env.test file
   cp .env.example .env.test
   ```

3. Run tests:
   ```bash
   ./integration-tests/run-tests.sh
   ```

The test runner will:
- Create a test database
- Start required services
- Run migrations
- Execute test suite
- Clean up resources

## Adding New Tests

When adding new tests:

1. Add test cases to `analytics.test.ts`
2. Update types in `types.ts` if needed
3. Add mock responses in `mocks/jobadder/mappings/`
4. Update README.md with new test coverage

## Debugging

To debug test failures:

1. Check test logs:
   ```bash
   docker-compose -f docker-compose.test.yml logs
   ```

2. Access test database:
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/rwp_test
   ```

3. View WireMock requests:
   ```bash
   curl http://localhost:8080/__admin/requests
   ```

## Common Issues

1. Database Connection:
   - Ensure PostgreSQL is running
   - Check DATABASE_URI in .env.test
   - Verify database permissions

2. API Mocks:
   - Check WireMock mappings
   - Verify request matching patterns
   - Review mock response formats

3. Test Timeouts:
   - Increase Jest timeout in config
   - Check for long-running operations
   - Verify service health checks