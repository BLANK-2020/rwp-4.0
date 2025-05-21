/**
 * Vector Database Integration Module
 *
 * This module provides functions for interacting with a vector database (Pinecone)
 * for storing and retrieving embeddings.
 */

import { Pinecone } from '@pinecone-database/pinecone'

// Initialize the Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
  environment: process.env.PINECONE_ENVIRONMENT || '',
})

// Get the index name from environment variables
const indexName = process.env.PINECONE_INDEX || 'rwp-embeddings'

// Get the index
const index = pinecone.index(indexName)

/**
 * Create an embedding in the vector database
 * @param id The ID of the embedding
 * @param embedding The embedding vector
 * @param text The original text
 * @param metadata Additional metadata
 * @returns The created embedding
 */
export async function createEmbedding(
  id: string,
  embedding: number[],
  text: string,
  metadata: Record<string, any> = {},
) {
  try {
    // Add the text to the metadata
    const fullMetadata = {
      ...metadata,
      text,
    }

    // Upsert the embedding
    await index.upsert({
      vectors: [
        {
          id,
          values: embedding,
          metadata: fullMetadata,
        },
      ],
    })

    return {
      id,
      embedding,
      metadata: fullMetadata,
    }
  } catch (error) {
    console.error('Error creating embedding:', error)
    throw error
  }
}

/**
 * Query the vector database for similar embeddings
 * @param embedding The embedding vector to query with
 * @param options Additional options for the query
 * @returns The query results
 */
export async function querySimilarEmbeddings(
  embedding: number[],
  options: {
    topK?: number
    filter?: Record<string, any>
    includeMetadata?: boolean
    includeValues?: boolean
  } = {},
) {
  try {
    const { topK = 10, filter = {}, includeMetadata = true, includeValues = false } = options

    // Query the index
    const results = await index.query({
      vector: embedding,
      topK,
      filter,
      includeMetadata,
      includeValues,
    })

    return results.matches
  } catch (error) {
    console.error('Error querying similar embeddings:', error)
    throw error
  }
}

/**
 * Delete an embedding from the vector database
 * @param id The ID of the embedding to delete
 * @returns Whether the deletion was successful
 */
export async function deleteEmbedding(id: string) {
  try {
    // Delete the embedding
    await index.deleteOne(id)
    return true
  } catch (error) {
    console.error('Error deleting embedding:', error)
    throw error
  }
}

/**
 * Delete multiple embeddings from the vector database
 * @param ids The IDs of the embeddings to delete
 * @returns Whether the deletion was successful
 */
export async function deleteEmbeddings(ids: string[]) {
  try {
    // Delete the embeddings
    await index.deleteMany(ids)
    return true
  } catch (error) {
    console.error('Error deleting embeddings:', error)
    throw error
  }
}

/**
 * Initialize the vector database
 * @returns Whether the initialization was successful
 */
export async function initializeVectorDb() {
  try {
    // Check if the index exists
    const indexes = await pinecone.listIndexes()

    // If the index doesn't exist, create it
    if (!indexes.includes(indexName)) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // Default dimension for OpenAI embeddings
        metric: 'cosine',
      })

      console.log(`Created vector database index: ${indexName}`)
    } else {
      console.log(`Vector database index already exists: ${indexName}`)
    }

    return true
  } catch (error) {
    console.error('Error initializing vector database:', error)
    throw error
  }
}

export default {
  createEmbedding,
  querySimilarEmbeddings,
  deleteEmbedding,
  deleteEmbeddings,
  initializeVectorDb,
}
