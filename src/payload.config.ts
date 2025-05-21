import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import Tenants from './collections/Tenants'
import Jobs from './collections/Jobs'
import Sectors from './collections/Sectors'
import Events from './collections/Events'
import Analytics from './collections/Analytics'
import Candidates from './collections/Candidates'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Initialize collections array first
const collections = [Users, Media, Tenants, Jobs, Sectors, Events, Analytics, Candidates]

// Use the same database configuration that worked in our test script
const dbConfig = {
  connectionString: process.env.DATABASE_URI,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 60000,
  statement_timeout: 60000,
  query_timeout: 60000,
}

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
  // Use PostgreSQL adapter with the working configuration
  db: postgresAdapter({
    pool: dbConfig,
  }),
  debug: true,
  sharp,
  plugins: [],
})
