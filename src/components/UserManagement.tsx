import { useState } from 'react';
import { User } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, User as UserIcon, Trash2, Download, Upload } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (name: string) => void;
  onDeleteUser: (id: number) => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
}

export function UserManagement({ 
  users, 
  onAddUser, 
  onDeleteUser, 
  onExportCSV, 
  onImportCSV 
}: UserManagementProps) {
  const [userName, setUserName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onAddUser(userName.trim());
      setUserName('');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-grow">
          <Label htmlFor="userName">New User Name:</Label>
          <Input
            type="text"
            id="userName"
            placeholder="e.g., Alice"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
        <Button type="submit">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </form>

      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
            <span className="font-medium flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {user.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteUser(user.id)}
              title={`Remove ${user.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={onExportCSV} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
          <label className="w-full">
            <Button variant="secondary" className="w-full cursor-pointer" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import from CSV
              </span>
            </Button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportCSV(file);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
