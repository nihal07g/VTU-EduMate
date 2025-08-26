// Jest setup file for VTU EduMate RAG tests

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set longer timeout for tests that involve embedding generation
jest.setTimeout(30000);