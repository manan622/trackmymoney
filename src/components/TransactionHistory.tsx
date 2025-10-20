import { useState, useMemo } from 'react';
import { Transaction, User } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, Search, Maximize2, Minimize2 } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  users: User[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  onImageClick: (url: string) => void;
  onTransactionClick: (transaction: Transaction) => void;
}

export function TransactionHistory({ 
  transactions, 
  users, 
  onEdit, 
  onDelete, 
  onImageClick,
  onTransactionClick 
}: TransactionHistoryProps) {
  const [filterType, setFilterType] = useState<'month' | 'week' | 'year' | 'total'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatCurrency = (amount: number) => 
    `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const formattedHour = ((h + 11) % 12 + 1);
    return `${formattedHour}:${minute} ${suffix}`;
  };

  // Generate months for filter
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Generate years
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Apply time-based filter
    if (filterType !== 'total') {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const year = parseInt(selectedYear);
        
        if (filterType === 'year') {
          return transactionDate.getFullYear() === year;
        } else if (filterType === 'month') {
          return transactionDate.getFullYear() === year && 
                 transactionDate.getMonth() === parseInt(selectedMonth);
        } else if (filterType === 'week') {
          // Simple week calculation
          const weekNum = Math.ceil(transactionDate.getDate() / 7);
          return transactionDate.getFullYear() === year && 
                 transactionDate.getMonth() === parseInt(selectedMonth) &&
                 weekNum === parseInt(selectedWeek);
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const user = users.find(u => u.id === t.userId);
        return t.description.toLowerCase().includes(query) || 
               (user?.name || '').toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [transactions, filterType, selectedMonth, selectedYear, selectedWeek, searchQuery, users]);

  // Calculate summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No transactions yet.</p>;
  }

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
    return dateB.getTime() - dateA.getTime();
  });

  const grouped = sortedTransactions.reduce((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background p-4 overflow-y-auto' : ''}>
      {/* Header with fullscreen toggle */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transaction History</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter type toggle */}
          <div className="flex gap-1 bg-background rounded-md p-1">
            {(['month', 'week', 'year', 'total'] as const).map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType(type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Date selectors */}
          {filterType !== 'total' && (
            <div className="flex items-center gap-2">
              {(filterType === 'month' || filterType === 'week') && (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, i) => (
                      <SelectItem key={i} value={i.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {filterType === 'week' && (
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(w => (
                      <SelectItem key={w} value={w.toString()}>Week {w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search description or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="text-center pt-3 border-t text-sm space-y-1">
          <div className="flex justify-center gap-6">
            <span className="text-income font-semibold">
              Income: {formatCurrency(summary.income)}
            </span>
            <span className="text-expense font-semibold">
              Expense: {formatCurrency(summary.expense)}
            </span>
            <span className={`font-bold ${summary.net >= 0 ? 'text-income' : 'text-expense'}`}>
              Net: {formatCurrency(summary.net)}
            </span>
          </div>
          <p className="text-muted-foreground">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      <ScrollArea className={isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-[320px]'}>
        <div className="space-y-3 pr-4">
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions match your filters.</p>
          ) : (
            Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
              <div key={date}>
                <div className="text-sm font-semibold text-muted-foreground uppercase pt-3 pb-1 sticky top-0 bg-background">
                  {formatDate(date)}
                </div>
                {grouped[date].map(t => {
                  const user = users.find(u => u.id === t.userId);
                  const isIncome = t.type === 'income';
                  
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg flex items-center gap-3 bg-card shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                        isIncome ? 'border-l-4 border-income' : 'border-l-4 border-expense'
                      }`}
                      onClick={() => onTransactionClick(t)}
                    >
                      {isIncome ? (
                        <ArrowUpCircle className="w-6 h-6 text-income flex-shrink-0" />
                      ) : (
                        <ArrowDownCircle className="w-6 h-6 text-expense flex-shrink-0" />
                      )}
                      
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          For {user ? user.name : 'N/A'}
                          {t.time && <span className="ml-1">at {formatTime(t.time)}</span>}
                        </p>
                      </div>

                      {t.imageUrl && (
                        <img
                          src={t.imageUrl}
                          alt="Attachment"
                          className="w-10 h-10 object-cover rounded-md cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageClick(t.imageUrl!);
                          }}
                        />
                      )}

                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`font-bold text-base ${isIncome ? 'text-income' : 'text-expense'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(t);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(t.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
