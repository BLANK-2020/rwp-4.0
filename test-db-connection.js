import pg from 'pg'

const { Pool } = pg

// Load environment variables from .env file
import dotenv from 'dotenv'
dotenv.config()

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URI ||
    'postgresql://YOUR_USERNAME:YOUR_PASSWORD@db-postgresql-syd1-86092-do-user-22012122-0.k.db.ondigitalocean.com:25060/defaultdb',
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 60000,
})

async function testConnection() {
  try {
    console.log('Attempting to connect to PostgreSQL...')
    const client = await pool.connect()
    console.log('Successfully connected to PostgreSQL')
    const result = await client.query('SELECT NOW()')
    console.log('Query result:', result.rows[0])
    await client.release()
    await pool.end()
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err)
  }
}

testConnection()
