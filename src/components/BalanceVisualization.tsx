import { User, USER_COLORS } from '@/types/expense';

interface BalanceVisualizationProps {
  users: User[];
}

export function BalanceVisualization({ users }: BalanceVisualizationProps) {
  const totalPositiveBalance = users.reduce((sum, user) => 
    user.balance > 0 ? sum + user.balance : sum, 0
  );

  if (totalPositiveBalance === 0) {
    return (
      <p className="text-center text-muted-foreground">No positive balances to visualize.</p>
    );
  }

  const usersWithPositiveBalance = users.filter(u => u.balance > 0);

  return (
    <div className="space-y-4">
      <div className="w-full bg-muted rounded-full h-6 flex overflow-hidden">
        {usersWithPositiveBalance.map((user) => {
          const percentage = (user.balance / totalPositiveBalance) * 100;
          const colorIndex = users.findIndex(u => u.id === user.id) % USER_COLORS.length;
          
          return (
            <div
              key={user.id}
              className="h-6 transition-all duration-300"
              style={{ 
                width: `${percentage}%`, 
                backgroundColor: USER_COLORS[colorIndex]
              }}
              title={`${user.name}: ₹${user.balance.toFixed(2)}`}
            />
          );
        })}
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {usersWithPositiveBalance.map((user) => {
          const percentage = (user.balance / totalPositiveBalance) * 100;
          const colorIndex = users.findIndex(u => u.id === user.id) % USER_COLORS.length;
          
          return (
            <div key={user.id} className="flex items-center text-sm">
              <span 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: USER_COLORS[colorIndex] }}
              />
              <span className="text-muted-foreground">
                {user.name} ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
