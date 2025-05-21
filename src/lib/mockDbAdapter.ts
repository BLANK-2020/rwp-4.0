import { DatabaseAdapter } from 'payload/database'

/**
 * Mock Database Adapter for Payload CMS
 * 
 * This adapter provides mock functionality for testing purposes when
 * a real database connection is not available.
 */
export const mockDbAdapter = (): DatabaseAdapter => {
  // In-memory storage for collections
  const collections: Record<string, any[]> = {
    users: [],
    jobs: [],
    sectors: [],
    events: [],
    tenants: [],
    media: [],
  }

  // Generate a random ID
  const generateId = () => Math.random().toString(36).substring(2, 15)

  return {
    name: 'mock-db-adapter',
    connect: async () => {
      console.log('Connected to mock database')
      return
    },
    disconnect: async () => {
      console.log('Disconnected from mock database')
      return
    },
    find: async ({ collection, where, sort, limit, skip }) => {
      console.log(`Mock find in collection: ${collection}`)
      
      // Return mock data based on collection
      const docs = collections[collection] || []
      
      // Apply pagination
      const paginatedDocs = docs.slice(skip || 0, (skip || 0) + (limit || docs.length))
      
      return {
        docs: paginatedDocs,
        totalDocs: docs.length,
        totalPages: Math.ceil(docs.length / (limit || docs.length)),
        page: Math.floor((skip || 0) / (limit || docs.length)) + 1,
        pagingCounter: (skip || 0) + 1,
        hasPrevPage: (skip || 0) > 0,
        hasNextPage: (skip || 0) + (limit || docs.length) < docs.length,
        prevPage: (skip || 0) > 0 ? Math.floor((skip || 0) / (limit || docs.length)) : null,
        nextPage: (skip || 0) + (limit || docs.length) < docs.length ? Math.floor((skip || 0) / (limit || docs.length)) + 2 : null,
      }
    },
    findOne: async ({ collection, where }) => {
      console.log(`Mock findOne in collection: ${collection}`)
      return collections[collection]?.[0] || null
    },
    create: async ({ collection, data }) => {
      console.log(`Mock create in collection: ${collection}`)
      const newDoc = { ...data, id: generateId() }
      collections[collection] = collections[collection] || []
      collections[collection].push(newDoc)
      return newDoc
    },
    updateOne: async ({ collection, id, data }) => {
      console.log(`Mock updateOne in collection: ${collection}`)
      const collectionData = collections[collection] || []
      const index = collectionData.findIndex(doc => doc.id === id)
      
      if (index !== -1) {
        collections[collection][index] = { ...collections[collection][index], ...data }
        return collections[collection][index]
      }
      
      return null
    },
    deleteOne: async ({ collection, id }) => {
      console.log(`Mock deleteOne in collection: ${collection}`)
      const collectionData = collections[collection] || []
      const index = collectionData.findIndex(doc => doc.id === id)
      
      if (index !== -1) {
        const deleted = collections[collection][index]
        collections[collection].splice(index, 1)
        return deleted
      }
      
      return null
    },
    createGlobalVersion: async () => {
      return { id: generateId() }
    },
    findGlobalVersions: async () => {
      return { docs: [], totalDocs: 0, totalPages: 0, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null }
    },
    findGlobalVersionByID: async () => {
      return null
    },
    updateGlobalVersion: async () => {
      return null
    },
    deleteGlobalVersion: async () => {
      return null
    },
    createCollectionVersion: async () => {
      return { id: generateId() }
    },
    findCollectionVersions: async () => {
      return { docs: [], totalDocs: 0, totalPages: 0, page: 1, pagingCounter: 1, hasPrevPage: false, hasNextPage: false, prevPage: null, nextPage: null }
    },
    findCollectionVersionByID: async () => {
      return null
    },
    updateCollectionVersion: async () => {
      return null
    },
    deleteCollectionVersion: async () => {
      return null
    },
    migrateDown: async () => {
      return
    },
    migrateUp: async () => {
      return
    },
    migrateFresh: async () => {
      return
    },
    migrationStatus: async () => {
      return []
    },
  }
}
