import { Transaction, User } from '@/types/expense';

export function exportToCSV(transactions: Transaction[], users: User[]) {
  if (transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  const headers = ['Date', 'Account', 'Category', 'Note', 'INR', 'Income/Expense'];
  const rows = transactions.map(t => {
    const user = users.find(u => u.id === t.userId);
    const description = `"${(t.description || '').replace(/"/g, '""')}"`;
    const userName = `"${(user ? user.name : 'N/A').replace(/"/g, '""')}"`;
    
    const d = new Date(`${t.date}T${t.time || '00:00:00'}`);
    const dateString = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeString = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDateTime = `"${dateString} ${timeString}"`;
    
    const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);

    return [formattedDateTime, userName, '"Other"', description, t.amount, `"${type}"`].join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `expense_data_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
