import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Transaction } from '@/types/expense';
import { exportToCSV } from '@/lib/csvExport';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, X, LogOut } from 'lucide-react';
import { BalanceCards } from '@/components/BalanceCards';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionHistory } from '@/components/TransactionHistory';
import { UserManagement } from '@/components/UserManagement';
import { Analytics } from '@/components/Analytics';
import { toast } from 'sonner';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenBalances, setHiddenBalances] = useState<Set<number>>(new Set());
  
  // Modal states
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
  const [deleteTransactionModal, setDeleteTransactionModal] = useState<{ open: boolean; transactionId: number | null }>({ open: false, transactionId: null });
  const [editTransactionModal, setEditTransactionModal] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null });
  const [imageViewerModal, setImageViewerModal] = useState<{ open: boolean; imageUrl: string }>({ open: false, imageUrl: '' });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; transaction: Transaction | null }>({ open: false, transaction: null });

  // Map database IDs to sequential numbers for UI
  const [idMap, setIdMap] = useState<Map<string, number>>(new Map());
  const [nextId, setNextId] = useState(1);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load data from Supabase
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getNumericId = (uuid: string, currentIdMap: Map<string, number>, currentNextId: number): [number, Map<string, number>, number] => {
    if (currentIdMap.has(uuid)) {
      return [currentIdMap.get(uuid)!, currentIdMap, currentNextId];
    }
    const newMap = new Map(currentIdMap);
    newMap.set(uuid, currentNextId);
    return [currentNextId, newMap, currentNextId + 1];
  };

  const loadData = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('expense_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      let currentIdMap = new Map<string, number>();
      let currentNextId = 1;

      // Map users
      const mappedUsers: User[] = (usersData || []).map(u => {
        const [numId, newMap, newNextId] = getNumericId(u.id, currentIdMap, currentNextId);
        currentIdMap = newMap;
        currentNextId = newNextId;

        let balance = 0;
        (transactionsData || []).forEach(t => {
          if (t.expense_user_id === u.id) {
            balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
          }
        });

        return { id: numId, name: u.name, balance };
      });

      // Map transactions
      const mappedTransactions: Transaction[] = (transactionsData || []).map(t => {
        const [numId, newMap, newNextId] = getNumericId(t.id, currentIdMap, currentNextId);
        currentIdMap = newMap;
        currentNextId = newNextId;

        const userNumId = currentIdMap.get(t.expense_user_id) || 0;

        return {
          id: numId,
          type: t.type as 'income' | 'expense',
          userId: userNumId,
          amount: Number(t.amount),
          description: t.description,
          date: t.date,
          time: t.time,
          imageUrl: t.image_url,
        };
      });

      setIdMap(currentIdMap);
      setNextId(currentNextId);
      setUsers(mappedUsers);
      setTransactions(mappedTransactions);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getUuidFromNumericId = (numId: number): string | undefined => {
    for (const [uuid, num] of idMap.entries()) {
      if (num === numId) return uuid;
    }
    return undefined;
  };

  const formatCurrency = (amount: number) => 
    `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;

  const handleAddUser = async (name: string) => {
    try {
      const { error } = await supabase
        .from('expense_users')
        .insert({ name, user_id: user!.id });

      if (error) throw error;
      toast.success(`User "${name}" added successfully`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = (id: number) => {
    setDeleteUserModal({ open: true, userId: id });
  };

  const confirmDeleteUser = async () => {
    if (deleteUserModal.userId) {
      const uuid = getUuidFromNumericId(deleteUserModal.userId);
      if (!uuid) return;

      try {
        const { error } = await supabase
          .from('expense_users')
          .delete()
          .eq('id', uuid);

        if (error) throw error;
        toast.success('User deleted');
        await loadData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete user');
      }
    }
    setDeleteUserModal({ open: false, userId: null });
  };

  const handleAddTransaction = async (data: {
    type: 'income' | 'expense';
    userId: number;
    amount: number;
    description: string;
    date: string;
    time: string | null;
    imageFile: File | null;
  }) => {
    const userUuid = getUuidFromNumericId(data.userId);
    if (!userUuid) {
      toast.error('User not found');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          expense_user_id: userUuid,
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date,
          time: data.time,
          image_url: null,
        });

      if (error) throw error;
      toast.success('Transaction added successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add transaction');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransactionModal({ open: true, transaction });
  };

  const handleDeleteTransaction = (id: number) => {
    setDeleteTransactionModal({ open: true, transactionId: id });
  };

  const confirmDeleteTransaction = async () => {
    if (deleteTransactionModal.transactionId) {
      const uuid = getUuidFromNumericId(deleteTransactionModal.transactionId);
      if (!uuid) return;

      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', uuid);

        if (error) throw error;
        toast.success('Transaction deleted');
        await loadData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete transaction');
      }
    }
    setDeleteTransactionModal({ open: false, transactionId: null });
  };

  const saveEditedTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editTransactionModal.transaction) {
      const uuid = getUuidFromNumericId(editTransactionModal.transaction.id);
      if (!uuid) return;

      const formData = new FormData(e.currentTarget);
      const userNumId = parseInt(formData.get('userId') as string);
      const userUuid = getUuidFromNumericId(userNumId);
      if (!userUuid) return;

      try {
        const { error } = await supabase
          .from('transactions')
          .update({
            expense_user_id: userUuid,
            date: formData.get('date') as string,
            time: (formData.get('time') as string) || null,
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description') as string,
          })
          .eq('id', uuid);

        if (error) throw error;
        toast.success('Transaction updated');
        setEditTransactionModal({ open: false, transaction: null });
        await loadData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to update transaction');
      }
    }
  };

  const handleExportCSV = () => {
    exportToCSV(transactions, users);
    toast.success('Data exported successfully');
  };

  const handleImportCSV = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const isMoneyManagerFormat = headers.includes('Income/Expense');
        if (!isMoneyManagerFormat) {
          toast.error('Unknown CSV format');
          return;
        }

        let importedCount = 0;
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
          
          // Find or create user
          let existingUser = users.find(u => u.name.toLowerCase() === accountName.toLowerCase());
          let userUuid: string;

          if (!existingUser) {
            // Check if user exists in DB
            const { data: dbUsers } = await supabase
              .from('expense_users')
              .select('*')
              .eq('user_id', user!.id)
              .ilike('name', accountName);

            if (dbUsers && dbUsers.length > 0) {
              userUuid = dbUsers[0].id;
            } else {
              // Create new user
              const { data: newUser, error: userError } = await supabase
                .from('expense_users')
                .insert({ name: accountName, user_id: user!.id })
                .select()
                .single();

              if (userError) throw userError;
              userUuid = newUser.id;
            }
          } else {
            userUuid = getUuidFromNumericId(existingUser.id)!;
          }

          // Create transaction
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: user!.id,
              expense_user_id: userUuid,
              type: cols[typeIndex].replace(/"/g, '').toLowerCase(),
              amount: parseFloat(cols[amountIndex]),
              description: cols[noteIndex].replace(/"/g, ''),
              date: formattedDate,
              time: timePart || null,
              image_url: null,
            });

          if (txError) throw txError;
          importedCount++;
        }

        toast.success(`${importedCount} transactions imported successfully`);
        await loadData();
      } catch (error: any) {
        console.error('Import error:', error);
        toast.error('Failed to import CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleEditUser = async (id: number, newName: string) => {
    const uuid = getUuidFromNumericId(id);
    if (!uuid) return;

    try {
      const { error } = await supabase
        .from('expense_users')
        .update({ name: newName })
        .eq('id', uuid);

      if (error) throw error;
      toast.success('User name updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
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

  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="text-center mb-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1" />
          <h1 className="flex-1 text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent tracking-tight">
            Track My Money
          </h1>
          <div className="flex-1 flex justify-end">
            <Button variant="outline" onClick={signOut} className="shadow-sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-lg font-medium">Your personal finance companion</p>
      </header>

      <main className="space-y-8">
        <Card className="shadow-lg border-2 border-primary/10">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-primary/70 uppercase tracking-wider mb-3">
                Total Account Balance
              </h2>
              <p className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <BalanceCards 
            users={users} 
            transactions={transactions}
            hiddenBalances={hiddenBalances}
            onToggleHidden={(userId) => {
              setHiddenBalances(prev => {
                const newSet = new Set(prev);
                if (newSet.has(userId)) {
                  newSet.delete(userId);
                } else {
                  newSet.add(userId);
                }
                return newSet;
              });
            }}
          />
        </div>

        <Tabs defaultValue="history" className="w-full">
          <div className="mb-4 overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="history">Transaction History</TabsTrigger>
              <TabsTrigger value="add">Add Transaction</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="manage">Manage Users & Data</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="history" className="mt-6">
            <Card className="shadow-lg">
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
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <TransactionForm users={users} onSubmit={handleAddTransaction} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <Analytics users={users} transactions={transactions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <UserManagement
                  users={users}
                  onAddUser={handleAddUser}
                  onDeleteUser={handleDeleteUser}
                  onEditUser={handleEditUser}
                  onExportCSV={handleExportCSV}
                  onImportCSV={handleImportCSV}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete User Confirmation */}
      <Dialog open={deleteUserModal.open} onOpenChange={(open) => !open && setDeleteUserModal({ open: false, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? All associated transactions will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserModal({ open: false, userId: null })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation */}
      <Dialog open={deleteTransactionModal.open} onOpenChange={(open) => !open && setDeleteTransactionModal({ open: false, transactionId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTransactionModal({ open: false, transactionId: null })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteTransaction}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <Dialog open={editTransactionModal.open} onOpenChange={(open) => !open && setEditTransactionModal({ open: false, transaction: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTransactionModal.transaction && (
            <form onSubmit={saveEditedTransaction} className="space-y-4">
              <div>
                <Label>User</Label>
                <Select name="userId" defaultValue={String(editTransactionModal.transaction.userId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" defaultValue={editTransactionModal.transaction.date} />
              </div>
              <div>
                <Label>Time (optional)</Label>
                <Input type="time" name="time" defaultValue={editTransactionModal.transaction.time || ''} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" name="amount" defaultValue={editTransactionModal.transaction.amount} />
              </div>
              <div>
                <Label>Description</Label>
                <Input type="text" name="description" defaultValue={editTransactionModal.transaction.description} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTransactionModal({ open: false, transaction: null })}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={imageViewerModal.open} onOpenChange={(open) => !open && setImageViewerModal({ open: false, imageUrl: '' })}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Transaction Image</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img src={imageViewerModal.imageUrl} alt="Transaction" className="w-full h-auto rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={detailsModal.open} onOpenChange={(open) => !open && setDetailsModal({ open: false, transaction: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {detailsModal.transaction && (
            <div className="space-y-3">
              <div>
                <Label className="font-semibold">Type:</Label>
                <p className="capitalize">{detailsModal.transaction.type}</p>
              </div>
              <div>
                <Label className="font-semibold">User:</Label>
                <p>{users.find(u => u.id === detailsModal.transaction!.userId)?.name}</p>
              </div>
              <div>
                <Label className="font-semibold">Amount:</Label>
                <p>{formatCurrency(detailsModal.transaction.amount)}</p>
              </div>
              <div>
                <Label className="font-semibold">Description:</Label>
                <p>{detailsModal.transaction.description}</p>
              </div>
              <div>
                <Label className="font-semibold">Date:</Label>
                <p>{formatDate(detailsModal.transaction.date)}</p>
              </div>
              {detailsModal.transaction.time && (
                <div>
                  <Label className="font-semibold">Time:</Label>
                  <p>{formatTime(detailsModal.transaction.time)}</p>
                </div>
              )}
              {detailsModal.transaction.imageUrl && (
                <div>
                  <Label className="font-semibold">Attached Image:</Label>
                  <img 
                    src={detailsModal.transaction.imageUrl} 
                    alt="Transaction attachment" 
                    className="w-full h-auto rounded-lg mt-2 border cursor-pointer"
                    onClick={() => setImageViewerModal({ open: true, imageUrl: detailsModal.transaction!.imageUrl! })}
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
