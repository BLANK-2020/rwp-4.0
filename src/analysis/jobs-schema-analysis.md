# Task 1.1.1: Analysis of Existing Jobs Schema and Required Changes

## Current Jobs Schema

After analyzing the current `Jobs.ts` file, here's the existing schema:

```typescript
fields: [
  { name: 'title', type: 'text', required: true },
  { name: 'description', type: 'richText', required: true },
  { name: 'location', type: 'text', required: true },
  { 
    name: 'type', 
    type: 'select',
    options: ['full-time', 'part-time', 'contract', 'temporary'],
    required: true 
  },
  { 
    name: 'salary', 
    type: 'group',
    fields: [
      { name: 'min', type: 'number' },
      { name: 'max', type: 'number' },
      { name: 'currency', type: 'text', defaultValue: 'USD' }
    ]
  },
  { 
    name: 'status', 
    type: 'select',
    options: ['draft', 'published', 'closed'],
    defaultValue: 'draft',
    required: true 
  },
  { name: 'tenant', type: 'relationship', relationTo: 'tenants', required: true },
  { 
    name: 'atsData', 
    type: 'group',
    fields: [
      { name: 'jobAdderId', type: 'text', admin: { readOnly: true } },
      { name: 'bullhornId', type: 'text', admin: { readOnly: true } }
    ]
  },
  { 
    name: 'seo', 
    type: 'group',
    fields: [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'keywords', type: 'text' }
    ]
  }
]
```

## Required Fields from PRD

Based on the PRD for the hybrid job board, we need the following fields:

| Field           | Source      | Type      | Notes                     |
|----------------|-------------|-----------|---------------------------|
| `title`        | JobAdder    | String    | Already exists            |
| `slug`         | Generated   | String    | Need to add - based on title |
| `location`     | JobAdder    | String    | Already exists            |
| `sector`       | CMS         | Relation  | Need to add - linked to Sector Collection |
| `job_type`     | JobAdder    | Enum      | Already exists as 'type'  |
| `salary_min`   | JobAdder    | Integer   | Already exists in salary group |
| `salary_max`   | JobAdder    | Integer   | Already exists in salary group |
| `salary_period`| CMS         | Enum      | Need to add to salary group |
| `description`  | JobAdder    | Rich Text | Already exists            |
| `featured`     | CMS         | Boolean   | Need to add               |
| `expiry_date`  | JobAdder    | Date      | Need to add               |
| `created_at`   | Auto        | Date      | Need to add               |
| `apply_link`   | JobAdder    | URL       | Need to add               |

## Required Changes

1. **Add New Fields:**
   - `slug` (string): Auto-generated from title
   - `sector` (relationship): Linked to new Sectors collection
   - `featured` (boolean): Flag for homepage display
   - `expiry_date` (date): Hide job after this date
   - `created_at` (date): Automatically set during creation
   - `apply_link` (text/URL): For tracking applications

2. **Modify Existing Fields:**
   - `salary`: Add `period` field (enum: 'Annual'/'Hourly')

3. **Enhance atsData for Multi-ATS Support:**
   - Restructure `atsData` to include:
     - `source` (string): Identifier for ATS source ("jobadder", "bullhorn", etc.)
     - `sourceId` (string): ID in the source system
     - `sourceReference` (string): Additional reference info
     - `lastSynced` (date): When the job was last synced
     - ATS-specific data objects

4. **Add Hooks:**
   - Add a `beforeValidate` hook to generate slug from title
   - Enhance existing `afterChange` hook to handle multi-ATS sync

## Implementation Approach

For the next task (1.1.2), we'll need to:

1. Update the Jobs collection schema with the new fields
2. Implement the slug generation logic
3. Enhance the atsData structure for multi-ATS support
4. Ensure backward compatibility with existing jobs

This analysis completes Task 1.1.1. The next step is to implement these changes in the Jobs collection schema.