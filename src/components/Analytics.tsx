import { User, Transaction } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { USER_COLORS } from '@/types/expense';

interface AnalyticsProps {
  users: User[];
  transactions: Transaction[];
}

export function Analytics({ users, transactions }: AnalyticsProps) {
  // Balance distribution data
  const balanceData = users.map((user, index) => ({
    name: user.name,
    balance: user.balance,
    color: USER_COLORS[index % USER_COLORS.length],
  }));

  // Income vs Expense by user
  const userIncomeExpenseData = users.map((user, index) => {
    const userTransactions = transactions.filter(t => t.userId === user.id);
    const income = userTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = userTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: user.name,
      income,
      expense,
      color: USER_COLORS[index % USER_COLORS.length],
    };
  });

  // Monthly trend
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = { month: monthYear, income: 0, expense: 0 };
    }
    
    if (t.type === 'income') {
      acc[monthYear].income += t.amount;
    } else {
      acc[monthYear].expense += t.amount;
    }
    
    return acc;
  }, {} as Record<string, { month: string; income: number; expense: number }>);

  const monthlyTrendData = Object.values(monthlyData).slice(-6); // Last 6 months

  // Total stats
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (value: number) => 
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Balance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={balanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="balance"
                >
                  {balanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income vs Expense by User */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense by User</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userIncomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Income & Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
