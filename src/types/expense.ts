export interface User {
  id: number;
  name: string;
  balance: number;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  userId: number;
  amount: number;
  description: string;
  date: string;
  time: string | null;
  imageUrl: string | null;
}

export const USER_COLORS = [
  'hsl(217 91% 60%)',   // blue
  'hsl(142 71% 45%)',   // emerald
  'hsl(38 92% 50%)',    // amber
  'hsl(351 95% 71%)',   // rose
  'hsl(271 76% 53%)',   // violet
  'hsl(199 89% 48%)',   // sky
] as const;
