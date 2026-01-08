import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  action?: { label: string; view: string };
}

export function NotificationBanner() {
  const {
    currentProjectId,
    projectStakeholders,
    commPlans,
    getOverdueStakeholders,
    getBlockers,
    getRACICoverageGaps,
    setCurrentView,
  } = useStore();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!currentProjectId) {
      setNotifications([]);
      return;
    }

    const newNotifications: Notification[] = [];

    // Check for overdue stakeholders
    const overdue = getOverdueStakeholders();
    if (overdue.length > 0) {
      newNotifications.push({
        id: 'overdue-contacts',
        type: 'warning',
        message: `${overdue.length} stakeholder${overdue.length > 1 ? 's' : ''} overdue for contact`,
        action: { label: 'View Dashboard', view: 'dashboard' },
      });
    }

    // Check for blockers
    const blockers = getBlockers();
    if (blockers.length > 0) {
      newNotifications.push({
        id: 'blockers',
        type: 'warning',
        message: `${blockers.length} high-influence blocker${blockers.length > 1 ? 's' : ''} identified`,
        action: { label: 'View Influence Matrix', view: 'influence' },
      });
    }

    // Check for RACI gaps
    const gaps = getRACICoverageGaps();
    if (gaps.length > 0) {
      newNotifications.push({
        id: 'raci-gaps',
        type: 'info',
        message: `${gaps.length} workstream${gaps.length > 1 ? 's' : ''} missing R or A roles`,
        action: { label: 'View RACI', view: 'raci' },
      });
    }

    // Check for stakeholders without comm plans
    const withoutPlan = projectStakeholders.filter(
      (ps) => !commPlans.some((c) => c.projectStakeholderId === ps.projectStakeholderId)
    );
    const highInfluenceWithoutPlan = withoutPlan.filter((ps) => ps.influenceLevel === 'high');
    if (highInfluenceWithoutPlan.length > 0) {
      newNotifications.push({
        id: 'no-comm-plan',
        type: 'info',
        message: `${highInfluenceWithoutPlan.length} high-influence stakeholder${highInfluenceWithoutPlan.length > 1 ? 's have' : ' has'} no communication plan`,
        action: { label: 'View RACI', view: 'raci' },
      });
    }

    setNotifications(newNotifications);
  }, [currentProjectId, projectStakeholders, commPlans, getOverdueStakeholders, getBlockers, getRACICoverageGaps]);

  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleAction = (view: string) => {
    setCurrentView(view as any);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
    }
  };

  return (
    <div className="px-6 py-2 space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-lg border',
            getColors(notification.type)
          )}
        >
          {getIcon(notification.type)}
          <span className="text-sm flex-1">{notification.message}</span>
          {notification.action && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleAction(notification.action!.view)}
            >
              {notification.action.label}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleDismiss(notification.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
