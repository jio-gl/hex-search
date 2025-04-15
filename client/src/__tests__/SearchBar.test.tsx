import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../components/SearchBar';
import toast from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  }
}));

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();
  let toastErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    toastErrorSpy = jest.spyOn(toast, 'error');
    render(<SearchBar onSearch={mockOnSearch} />);
  });

  afterEach(() => {
    toastErrorSpy.mockRestore();
  });

  it('renders search input and button', () => {
    expect(screen.getByPlaceholderText(/Enter hex value/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  it('renders blockchain selector', () => {
    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });

  it('shows error for empty search', async () => {
    const searchButton = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith('Please enter a search query');
      expect(screen.getByText('Please enter a search query')).toBeInTheDocument();
    });
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('shows error toast for invalid hex value', async () => {
    const searchInput = screen.getByPlaceholderText(/Enter hex value/i);
    fireEvent.change(searchInput, { target: { value: 'invalid-hex-value' } });
    
    const searchButton = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith('Invalid hex value format');
      expect(screen.getByText('Invalid hex value format')).toBeInTheDocument();
    });
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('accepts valid hex value', async () => {
    const searchInput = screen.getByPlaceholderText(/Enter hex value/i);
    fireEvent.change(searchInput, { target: { value: '0x1a2b3c4d' } });
    
    const searchButton = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        query: '0x1a2b3c4d',
        blockchain: 'ethereum'
      });
    });
    expect(toastErrorSpy).not.toHaveBeenCalled();
  });

  it('accepts partial hex patterns', async () => {
    const searchInput = screen.getByPlaceholderText(/Enter hex value/i);
    fireEvent.change(searchInput, { target: { value: '0x12*' } });
    
    const searchButton = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        query: '0x12*',
        blockchain: 'ethereum'
      });
    });
    expect(toastErrorSpy).not.toHaveBeenCalled();
  });

  it('handles blockchain selection', async () => {
    const selector = screen.getByRole('combobox');
    fireEvent.change(selector, { target: { value: 'bitcoin' } });

    const searchInput = screen.getByPlaceholderText(/Enter hex value/i);
    fireEvent.change(searchInput, { target: { value: '0x1234' } });
    
    const searchButton = screen.getByRole('button', { name: /Search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        query: '0x1234',
        blockchain: 'bitcoin'
      });
    });
  });
});
