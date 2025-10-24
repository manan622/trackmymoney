import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface BalanceSettingsProps {
  includeHiddenInTotal: boolean;
  onToggleIncludeHidden: (value: boolean) => void;
}

export function BalanceSettings({ includeHiddenInTotal, onToggleIncludeHidden }: BalanceSettingsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Balance Settings</SheetTitle>
          <SheetDescription>
            Configure how balances are calculated and displayed
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-hidden">Include Hidden Users in Total</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, hidden user balances will be included in the total balance calculation
              </p>
            </div>
            <Switch
              id="include-hidden"
              checked={includeHiddenInTotal}
              onCheckedChange={onToggleIncludeHidden}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
