'use client'

import Link from 'next/link'

const styles = {
  notFound: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center' as const,
    padding: '2rem',
  },
  heading: {
    marginBottom: '1rem',
    fontSize: '2rem',
  },
  paragraph: {
    marginBottom: '2rem',
    color: '#666',
  },
  link: {
    color: '#0070f3',
    textDecoration: 'none',
    border: '1px solid #0070f3',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
  },
}

export default function NotFound() {
  return (
    <div style={styles.notFound}>
      <h1 style={styles.heading}>404 - Page Not Found</h1>
      <p style={styles.paragraph}>The Payload admin page you are looking for does not exist.</p>
      <Link href="/admin" style={styles.link}>
        Return to Admin Dashboard
      </Link>
    </div>
  )
}
