# 2-Day Implementation Plan: AI Analytics Extension

## Overview

This plan outlines how to extend the existing RWP 4.0 architecture to add AI analytics capabilities in a 2-day sprint. We'll leverage:
- Existing JobAdder integration
- Payload CMS collections
- Current database structure
- Existing event tracking

## Day 1: Core Implementation

### Morning: Data Layer (9am - 12pm)

1. **Extend Jobs Collection** (1 hour)
```typescript
// src/collections/Jobs.ts
{
  fields: [
    // ... existing fields ...
    {
      name: 'aiEnrichment',
      type: 'json',
      admin: {
        description: 'AI-generated insights',
      },
    },
    {
      name: 'talentScore',
      type: 'group',
      fields: [
        {
          name: 'score',
          type: 'number',
        },
        {
          name: 'factors',
          type: 'json',
        },
        {
          name: 'lastUpdated',
          type: 'date',
        },
      ],
    },
  ],
}
```

2. **Add Analytics Collection** (1 hour)
```typescript
// src/collections/Analytics.ts
export const Analytics: CollectionConfig = {
  slug: 'analytics',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
    },
    {
      name: 'metrics',
      type: 'json',
    },
    {
      name: 'insights',
      type: 'json',
    },
    {
      name: 'period',
      type: 'select',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
    },
  ],
}
```

3. **Create AI Service** (1 hour)
```typescript
// src/services/ai/index.ts
export class AIService {
  async enrichJob(job: Job): Promise<JobEnrichment> {
    const openai = new OpenAI();
    
    // Generate job insights
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze this job posting and provide key insights."
        },
        {
          role: "user",
          content: `${job.title}\n${job.description}`
        }
      ]
    });

    return {
      insights: completion.choices[0].message.content,
      keywords: extractKeywords(job),
      marketTrends: await analyzeMarketTrends(job),
      timestamp: new Date(),
    };
  }

  async calculateTalentScore(job: Job): Promise<TalentScore> {
    // Implement scoring logic
    return {
      score: calculateScore(job),
      factors: analyzeFactors(job),
      lastUpdated: new Date(),
    };
  }
}
```

### Afternoon: Integration (1pm - 5pm)

1. **Extend JobAdder Sync** (2 hours)
```typescript
// src/plugins/ats/integrations/jobAdder/sync.ts
export async function syncJobs(client: JobAdderClient, tenantId: number): Promise<SyncStats> {
  const aiService = new AIService();
  
  // Existing sync logic...
  
  for (const job of jobs) {
    // Transform job
    const transformedJob = await transformJob(job, tenantId);
    
    // Add AI enrichment
    const enrichment = await aiService.enrichJob(transformedJob);
    const talentScore = await aiService.calculateTalentScore(transformedJob);
    
    transformedJob.aiEnrichment = enrichment;
    transformedJob.talentScore = talentScore;
    
    // Save to database...
  }
}
```

2. **Add Analytics Processing** (2 hours)
```typescript
// src/services/analytics/processor.ts
export class AnalyticsProcessor {
  async processJobMetrics(tenantId: number): Promise<void> {
    const jobs = await payload.find({
      collection: 'jobs',
      where: {
        tenant: {
          equals: tenantId
        }
      }
    });

    const metrics = {
      totalJobs: jobs.docs.length,
      averageScore: calculateAverageScore(jobs.docs),
      topSkills: extractTopSkills(jobs.docs),
      marketTrends: analyzeMarketTrends(jobs.docs),
    };

    await payload.create({
      collection: 'analytics',
      data: {
        name: `Job Analytics ${new Date().toISOString()}`,
        tenant: tenantId,
        metrics,
        insights: await generateInsights(metrics),
        period: 'daily',
      }
    });
  }
}
```

## Day 2: UI & Testing

### Morning: Dashboard Components (9am - 12pm)

1. **Add Analytics Dashboard** (2 hours)
```typescript
// src/app/(payload)/admin/analytics/page.tsx
export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<Metrics>();
  const [insights, setInsights] = useState<Insights>();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div>
      <MetricsSummary metrics={metrics} />
      <InsightsPanel insights={insights} />
      <TrendCharts data={metrics?.trends} />
    </div>
  );
}
```

2. **Create Visualization Components** (1 hour)
```typescript
// src/components/analytics/MetricsSummary.tsx
export function MetricsSummary({ metrics }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="Total Jobs"
        value={metrics.totalJobs}
        trend={metrics.jobTrend}
      />
      <MetricCard
        title="Average Score"
        value={metrics.averageScore}
        trend={metrics.scoreTrend}
      />
      <MetricCard
        title="Top Skills"
        value={metrics.topSkills.join(', ')}
      />
    </div>
  );
}
```

### Afternoon: Testing & Deployment (1pm - 5pm)

1. **Add Tests** (2 hours)
```typescript
// src/services/ai/__tests__/ai-service.test.ts
describe('AIService', () => {
  it('should enrich job data', async () => {
    const service = new AIService();
    const job = mockJob();
    
    const enrichment = await service.enrichJob(job);
    
    expect(enrichment).toHaveProperty('insights');
    expect(enrichment).toHaveProperty('keywords');
    expect(enrichment).toHaveProperty('marketTrends');
  });

  it('should calculate talent score', async () => {
    const service = new AIService();
    const job = mockJob();
    
    const score = await service.calculateTalentScore(job);
    
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.factors).toBeInstanceOf(Array);
  });
});
```

2. **Deploy & Monitor** (2 hours)
- Update environment variables
- Deploy changes to staging
- Monitor performance
- Check error rates

## Dependencies

1. **OpenAI API Key**
```env
OPENAI_API_KEY=your_key_here
```

2. **Package Updates**
```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "chart.js": "^4.0.0",
    "@payloadcms/plugin-cloud": "^1.0.0"
  }
}
```

## Success Criteria

- AI enrichment working for all new jobs
- Analytics dashboard showing real data
- Tests passing
- Error rate < 1%
- Response time < 500ms

## Rollback Plan

1. Revert database changes
2. Disable AI features
3. Return to previous sync implementation
4. Monitor system stability

## Future Enhancements

1. Advanced ML models
2. Real-time analytics
3. Custom reporting
4. API access

This 2-day plan focuses on extending our existing architecture rather than building new systems. It leverages our current JobAdder integration and Payload CMS setup while adding AI capabilities in a maintainable way.