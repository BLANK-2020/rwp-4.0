import React from 'react'
import Link from 'next/link'

// Define the props for the component
interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  searchParams: Record<string, string | undefined>
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}) => {
  // Generate the URL for a specific page
  const getPageUrl = (page: number) => {
    // Create a copy of the search params
    const params = new URLSearchParams()

    // Add all existing params except page
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && value) {
        params.set(key, value)
      }
    })

    // Add the page param
    params.set('page', page.toString())

    // Return the URL
    return `${baseUrl}?${params.toString()}`
  }

  // Determine which page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = []

    // Always show the first page
    pageNumbers.push(1)

    // Calculate the range of pages to show around the current page
    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    // Add ellipsis after the first page if needed
    if (rangeStart > 2) {
      pageNumbers.push('ellipsis-start')
    }

    // Add the range of pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i)
    }

    // Add ellipsis before the last page if needed
    if (rangeEnd < totalPages - 1) {
      pageNumbers.push('ellipsis-end')
    }

    // Always show the last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Get the page numbers to display
  const pageNumbers = getPageNumbers()

  return (
    <nav className="flex justify-center mt-8">
      <ul className="flex space-x-2">
        {/* Previous Page Button */}
        {currentPage > 1 && (
          <li>
            <Link
              href={getPageUrl(currentPage - 1)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Previous page"
            >
              &laquo;
            </Link>
          </li>
        )}

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          // Handle ellipsis
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <li key={`ellipsis-${index}`}>
                <span className="px-3 py-2 text-gray-500">...</span>
              </li>
            )
          }

          // Handle regular page numbers
          const pageNum = page as number
          const isCurrentPage = pageNum === currentPage

          return (
            <li key={pageNum}>
              {isCurrentPage ? (
                <span className="px-3 py-2 bg-blue-500 text-white rounded-md">{pageNum}</span>
              ) : (
                <Link
                  href={getPageUrl(pageNum)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  {pageNum}
                </Link>
              )}
            </li>
          )
        })}

        {/* Next Page Button */}
        {currentPage < totalPages && (
          <li>
            <Link
              href={getPageUrl(currentPage + 1)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Next page"
            >
              &raquo;
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
