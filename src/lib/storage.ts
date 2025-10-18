import { User, Transaction } from '@/types/expense';

export const storage = {
  getUsers: (): User[] => {
    const saved = localStorage.getItem('expenseManagerUsers');
    return saved ? JSON.parse(saved) : [];
  },
  
  setUsers: (users: User[]) => {
    localStorage.setItem('expenseManagerUsers', JSON.stringify(users));
  },
  
  getTransactions: (): Transaction[] => {
    const saved = localStorage.getItem('expenseManagerTransactions');
    return saved ? JSON.parse(saved) : [];
  },
  
  setTransactions: (transactions: Transaction[]) => {
    localStorage.setItem('expenseManagerTransactions', JSON.stringify(transactions));
  },
  
  getNextUserId: (): number => {
    const saved = localStorage.getItem('expenseManagerNextUserId');
    return saved ? parseInt(saved, 10) : 1;
  },
  
  setNextUserId: (id: number) => {
    localStorage.setItem('expenseManagerNextUserId', id.toString());
  },
  
  getNextTransactionId: (): number => {
    const saved = localStorage.getItem('expenseManagerNextTransactionId');
    return saved ? parseInt(saved, 10) : 1;
  },
  
  setNextTransactionId: (id: number) => {
    localStorage.setItem('expenseManagerNextTransactionId', id.toString());
  },
};
