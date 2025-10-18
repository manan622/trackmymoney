import { useState, useEffect } from 'react';
import { User, Transaction } from '@/types/expense';
import { storage } from '@/lib/storage';
import { exportToCSV } from '@/lib/csvExport';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, X } from 'lucide-react';
import { BalanceCards } from '@/components/BalanceCards';
import { BalanceVisualization } from '@/components/BalanceVisualization';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { UserManagement } from '@/components/UserManagement';
import { toast } from 'sonner';

const Index = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextUserId, setNextUserId] = useState(1);
  const [nextTransactionId, setNextTransactionId] = useState(1);
  
  // Modal states
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
  const [deleteTransactionModal, setDeleteTransactionModal] = useState<{ open: boolean; transactionId: number | null }>({ open: false, transactionId: null });
  const [editTransactionModal, setEditTransactionModal] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null });
  const [imageViewerModal, setImageViewerModal] = useState<{ open: boolean; imageUrl: string }>({ open: false, imageUrl: '' });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null });

  // Load data on mount
  useEffect(() => {
    setUsers(storage.getUsers());
    setTransactions(storage.getTransactions());
    setNextUserId(storage.getNextUserId());
    setNextTransactionId(storage.getNextTransactionId());
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    storage.setUsers(users);
    storage.setTransactions(transactions);
    storage.setNextUserId(nextUserId);
    storage.setNextTransactionId(nextTransactionId);
  }, [users, transactions, nextUserId, nextTransactionId]);

  // Calculate balances
  const calculateBalances = () => {
    const updatedUsers = users.map(u => ({ ...u, balance: 0 }));
    let totalBalance = 0;

    transactions.forEach(t => {
      const user = updatedUsers.find(u => u.id === t.userId);
      if (t.type === 'income') {
        if (user) user.balance += t.amount;
        totalBalance += t.amount;
      } else {
        if (user) user.balance -= t.amount;
        totalBalance -= t.amount;
      }
    });

    setUsers(updatedUsers);
    return totalBalance;
  };

  const totalBalance = calculateBalances();

  const formatCurrency = (amount: number) => 
    `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  // User management
  const handleAddUser = (name: string) => {
    setUsers([...users, { id: nextUserId, name, balance: 0 }]);
    setNextUserId(nextUserId + 1);
    toast.success(`User "${name}" added successfully`);
  };

  const handleDeleteUser = (id: number) => {
    setDeleteUserModal({ open: true, userId: id });
  };

  const confirmDeleteUser = () => {
    if (deleteUserModal.userId) {
      const user = users.find(u => u.id === deleteUserModal.userId);
      setUsers(users.filter(u => u.id !== deleteUserModal.userId));
      setTransactions(transactions.filter(t => t.userId !== deleteUserModal.userId));
      toast.success(`User "${user?.name}" deleted`);
    }
    setDeleteUserModal({ open: false, userId: null });
  };

  // Transaction management
  const handleAddTransaction = async (data: {
    type: 'income' | 'expense';
    userId: number;
    amount: number;
    description: string;
    date: string;
    time: string | null;
    imageFile: File | null;
  }) => {
    let imageUrl: string | null = null;

    if (data.imageFile) {
      const reader = new FileReader();
      imageUrl = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(data.imageFile!);
      });
    }

    const newTransaction: Transaction = {
      id: nextTransactionId,
      type: data.type,
      userId: data.userId,
      amount: data.amount,
      description: data.description,
      date: data.date,
      time: data.time,
      imageUrl,
    };

    setTransactions([...transactions, newTransaction]);
    setNextTransactionId(nextTransactionId + 1);
    toast.success('Transaction added successfully');
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransactionModal({ open: true, transaction });
  };

  const handleDeleteTransaction = (id: number) => {
    setDeleteTransactionModal({ open: true, transactionId: id });
  };

  const confirmDeleteTransaction = () => {
    if (deleteTransactionModal.transactionId) {
      setTransactions(transactions.filter(t => t.id !== deleteTransactionModal.transactionId));
      toast.success('Transaction deleted');
    }
    setDeleteTransactionModal({ open: false, transactionId: null });
  };

  const saveEditedTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editTransactionModal.transaction) {
      const formData = new FormData(e.currentTarget);
      const updatedTransaction: Transaction = {
        ...editTransactionModal.transaction,
        userId: parseInt(formData.get('userId') as string),
        date: formData.get('date') as string,
        time: (formData.get('time') as string) || null,
        amount: parseFloat(formData.get('amount') as string),
        description: formData.get('description') as string,
      };

      setTransactions(transactions.map(t => 
        t.id === updatedTransaction.id ? updatedTransaction : t
      ));
      setEditTransactionModal({ open: false, transaction: null });
      toast.success('Transaction updated');
    }
  };

  // CSV operations
  const handleExportCSV = () => {
    exportToCSV(transactions, users);
    toast.success('Data exported successfully');
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const isMoneyManagerFormat = headers.includes('Income/Expense');
        let importedCount = 0;

        if (isMoneyManagerFormat) {
          const dateIndex = headers.indexOf('Date');
          const accountIndex = headers.indexOf('Account');
          const noteIndex = headers.indexOf('Note');
          const amountIndex = headers.indexOf('INR');
          const typeIndex = headers.indexOf('Income/Expense');

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',');
            const dateTimeString = cols[dateIndex].replace(/"/g, '');
            const [datePart, timePart] = dateTimeString.split(' ');
            const [month, day, year] = datePart.split('/');
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            
            const accountName = cols[accountIndex].replace(/"/g, '');
            let user = users.find(u => u.name.toLowerCase() === accountName.toLowerCase());
            if (!user) {
              user = { id: nextUserId, name: accountName, balance: 0 };
              setUsers(prev => [...prev, user!]);
              setNextUserId(prev => prev + 1);
            }

            const newTransaction: Transaction = {
              id: nextTransactionId + importedCount,
              type: cols[typeIndex].replace(/"/g, '').toLowerCase() as 'income' | 'expense',
              userId: user.id,
              amount: parseFloat(cols[amountIndex]),
              description: cols[noteIndex].replace(/"/g, ''),
              date: formattedDate,
              time: timePart || null,
              imageUrl: null,
            };

            setTransactions(prev => [...prev, newTransaction]);
            importedCount++;
          }
          
          setNextTransactionId(prev => prev + importedCount);
          toast.success(`${importedCount} transactions imported successfully`);
        } else {
          toast.error('Unknown CSV format');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import CSV file');
      }
    };
    reader.readAsText(file);
  };

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

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-gradient tracking-tight mb-2">
          Shared Expense Manager
        </h1>
        <p className="text-muted-foreground text-lg">A clear view of your shared finances.</p>
      </header>

      <main className="space-y-8">
        {/* Total Balance Section */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center p-8 rounded-lg bg-primary/5 border-2 border-primary/20">
                <h2 className="text-lg font-semibold text-primary uppercase tracking-wider mb-2">
                  Total Account Balance
                </h2>
                <p className="text-5xl font-bold text-primary">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-center">Balance Distribution</h3>
                <BalanceVisualization users={users} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BalanceCards users={users} />
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="history" className="flex-shrink-0">Transaction History</TabsTrigger>
            <TabsTrigger value="add" className="flex-shrink-0">Add Transaction</TabsTrigger>
            <TabsTrigger value="manage" className="flex-shrink-0">Manage Users & Data</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <TransactionHistory
                  transactions={transactions}
                  users={users}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onImageClick={(url) => setImageViewerModal({ open: true, imageUrl: url })}
                  onTransactionClick={(t) => setDetailsModal({ open: true, transaction: t })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <TransactionForm users={users} onSubmit={handleAddTransaction} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <UserManagement
                  users={users}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  onExportCSV={handleExportCSV}
                  onImportCSV={handleImportCSV}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete User Modal */}
      <Dialog open={deleteUserModal.open} onOpenChange={(open) => setDeleteUserModal({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete User?
            </DialogTitle>
            <DialogDescription>
              Do you really want to delete this user? All of their transactions will be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteUserModal({ open: false, userId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Modal */}
      <Dialog open={deleteTransactionModal.open} onOpenChange={(open) => setDeleteTransactionModal({ open, transactionId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Delete Transaction?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTransactionModal({ open: false, transactionId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTransaction}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <Dialog open={editTransactionModal.open} onOpenChange={(open) => setEditTransactionModal({ open, transaction: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTransactionModal.transaction && (
            <form onSubmit={saveEditedTransaction} className="space-y-4">
              <div>
                <Label htmlFor="edit-user">For User:</Label>
                <Select name="userId" defaultValue={editTransactionModal.transaction.userId.toString()} required>
                  <SelectTrigger>
                    <SelectValue />
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
                  <Label htmlFor="edit-date">Date:</Label>
                  <Input type="date" name="date" defaultValue={editTransactionModal.transaction.date} required />
                </div>
                <div>
                  <Label htmlFor="edit-time">Time:</Label>
                  <Input type="time" name="time" defaultValue={editTransactionModal.transaction.time || ''} />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-amount">Amount (₹):</Label>
                <Input type="number" name="amount" min="0.01" step="0.01" defaultValue={editTransactionModal.transaction.amount} required />
              </div>

              <div>
                <Label htmlFor="edit-description">Description:</Label>
                <Input type="text" name="description" defaultValue={editTransactionModal.transaction.description} required />
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditTransactionModal({ open: false, transaction: null })}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={imageViewerModal.open} onOpenChange={(open) => setImageViewerModal({ open, imageUrl: '' })}>
        <DialogContent className="max-w-3xl p-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 -right-2 h-10 w-10 rounded-full bg-background shadow-lg"
            onClick={() => setImageViewerModal({ open: false, imageUrl: '' })}
          >
            <X className="h-5 w-5" />
          </Button>
          <img src={imageViewerModal.imageUrl} alt="Transaction" className="w-full h-auto rounded-lg" />
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal({ open, transaction: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {detailsModal.transaction && (
            <div className="space-y-4">
              <div className={`text-3xl font-bold text-center py-4 rounded-lg ${
                detailsModal.transaction.type === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
              }`}>
                {detailsModal.transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(detailsModal.transaction.amount)}
              </div>

              <div>
                <p className="text-sm text-muted-foreground font-medium">Description</p>
                <p className="text-lg">{detailsModal.transaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">For User</p>
                  <p>{users.find(u => u.id === detailsModal.transaction?.userId)?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Date & Time</p>
                  <p>
                    {formatDate(detailsModal.transaction.date)}
                    {detailsModal.transaction.time && ` at ${formatTime(detailsModal.transaction.time)}`}
                  </p>
                </div>
              </div>

              {detailsModal.transaction.imageUrl && (
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-2">Attached Image</p>
                  <img 
                    src={detailsModal.transaction.imageUrl} 
                    alt="Transaction" 
                    className="w-full rounded-lg cursor-pointer"
                    onClick={() => {
                      setImageViewerModal({ open: true, imageUrl: detailsModal.transaction!.imageUrl! });
                      setDetailsModal({ open: false, transaction: null });
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
