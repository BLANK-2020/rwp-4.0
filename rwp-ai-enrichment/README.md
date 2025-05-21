# RWP AI Enrichment Microservice

This microservice provides AI-powered data enrichment and analysis capabilities for the RWP 4.0 platform. It handles candidate profile enrichment, skills extraction, experience evaluation, and integration with OpenAI/GPT for advanced analysis.

## Features

- **CV Parsing and Data Extraction**: Extract structured data from resumes and CVs
- **TalentScore Calculation Engine**: Score candidates based on skills, experience, and other factors
- **Benchmark Template Processor**: Compare candidates against industry benchmarks
- **GPT Integration**: Leverage OpenAI's GPT for advanced candidate analysis

## API Endpoints

- `POST /api/candidates/enrich`: Process and enrich candidate data
- `POST /api/candidates/score`: Generate TalentScore for a candidate
- `GET /api/benchmarks`: Retrieve benchmark templates
- `POST /api/benchmarks/evaluate`: Compare candidate to benchmark

## Architecture

The microservice follows a modular design with clear separation between:

- **API Layer**: Handles HTTP requests and responses
- **Service Layer**: Contains business logic for AI enrichment and scoring
- **Data Layer**: Manages data persistence and retrieval

## Integration

This microservice integrates with:

- **rwp-core**: For core platform functionality
- **rwp-analytics**: For storing and retrieving analytics data

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

- `OPENAI_API_KEY`: API key for OpenAI services
- `PINECONE_API_KEY`: API key for Pinecone vector database
- `REDIS_URL`: URL for Redis instance (used for queuing)
- `DATABASE_URI`: PostgreSQL connection string