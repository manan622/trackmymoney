import { Transaction, User } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2 } from 'lucide-react';

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

  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No transactions yet.</p>;
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
    return dateB.getTime() - dateA.getTime();
  });

  const grouped = sortedTransactions.reduce((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className={`space-y-3 ${transactions.length > 4 ? 'max-h-[280px] overflow-y-auto pr-2' : ''}`}>
      {Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
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
      ))}
    </div>
  );
}
