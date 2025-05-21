// Add any global test setup here
process.env.NODE_ENV = 'test'

// Increase timeout for all tests
jest.setTimeout(10000)

// Add global mocks if needed
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
}
