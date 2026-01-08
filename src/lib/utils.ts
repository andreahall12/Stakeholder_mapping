import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Anonymize a name for presentation mode
const anonymousCache = new Map<string, string>();
let anonymousCounter = 1;

export function anonymizeName(name: string, title?: string): string {
  if (anonymousCache.has(name)) {
    return anonymousCache.get(name)!;
  }
  const anonymized = title 
    ? `${title} (Stakeholder #${anonymousCounter})`
    : `Stakeholder #${anonymousCounter}`;
  anonymousCache.set(name, anonymized);
  anonymousCounter++;
  return anonymized;
}

export function resetAnonymousCache() {
  anonymousCache.clear();
  anonymousCounter = 1;
}

export function getDisplayName(name: string, anonymousMode: boolean, title?: string): string {
  if (!anonymousMode) return name;
  return anonymizeName(name, title);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRACILabel(role: string): string {
  const labels: Record<string, string> = {
    R: 'Responsible',
    A: 'Accountable',
    C: 'Consulted',
    I: 'Informed',
  };
  return labels[role] || role;
}

export function getRACIColor(role: string): string {
  const colors: Record<string, string> = {
    R: 'bg-responsible text-white',
    A: 'bg-accountable text-white',
    C: 'bg-consulted text-white',
    I: 'bg-informed text-white',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
}

export function getInfluencePosition(
  influenceLevel: string,
  supportLevel: string
): { x: number; y: number } {
  const xMap: Record<string, number> = {
    champion: 0.85,
    supporter: 0.7,
    neutral: 0.5,
    resistant: 0.2,
  };
  const yMap: Record<string, number> = {
    high: 0.85,
    medium: 0.5,
    low: 0.15,
  };
  return {
    x: xMap[supportLevel] || 0.5,
    y: yMap[influenceLevel] || 0.5,
  };
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

