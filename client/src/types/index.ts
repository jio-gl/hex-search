export interface SearchResult {
  id: string;
  hash: string;
  type: 'Transaction' | 'Address' | 'Block' | 'Contract' | 'Token';
  blockchain: string;
  blockNumber: number;
  timestamp: number;
}
