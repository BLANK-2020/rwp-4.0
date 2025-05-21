# AI Benchmarking & Analytics System Deployment Guide

## 1. System Requirements

### Hardware Requirements
- **Application Servers**:
  - CPU: Minimum 4 cores (8 recommended)
  - RAM: Minimum 8GB (16GB recommended)
  - Storage: 100GB SSD minimum
  - Network: 1Gbps minimum

- **Database Server**:
  - CPU: Minimum 4 cores (8 recommended)
  - RAM: Minimum 16GB (32GB recommended)
  - Storage: 500GB SSD minimum
  - IOPS: 3000+ minimum

- **Cache Server**:
  - RAM: Minimum 8GB (16GB recommended)
  - Storage: 50GB SSD minimum

### Software Dependencies
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher
- Docker 20.x or higher
- Docker Compose 2.x or higher
- Nginx 1.20.x or higher
- OpenAI API access

### Network Requirements
- Outbound access to:
  - JobAdder API endpoints
  - OpenAI API endpoints
  - Container registries
  - NPM registry
- Inbound access for:
  - HTTPS (443)
  - HTTP (80) for SSL certification
- Internal network between services:
  - PostgreSQL (5432)
  - Redis (6379)
  - Service-to-service communication (various ports)

### Security Prerequisites
- SSL certificates for all domains
- API keys and secrets:
  - OpenAI API key
  - JobAdder OAuth credentials
  - Stripe API keys (if using payment features)
- Firewall rules configured
- Network security groups set up
- IAM roles and permissions configured

## 2. Installation Steps

### 2.1 Environment Setup

1. Clone the repositories:
```bash
git clone git@github.com:your-org/rwp-ai-enrichment.git
git clone git@github.com:your-org/rwp-analytics.git
git clone git@github.com:your-org/rwp-events.git
git clone git@github.com:your-org/rwp-core.git
```

2. Set up environment variables for each service:

```bash
# Core environment variables (.env)
PAYLOAD_SECRET=your_payload_secret_here
DATABASE_URI=postgresql://user:password@host:port/database?sslmode=require
NEXT_PUBLIC_API_URL=https://your-domain.com
JOBADDER_CLIENT_ID=your_jobadder_client_id
JOBADDER_CLIENT_SECRET=your_jobadder_client_secret
OPENAI_API_KEY=your_openai_api_key

# Analytics specific variables
ANALYTICS_DB_URI=postgresql://user:password@host:port/analytics?sslmode=require
REDIS_URI=redis://user:password@host:port
EVENT_TRACKING_ENDPOINT=https://your-domain.com/api/events/track

# AI Enrichment specific variables
VECTOR_DB_URI=your_vector_db_uri
MODEL_CACHE_PATH=/path/to/model/cache
```

3. Install dependencies for each service:
```bash
cd rwp-ai-enrichment && npm install
cd ../rwp-analytics && npm install
cd ../rwp-events && npm install
cd ../rwp-core && npm install
```

### 2.2 Database Initialization

1. Create the required databases:
```sql
CREATE DATABASE rwp_core;
CREATE DATABASE rwp_analytics;
CREATE DATABASE rwp_events;
```

2. Run database migrations:
```bash
# For each service
cd service-directory
npm run db:migrate
```

3. Initialize analytics tables:
```bash
npm run setup:analytics-db
```

### 2.3 Service Deployment Order

1. Deploy core infrastructure:
```bash
# Deploy PostgreSQL
docker-compose up -d postgres

# Deploy Redis
docker-compose up -d redis
```

2. Deploy services in order:
```bash
# Deploy Event Service
cd rwp-events
docker-compose up -d

# Deploy Analytics Service
cd ../rwp-analytics
docker-compose up -d

# Deploy AI Enrichment Service
cd ../rwp-ai-enrichment
docker-compose up -d

# Deploy Core Service
cd ../rwp-core
docker-compose up -d
```

### 2.4 Configuration Requirements

1. Configure Nginx as reverse proxy:
```nginx
# /etc/nginx/sites-available/rwp
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Core service
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Analytics service
    location /api/analytics {
        proxy_pass http://localhost:3001;
    }

    # AI Enrichment service
    location /api/ai {
        proxy_pass http://localhost:3002;
    }

    # Event tracking
    location /api/events {
        proxy_pass http://localhost:3003;
    }
}
```

2. Set up SSL certificates:
```bash
certbot --nginx -d your-domain.com
```

## 3. Integration Setup

### 3.1 JobAdder API Configuration

1. Configure OAuth credentials in JobAdder dashboard:
   - Redirect URI: https://your-domain.com/api/oauth/jobadder/callback
   - Scope requirements: jobs.read, candidates.read, placements.read

2. Update environment variables:
```bash
JOBADDER_CLIENT_ID=your_client_id
JOBADDER_CLIENT_SECRET=your_client_secret
```

### 3.2 OpenAI API Setup

1. Configure API access:
```bash
OPENAI_API_KEY=your_api_key
OPENAI_ORG_ID=your_org_id
```

2. Set up usage limits and monitoring

### 3.3 Analytics Service Configuration

1. Configure data retention policies:
```bash
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_BACKUP_ENABLED=true
```

2. Set up aggregation schedules:
```bash
DAILY_ROLLUP_TIME=02:00
WEEKLY_ROLLUP_DAY=1
```

### 3.4 Event Tracking Setup

1. Configure event tracking endpoints:
```bash
EVENT_TRACKING_ENABLED=true
EVENT_BATCH_SIZE=100
EVENT_FLUSH_INTERVAL=30
```

2. Set up event processors:
```bash
EVENT_PROCESSORS=["job-views", "applications", "searches"]
```

## 4. Monitoring & Maintenance

### 4.1 Health Check Endpoints

- Core service: /api/health
- Analytics service: /api/analytics/health
- AI Enrichment service: /api/ai/health
- Event service: /api/events/health

Monitor these endpoints with:
```bash
curl -f https://your-domain.com/api/health
```

### 4.2 Logging Configuration

1. Configure centralized logging:
```bash
# docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "3"
```

2. Set up log rotation:
```bash
# /etc/logrotate.d/rwp
/var/log/rwp/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### 4.3 Backup Procedures

1. Database backups:
```bash
# Automated daily backups
0 2 * * * pg_dump -Fc rwp_analytics > /backups/analytics_$(date +\%Y\%m\%d).dump
0 3 * * * pg_dump -Fc rwp_core > /backups/core_$(date +\%Y\%m\%d).dump
```

2. Configuration backups:
```bash
# Backup environment files and configs
0 4 * * * tar -czf /backups/configs_$(date +\%Y\%m\%d).tar.gz /path/to/configs
```

### 4.4 Performance Monitoring

1. Set up metrics collection:
```bash
# Prometheus configuration
scrape_configs:
  - job_name: 'rwp-metrics'
    static_configs:
      - targets: ['localhost:3000', 'localhost:3001', 'localhost:3002']
```

2. Configure alerting thresholds:
```yaml
# alerts.yml
groups:
  - name: rwp-alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage > 80
        for: 5m
```

### 4.5 Cost Tracking

1. Set up cost monitoring:
```bash
# OpenAI cost tracking
OPENAI_COST_ALERT_THRESHOLD=100
DAILY_TOKEN_LIMIT=1000000

# Infrastructure cost tracking
COST_METRICS_ENABLED=true
COST_ALERT_THRESHOLD=1000
```

## 5. Troubleshooting Guide

### 5.1 Common Issues

1. Database Connection Issues:
   - Check DATABASE_URI configuration
   - Verify network security groups
   - Confirm database server is running
   - Check connection limits

2. AI Service Issues:
   - Verify OpenAI API key validity
   - Check rate limits
   - Monitor token usage
   - Verify model availability

3. Event Processing Issues:
   - Check Redis connection
   - Verify queue processing
   - Monitor event backlogs
   - Check disk space for logs

### 5.2 Debug Procedures

1. Service debugging:
```bash
# Enable debug logging
DEBUG=rwp:* npm start

# Check service logs
docker-compose logs -f service-name
```

2. Database debugging:
```bash
# Check active connections
SELECT * FROM pg_stat_activity;

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC;
```

### 5.3 Recovery Steps

1. Database recovery:
```bash
# Restore from backup
pg_restore -d rwp_analytics backup_file.dump

# Verify data integrity
SELECT count(*) FROM analytics_events;
```

2. Service recovery:
```bash
# Restart service
docker-compose restart service-name

# Clear cache if needed
redis-cli FLUSHALL
```

### 5.4 Support Contacts

- Technical Support: tech-support@your-company.com
- Infrastructure Team: infra@your-company.com
- Security Team: security@your-company.com
- Emergency Contact: emergency@your-company.com or +1-XXX-XXX-XXXX

## 6. Additional Resources

- [System Architecture Documentation](./ai-analytics-architecture.md)
- [API Documentation](./api-docs.md)
- [Monitoring Dashboard](https://metrics.your-domain.com)
- [Internal Wiki](https://wiki.your-company.com/rwp)