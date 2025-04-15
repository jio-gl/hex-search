import React from 'react';
import { render, screen } from '@testing-library/react';
import CrossChainSearchResults from '../CrossChainSearchResults';
import * as searchHook from '../../hooks/useCrossChainSearch';

// Mock the entire hook module
jest.mock('../../hooks/useCrossChainSearch');

describe('CrossChainSearchResults', () => {
  // Mock implementation of useCrossChainSearch
  const mockUseCrossChainSearch = searchHook.useCrossChainSearch as jest.MockedFunction<typeof searchHook.useCrossChainSearch>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('displays search results correctly', () => {
    // Set up mock return value for this test
    mockUseCrossChainSearch.mockReturnValue({
      results: [
        {
          id: '1',
          blockchain: 'ethereum',
          blockNumber: 22271649,
          timestamp: new Date().toISOString(),
          blockHash: '0x8f6d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e2',
          address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
          type: 'fee_recipient'
        }
      ],
      loading: false,
      error: null,
      search: jest.fn()
    });

    render(<CrossChainSearchResults />);

    // Check blockchain name
    expect(screen.getByText('ethereum')).toBeInTheDocument();

    // Check block number (using regex to match the formatted number)
    expect(screen.getByText(/#22,271,649/)).toBeInTheDocument();

    // Check interaction type badge
    expect(screen.getByText('Fee Recipient')).toBeInTheDocument();

    // Check address
    expect(screen.getByText('0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    // Mock loading state
    mockUseCrossChainSearch.mockReturnValue({
      results: [],
      loading: true,
      error: null,
      search: jest.fn()
    });

    render(<CrossChainSearchResults />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    // Mock error state
    mockUseCrossChainSearch.mockReturnValue({
      results: [],
      loading: false,
      error: 'Test error message',
      search: jest.fn()
    });

    render(<CrossChainSearchResults />);
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('shows no results message', () => {
    // Mock empty results state
    mockUseCrossChainSearch.mockReturnValue({
      results: [],
      loading: false,
      error: null,
      search: jest.fn()
    });

    render(<CrossChainSearchResults />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    const now = new Date();
    mockUseCrossChainSearch.mockReturnValue({
      results: [
        {
          id: '1',
          blockchain: 'ethereum',
          blockNumber: 22271649,
          timestamp: now.toISOString(),
          blockHash: '0x8f6d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e2',
          address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
          type: 'fee_recipient'
        }
      ],
      loading: false,
      error: null,
      search: jest.fn()
    });

    render(<CrossChainSearchResults />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });
}); 