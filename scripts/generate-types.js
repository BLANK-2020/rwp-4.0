#!/usr/bin/env node

/**
 * Script to regenerate the payload-types.ts file
 *
 * This script will regenerate the payload-types.ts file to include the new fields
 * we've added to the collections. This helps resolve TypeScript errors.
 *
 * Usage: node scripts/generate-types.js
 */

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the path to the payload config
const payloadConfigPath = path.resolve(__dirname, '../src/payload.config.ts')

// Check if the payload config exists
if (!fs.existsSync(payloadConfigPath)) {
  console.error(`Payload config not found at ${payloadConfigPath}`)
  process.exit(1)
}

// Define the command to run
const command = 'npx payload generate:types'

try {
  // Run the command
  console.log('Generating Payload types...')
  execSync(command, { stdio: 'inherit' })
  console.log('Payload types generated successfully!')
} catch (error) {
  console.error('Error generating Payload types:', error.message)
  process.exit(1)
}

// Check if the types file was generated
const typesPath = path.resolve(__dirname, '../src/payload-types.ts')
if (!fs.existsSync(typesPath)) {
  console.error(`Types file not found at ${typesPath}`)
  process.exit(1)
}

console.log(`Types file generated at ${typesPath}`)

// Add a note to the README about regenerating types
const readmePath = path.resolve(__dirname, '../README.md')
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8')

  if (!readme.includes('## Regenerating Types')) {
    const typesNote = `
## Regenerating Types

If you make changes to the collection schemas, you'll need to regenerate the TypeScript types:

\`\`\`bash
node scripts/generate-types.js
\`\`\`

This will update the \`src/payload-types.ts\` file with the latest types based on your collection schemas.
`

    fs.writeFileSync(readmePath, readme + typesNote)
    console.log('Added note about regenerating types to README.md')
  }
}

console.log('Done!')
