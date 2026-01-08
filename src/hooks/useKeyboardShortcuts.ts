import { useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import type { ViewType } from '@/types';

export function useKeyboardShortcuts() {
  const {
    setCurrentView,
    toggleChat,
    toggleSidebar,
    toggleAnonymousMode,
    currentView,
  } = useStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;

      // View switching: Cmd/Ctrl + 1-5
      if (isMod && event.key >= '1' && event.key <= '5') {
        event.preventDefault();
        const views: ViewType[] = ['dashboard', 'network', 'influence', 'orgchart', 'raci'];
        const index = parseInt(event.key) - 1;
        if (views[index]) {
          setCurrentView(views[index]);
        }
        return;
      }

      // Toggle AI Chat: Cmd/Ctrl + /
      if (isMod && event.key === '/') {
        event.preventDefault();
        toggleChat();
        return;
      }

      // Toggle sidebar: Cmd/Ctrl + B
      if (isMod && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // Toggle anonymous mode: Cmd/Ctrl + Shift + A
      if (isMod && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        toggleAnonymousMode();
        return;
      }

      // Escape to close chat
      if (event.key === 'Escape') {
        const { chatOpen } = useStore.getState();
        if (chatOpen) {
          toggleChat();
        }
        return;
      }
    },
    [setCurrentView, toggleChat, toggleSidebar, toggleAnonymousMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Keyboard shortcut reference
export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', '1'], action: 'Dashboard' },
  { keys: ['⌘', '2'], action: 'Network Graph' },
  { keys: ['⌘', '3'], action: 'Influence Matrix' },
  { keys: ['⌘', '4'], action: 'Org Chart' },
  { keys: ['⌘', '5'], action: 'RACI Matrix' },
  { keys: ['⌘', '/'], action: 'Toggle AI Chat' },
  { keys: ['⌘', 'B'], action: 'Toggle Sidebar' },
  { keys: ['⌘', '⇧', 'A'], action: 'Anonymous Mode' },
  { keys: ['Esc'], action: 'Close Chat' },
];
