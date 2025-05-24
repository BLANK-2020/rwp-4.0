# Recruitment Web Platform (RWP) 4.0 - Technical Implementation

## Technology Stack

### Frontend
- **Framework**: Next.js 14.0.4 with App Router
- **UI Library**: React 18
- **Styling**: CSS Modules / Tailwind CSS
- **State Management**: React Context API
- **Data Fetching**: Next.js Server Components / React Query
- **Form Handling**: React Hook Form

### Backend
- **CMS**: Payload CMS 3.x
- **API Framework**: Next.js API Routes / Express
- **Database**: PostgreSQL with Payload DB Postgres adapter
- **Authentication**: JWT via Payload CMS / OAuth for ATS integrations
- **File Storage**: Local / S3 compatible storage

### Infrastructure
- **Containerization**: Docker / Docker Compose
- **Hosting**: Digital Ocean App Platform
- **CI/CD**: GitHub Actions
- **Monitoring**: Pino logging
- **Environment Variables**: dotenv

## Core Components

### Payload CMS Configuration

The core of the platform is built on Payload CMS, which provides:

- Content management
- Authentication and authorization
- API generation
- Admin dashboard

The configuration is defined in `src/payload.config.ts` and includes:

```typescript
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: dbConfig,
  }),
  debug: true,
  sharp,
  plugins: [],
})
```

### Collections

The platform uses the following collections:

1. **Users**: Authentication and user management
2. **Jobs**: Job listings and details
3. **Candidates**: Candidate profiles and applications
4. **Sectors**: Industry sectors for job categorization
5. **Tenants**: Multi-tenant configuration
6. **Events**: User interaction tracking
7. **Analytics**: Aggregated analytics data
8. **Media**: File uploads and media management

### API Structure

The API is structured using Next.js API routes:

- `/api/jobs/*`: Job-related endpoints
- `/api/candidates/*`: Candidate-related endpoints
- `/api/events/*`: Event tracking endpoints
- `/api/analytics/*`: Analytics endpoints
- `/api/oauth/*`: OAuth integration endpoints
- `/api/webhooks/*`: Webhook handlers for external services

### ATS Integration

The JobAdder integration is implemented in `src/plugins/ats/integrations/jobAdder/` and includes:

- **OAuth Authentication**: Handles authentication with JobAdder API
- **Data Synchronization**: Syncs jobs and candidates
- **Webhooks**: Processes real-time updates
- **Data Transformation**: Normalizes data between systems

Example OAuth flow:

```typescript
// Authorization endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirectUri = searchParams.get('redirectUri') || process.env.JOBADDER_REDIRECT_URI;
  
  const authUrl = `https://api.jobadder.com/oauth2/authorize?client_id=${process.env.JOBADDER_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=jobs candidates`;
  
  return Response.redirect(authUrl);
}

// Callback endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return new Response('Authorization code missing', { status: 400 });
  }
  
  try {
    const tokens = await exchangeCodeForTokens(code);
    // Store tokens securely
    await storeTokens(tokens);
    
    return Response.redirect('/admin/settings/integrations');
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}
```

### Event Tracking

The event tracking system captures user interactions:

- Page views
- Job views
- Search queries
- Application starts/completions
- Click events

Events are stored in the database and processed for analytics.

### Analytics

The analytics system processes event data to provide insights:

- Job performance metrics
- Conversion rates
- User engagement
- A/B test results
- Custom reports

### Multi-tenancy

The platform supports multiple tenants (recruitment agencies) through:

- Tenant-specific configuration
- Domain-based routing
- White-labeling
- Isolated data access

## Frontend Implementation

### Job Board

The job board is implemented using Next.js App Router:

- `/src/app/(frontend)/page.tsx`: Homepage
- `/src/app/(frontend)/jobs/page.tsx`: Job listings
- `/src/app/(frontend)/jobs/[slug]/page.tsx`: Job details
- `/src/app/(frontend)/search/page.tsx`: Search results
- `/src/app/(frontend)/sectors/[slug]/page.tsx`: Sector-specific listings

### Admin Dashboard

The admin dashboard is provided by Payload CMS and extended with custom components:

- `/src/app/(payload)/admin/analytics/page.tsx`: Analytics dashboard
- `/src/app/(payload)/admin/analytics/components/AnalyticsCharts.tsx`: Chart components

### Responsive Design

The frontend is fully responsive, supporting:

- Desktop
- Tablet
- Mobile

## Data Flow

### Job Synchronization

1. Jobs are created or updated in JobAdder
2. Webhook notification is sent to `/api/webhooks/jobadder`
3. Job data is fetched from JobAdder API
4. Data is transformed to match internal schema
5. Job is created or updated in the database
6. Job becomes available on the job board

### Candidate Application

1. Candidate fills out application form
2. Form data is validated
3. Candidate record is created in the database
4. Application is enriched with AI analysis
5. Application is sent to JobAdder
6. Confirmation is sent to the candidate

### Analytics Processing

1. Events are tracked via `/api/events/track`
2. Raw events are stored in the database
3. Scheduled tasks process and aggregate events
4. Aggregated data is stored in the analytics collection
5. Dashboards display the processed data

## Deployment Architecture

### Development Environment

Local development uses:

- Next.js development server
- Local PostgreSQL database
- Docker Compose for dependencies

### Staging Environment

Staging is deployed to Digital Ocean App Platform:

- Containerized application
- Managed PostgreSQL database
- Staging-specific environment variables

### Production Environment

Production is deployed to Digital Ocean App Platform or Kubernetes:

- Horizontally scaled application containers
- Managed PostgreSQL database with replication
- Production-specific environment variables
- CDN for static assets

## Security Considerations

- **Authentication**: JWT-based authentication with proper expiration
- **Authorization**: Role-based access control
- **Data Protection**: HTTPS for all communications
- **API Security**: Rate limiting and input validation
- **Database Security**: Parameterized queries and proper indexing
- **Environment Variables**: Secure storage of secrets

## Performance Optimizations

- **Server-Side Rendering**: For SEO and initial load performance
- **Static Generation**: For static pages and assets
- **Image Optimization**: Using Next.js Image component and Sharp
- **Caching**: API response caching and database query caching
- **Code Splitting**: Automatic code splitting by Next.js
- **Database Indexing**: Proper indexes for common queries

## Testing Strategy

- **Unit Tests**: Jest for component and utility testing
- **Integration Tests**: Testing API endpoints and data flow
- **End-to-End Tests**: Cypress for full user journey testing
- **Performance Testing**: Lighthouse for performance metrics

## Monitoring and Logging

- **Error Tracking**: Centralized error logging
- **Performance Monitoring**: API response times and database queries
- **User Analytics**: Conversion and engagement metrics
- **Server Monitoring**: CPU, memory, and network usage

## Future Enhancements

- **AI-Powered Job Matching**: Enhanced candidate-job matching algorithms
- **Advanced Analytics**: Predictive analytics for recruitment trends
- **Mobile App**: Native mobile applications for candidates
- **Integration Marketplace**: Additional ATS and CRM integrations
- **Internationalization**: Multi-language support