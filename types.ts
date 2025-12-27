
export interface User {
  id: string;
  username: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: number;
  status: 'completed' | 'pending';
}

export interface Bet {
  amount: number;
  autoCashOut?: number;
  isCashedOut: boolean;
  cashedAt?: number;
  winAmount?: number;
}

export enum GameState {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  FLYING = 'FLYING',
  CRASHED = 'CRASHED'
}

export interface HistoryItem {
  id: string;
  multiplier: number;
  timestamp: number;
}
