import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Navigation</h4>
            {KEYBOARD_SHORTCUTS.filter((s) => s.action.includes('Dashboard') || s.action.includes('Network') || s.action.includes('Matrix') || s.action.includes('Chart')).map((shortcut, i) => (
              <ShortcutRow key={i} keys={shortcut.keys} action={shortcut.action} />
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">UI</h4>
            {KEYBOARD_SHORTCUTS.filter((s) => s.action.includes('Toggle') || s.action.includes('Close') || s.action.includes('Anonymous')).map((shortcut, i) => (
              <ShortcutRow key={i} keys={shortcut.keys} action={shortcut.action} />
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>On Windows/Linux, use Ctrl instead of ⌘</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{action}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className={cn(
              'inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 text-xs font-medium',
              key.length === 1 && 'w-6'
            )}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
