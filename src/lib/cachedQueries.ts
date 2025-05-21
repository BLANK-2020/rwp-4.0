/**
 * Cached Queries
 *
 * This module provides cached versions of common database queries.
 * It uses the caching system to improve performance for frequently accessed data.
 */

import payload from 'payload'
import { cachifyAsync } from './caching'

// Cache keys
const CACHE_KEYS = {
  JOB: 'job',
  JOBS: 'jobs',
  SECTOR: 'sector',
  SECTORS: 'sectors',
  FEATURED_JOBS: 'featured_jobs',
  RECENT_JOBS: 'recent_jobs',
  JOBS_BY_SECTOR: 'jobs_by_sector',
  JOBS_BY_LOCATION: 'jobs_by_location',
}

// Cache TTLs (in seconds)
const CACHE_TTLS = {
  JOB: 60 * 5, // 5 minutes
  JOBS: 60 * 5, // 5 minutes
  SECTOR: 60 * 30, // 30 minutes
  SECTORS: 60 * 30, // 30 minutes
  FEATURED_JOBS: 60 * 5, // 5 minutes
  RECENT_JOBS: 60 * 5, // 5 minutes
  JOBS_BY_SECTOR: 60 * 5, // 5 minutes
  JOBS_BY_LOCATION: 60 * 5, // 5 minutes
}

/**
 * Get a job by ID (cached)
 * @param id The job ID
 * @returns The job or null if not found
 */
export const getJobById = cachifyAsync(
  async (id: string) => {
    try {
      const job = await payload.findByID({
        collection: 'jobs' as any,
        id,
      })

      return job
    } catch (error) {
      console.error('Error fetching job by ID:', error)
      return null
    }
  },
  CACHE_KEYS.JOB,
  CACHE_TTLS.JOB,
)

/**
 * Get a job by slug (cached)
 * @param slug The job slug
 * @returns The job or null if not found
 */
export const getJobBySlug = cachifyAsync(
  async (slug: string) => {
    try {
      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          slug: { equals: slug },
          status: { equals: 'published' },
          expiry_date: { greater_than: new Date().toISOString() },
        },
        limit: 1,
      })

      if (jobs.docs.length === 0) {
        return null
      }

      return jobs.docs[0]
    } catch (error) {
      console.error('Error fetching job by slug:', error)
      return null
    }
  },
  CACHE_KEYS.JOB,
  CACHE_TTLS.JOB,
)

/**
 * Get jobs with pagination (cached)
 * @param page The page number
 * @param limit The number of jobs per page
 * @param where The query conditions
 * @param sort The sort order
 * @returns The jobs with pagination info
 */
export const getJobs = cachifyAsync(
  async (
    page: number = 1,
    limit: number = 10,
    where: Record<string, any> = {},
    sort: string = '-created_at',
  ) => {
    try {
      // Add default conditions
      const defaultWhere = {
        status: { equals: 'published' },
        expiry_date: { greater_than: new Date().toISOString() },
      }

      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          ...defaultWhere,
          ...where,
        },
        page,
        limit,
        sort,
      })

      return jobs
    } catch (error) {
      console.error('Error fetching jobs:', error)
      return {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
    }
  },
  CACHE_KEYS.JOBS,
  CACHE_TTLS.JOBS,
)

/**
 * Get featured jobs (cached)
 * @param limit The number of jobs to return
 * @returns The featured jobs
 */
export const getFeaturedJobs = cachifyAsync(
  async (limit: number = 5) => {
    try {
      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          status: { equals: 'published' },
          expiry_date: { greater_than: new Date().toISOString() },
          featured: { equals: true },
        },
        limit,
        sort: '-created_at',
      })

      return jobs.docs
    } catch (error) {
      console.error('Error fetching featured jobs:', error)
      return []
    }
  },
  CACHE_KEYS.FEATURED_JOBS,
  CACHE_TTLS.FEATURED_JOBS,
)

/**
 * Get recent jobs (cached)
 * @param limit The number of jobs to return
 * @returns The recent jobs
 */
export const getRecentJobs = cachifyAsync(
  async (limit: number = 10) => {
    try {
      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          status: { equals: 'published' },
          expiry_date: { greater_than: new Date().toISOString() },
        },
        limit,
        sort: '-created_at',
      })

      return jobs.docs
    } catch (error) {
      console.error('Error fetching recent jobs:', error)
      return []
    }
  },
  CACHE_KEYS.RECENT_JOBS,
  CACHE_TTLS.RECENT_JOBS,
)

/**
 * Get jobs by sector (cached)
 * @param sectorId The sector ID
 * @param page The page number
 * @param limit The number of jobs per page
 * @returns The jobs with pagination info
 */
export const getJobsBySector = cachifyAsync(
  async (sectorId: string, page: number = 1, limit: number = 10) => {
    try {
      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          status: { equals: 'published' },
          expiry_date: { greater_than: new Date().toISOString() },
          sector: { equals: sectorId },
        },
        page,
        limit,
        sort: '-created_at',
      })

      return jobs
    } catch (error) {
      console.error('Error fetching jobs by sector:', error)
      return {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
    }
  },
  CACHE_KEYS.JOBS_BY_SECTOR,
  CACHE_TTLS.JOBS_BY_SECTOR,
)

/**
 * Get jobs by location (cached)
 * @param location The location
 * @param page The page number
 * @param limit The number of jobs per page
 * @returns The jobs with pagination info
 */
export const getJobsByLocation = cachifyAsync(
  async (location: string, page: number = 1, limit: number = 10) => {
    try {
      const jobs = await payload.find({
        collection: 'jobs' as any,
        where: {
          status: { equals: 'published' },
          expiry_date: { greater_than: new Date().toISOString() },
          location: { like: location },
        },
        page,
        limit,
        sort: '-created_at',
      })

      return jobs
    } catch (error) {
      console.error('Error fetching jobs by location:', error)
      return {
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
    }
  },
  CACHE_KEYS.JOBS_BY_LOCATION,
  CACHE_TTLS.JOBS_BY_LOCATION,
)

/**
 * Get a sector by ID (cached)
 * @param id The sector ID
 * @returns The sector or null if not found
 */
export const getSectorById = cachifyAsync(
  async (id: string) => {
    try {
      const sector = await payload.findByID({
        collection: 'sectors' as any,
        id,
      })

      return sector
    } catch (error) {
      console.error('Error fetching sector by ID:', error)
      return null
    }
  },
  CACHE_KEYS.SECTOR,
  CACHE_TTLS.SECTOR,
)

/**
 * Get a sector by slug (cached)
 * @param slug The sector slug
 * @returns The sector or null if not found
 */
export const getSectorBySlug = cachifyAsync(
  async (slug: string) => {
    try {
      const sectors = await payload.find({
        collection: 'sectors' as any,
        where: {
          slug: { equals: slug },
        },
        limit: 1,
      })

      if (sectors.docs.length === 0) {
        return null
      }

      return sectors.docs[0]
    } catch (error) {
      console.error('Error fetching sector by slug:', error)
      return null
    }
  },
  CACHE_KEYS.SECTOR,
  CACHE_TTLS.SECTOR,
)

/**
 * Get all sectors (cached)
 * @returns All sectors
 */
export const getAllSectors = cachifyAsync(
  async () => {
    try {
      const sectors = await payload.find({
        collection: 'sectors' as any,
        limit: 100,
        sort: 'name',
      })

      return sectors.docs
    } catch (error) {
      console.error('Error fetching all sectors:', error)
      return []
    }
  },
  CACHE_KEYS.SECTORS,
  CACHE_TTLS.SECTORS,
)

/**
 * Get parent sectors (cached)
 * @returns Parent sectors
 */
export const getParentSectors = cachifyAsync(
  async () => {
    try {
      const sectors = await payload.find({
        collection: 'sectors' as any,
        where: {
          parent: { exists: false },
        },
        limit: 100,
        sort: 'name',
      })

      return sectors.docs
    } catch (error) {
      console.error('Error fetching parent sectors:', error)
      return []
    }
  },
  CACHE_KEYS.SECTORS,
  CACHE_TTLS.SECTORS,
)

/**
 * Get child sectors by parent ID (cached)
 * @param parentId The parent sector ID
 * @returns Child sectors
 */
export const getChildSectors = cachifyAsync(
  async (parentId: string) => {
    try {
      const sectors = await payload.find({
        collection: 'sectors' as any,
        where: {
          parent: { equals: parentId },
        },
        limit: 100,
        sort: 'name',
      })

      return sectors.docs
    } catch (error) {
      console.error('Error fetching child sectors:', error)
      return []
    }
  },
  CACHE_KEYS.SECTORS,
  CACHE_TTLS.SECTORS,
)
