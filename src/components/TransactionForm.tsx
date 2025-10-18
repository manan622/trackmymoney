import { useState } from 'react';
import { User } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';

interface TransactionFormProps {
  users: User[];
  onSubmit: (data: {
    type: 'income' | 'expense';
    userId: number;
    amount: number;
    description: string;
    date: string;
    time: string | null;
    imageFile: File | null;
  }) => void;
}

export function TransactionForm({ users, onSubmit }: TransactionFormProps) {
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [userId, setUserId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !amount || !description || !date) return;

    onSubmit({
      type,
      userId: parseInt(userId),
      amount: parseFloat(amount),
      description,
      date,
      time: time || null,
      imageFile,
    });

    // Reset form
    setAmount('');
    setDescription('');
    setDate(getTodayDate());
    setTime('');
    setImageFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <Label className="text-sm font-medium mb-3 block">Transaction Type:</Label>
        <RadioGroup value={type} onValueChange={(v) => setType(v as 'income' | 'expense')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="income" />
            <Label htmlFor="income" className="flex items-center gap-2 cursor-pointer">
              <TrendingUp className="w-4 h-4 text-income" />
              <span>Income</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expense" id="expense" />
            <Label htmlFor="expense" className="flex items-center gap-2 cursor-pointer">
              <TrendingDown className="w-4 h-4 text-expense" />
              <span>Expense</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="user">For User:</Label>
        <Select value={userId} onValueChange={setUserId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date:</Label>
          <Input 
            type="date" 
            id="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            required 
          />
        </div>
        <div>
          <Label htmlFor="time">Time (Optional):</Label>
          <Input 
            type="time" 
            id="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="amount">Amount (₹):</Label>
        <Input 
          type="number" 
          id="amount"
          min="0.01"
          step="0.01"
          placeholder="e.g., 1500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description:</Label>
        <Input 
          type="text" 
          id="description"
          placeholder="e.g., Monthly Salary or Groceries"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="image">Attach Image (Optional):</Label>
        <Input 
          type="file" 
          id="image"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button type="submit" className="w-full">
        <PlusCircle className="w-4 h-4 mr-2" />
        Add Transaction
      </Button>
    </form>
  );
}
