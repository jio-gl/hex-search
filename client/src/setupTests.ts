import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API handlers
export const handlers = [
  rest.get('/api/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    const blockchain = req.url.searchParams.get('blockchain');

    return res(
      ctx.json({
        results: [
          {
            id: '1',
            blockchain: 'ethereum',
            blockNumber: 22271649,
            timestamp: new Date().toISOString(),
            blockHash: '0x8f6d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e2',
            address: query,
            type: 'fee_recipient'
          },
          {
            id: '2',
            blockchain: 'ethereum',
            blockNumber: 22271648,
            timestamp: new Date(Date.now() - 12000).toISOString(),
            blockHash: '0x7a1d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e1',
            transactionHash: '0x3a1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
            address: query,
            type: 'transaction_from'
          }
        ]
      })
    );
  })
];

const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 