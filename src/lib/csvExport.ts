import { Transaction, User } from '@/types/expense';

export function exportToCSV(transactions: Transaction[], users: User[], userId?: number) {
  // Filter transactions by user if userId is provided
  const filteredTransactions = userId 
    ? transactions.filter(t => t.userId === userId)
    : transactions;

  if (filteredTransactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  // Match Money Manager CSV format exactly
  const headers = ['Date', 'Account', 'Category', 'Subcategory', 'Note', 'INR', 'Income/Expense', 'Description', 'Amount', 'Currency', 'Account'];
  const rows = filteredTransactions.map(t => {
    const user = users.find(u => u.id === t.userId);
    const userName = user ? user.name : 'N/A';
    const description = (t.description || '').replace(/"/g, '""');
    
    const d = new Date(`${t.date}T${t.time || '00:00:00'}`);
    const dateString = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeString = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDateTime = `${dateString} ${timeString}`;
    
    const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
    const amount = t.amount;

    return [
      formattedDateTime,
      userName,
      'Other',
      '',
      description,
      amount,
      type,
      description,
      amount,
      'INR',
      userName
    ].join(',');
  });

  const userSuffix = userId ? `_${users.find(u => u.id === userId)?.name.replace(/\s+/g, '_')}` : '';
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `expense_data${userSuffix}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
