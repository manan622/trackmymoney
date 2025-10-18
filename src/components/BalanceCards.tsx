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
            className="shadow-card hover:shadow-hover transition-all duration-200"
            style={{ borderTopWidth: '4px', borderTopColor: USER_COLORS[colorIndex] }}
          >
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">{user.name}'s Balance</h3>
              <p className={`text-3xl font-bold ${user.balance >= 0 ? 'text-foreground' : 'text-expense'}`}>
                {formatCurrency(user.balance)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
