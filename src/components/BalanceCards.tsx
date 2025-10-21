import { User, USER_COLORS } from '@/types/expense';
import { Card, CardContent } from '@/components/ui/card';

interface BalanceCardsProps {
  users: User[];
}

export function BalanceCards({ users }: BalanceCardsProps) {
  const formatCurrency = (amount: number) => 
    `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  if (users.length === 0) {
    return (
      <Card className="col-span-full shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Add a user in the 'Manage Users' section to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {users.map((user, index) => {
        const colorIndex = index % USER_COLORS.length;
        return (
          <Card 
            key={user.id} 
            className="shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 overflow-hidden group"
            style={{ borderTopColor: USER_COLORS[colorIndex] }}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/5 to-transparent p-4 border-b">
                <h3 className="text-xl font-bold text-center">{user.name}</h3>
              </div>
              <div className="grid grid-cols-2 divide-x">
                <div className="p-4 text-center hover:bg-muted/30 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Net Balance</p>
                  <p className={`text-2xl font-bold ${user.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(user.balance)}
                  </p>
                </div>
                <div className="p-4 text-center hover:bg-muted/30 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-expense">
                    {formatCurrency(user.balance < 0 ? Math.abs(user.balance) : 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
