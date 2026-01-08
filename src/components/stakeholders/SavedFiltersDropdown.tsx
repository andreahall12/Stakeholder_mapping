import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store';
import { Filter, Plus, Trash2, Check } from 'lucide-react';
import type { SavedFilter } from '@/types';
import { generateId } from '@/lib/utils';

interface SavedFiltersDropdownProps {
  onApplyFilter: (filters: SavedFilter['filters']) => void;
  currentFilters: SavedFilter['filters'];
}

const STORAGE_KEY = 'stakeholder_saved_filters';

export function SavedFiltersDropdown({ onApplyFilter, currentFilters }: SavedFiltersDropdownProps) {
  const { tags } = useStore();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch {
        setSavedFilters([]);
      }
    }
  }, []);

  // Save to localStorage when filters change
  const saveToStorage = (filters: SavedFilter[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    setSavedFilters(filters);
  };

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;

    const newFilter: SavedFilter = {
      id: generateId(),
      name: newFilterName.trim(),
      filters: currentFilters,
    };

    saveToStorage([...savedFilters, newFilter]);
    setNewFilterName('');
    setSaveDialogOpen(false);
    setActiveFilterId(newFilter.id);
  };

  const handleDeleteFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveToStorage(savedFilters.filter((f) => f.id !== id));
    if (activeFilterId === id) {
      setActiveFilterId(null);
    }
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    setActiveFilterId(filter.id);
    onApplyFilter(filter.filters);
  };

  const handleClearFilter = () => {
    setActiveFilterId(null);
    onApplyFilter({});
  };

  const hasActiveFilters =
    currentFilters.influenceLevel ||
    currentFilters.supportLevel ||
    currentFilters.department ||
    currentFilters.tagId;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={hasActiveFilters ? 'default' : 'outline'}
            size="sm"
            className="gap-2 h-8"
          >
            <Filter className="h-3.5 w-3.5" />
            {activeFilterId
              ? savedFilters.find((f) => f.id === activeFilterId)?.name || 'Filter'
              : hasActiveFilters
              ? 'Filtered'
              : 'Filter'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {savedFilters.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Saved Filters
              </DropdownMenuLabel>
              {savedFilters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  onClick={() => handleApplyFilter(filter)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {activeFilterId === filter.id && <Check className="h-3 w-3" />}
                    {filter.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-50 hover:opacity-100"
                    onClick={(e) => handleDeleteFilter(filter.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {hasActiveFilters && (
            <>
              <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Save Current Filter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearFilter}>
                Clear Filter
              </DropdownMenuItem>
            </>
          )}

          {!hasActiveFilters && savedFilters.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No saved filters yet.
              <br />
              Apply filters and save them here.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>Give this filter a name to save it for quick access.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Filter Name</Label>
            <Input
              placeholder="e.g., Engineering Blockers"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Current filters:</p>
              <ul className="space-y-1">
                {currentFilters.influenceLevel && (
                  <li>• Influence: {currentFilters.influenceLevel}</li>
                )}
                {currentFilters.supportLevel && <li>• Support: {currentFilters.supportLevel}</li>}
                {currentFilters.department && <li>• Department: {currentFilters.department}</li>}
                {currentFilters.tagId && (
                  <li>• Tag: {tags.find((t) => t.id === currentFilters.tagId)?.name}</li>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter} disabled={!newFilterName.trim()}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Filter controls component
interface FilterControlsProps {
  filters: SavedFilter['filters'];
  onFiltersChange: (filters: SavedFilter['filters']) => void;
}

export function FilterControls({ filters, onFiltersChange }: FilterControlsProps) {
  const { tags, projectStakeholders } = useStore();

  // Get unique departments from stakeholders
  const departments = [...new Set(projectStakeholders.map((s) => s.department).filter(Boolean))];

  const handleChange = (key: keyof SavedFilter['filters'], value: string) => {
    if (value === '_all_') {
      const newFilters = { ...filters };
      delete newFilters[key];
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={filters.influenceLevel || '_all_'}
        onValueChange={(v) => handleChange('influenceLevel', v)}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="Influence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all_">All Influence</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.supportLevel || '_all_'}
        onValueChange={(v) => handleChange('supportLevel', v)}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="Support" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all_">All Support</SelectItem>
          <SelectItem value="champion">Champion</SelectItem>
          <SelectItem value="supporter">Supporter</SelectItem>
          <SelectItem value="neutral">Neutral</SelectItem>
          <SelectItem value="resistant">Resistant</SelectItem>
        </SelectContent>
      </Select>

      {departments.length > 0 && (
        <Select
          value={filters.department || '_all_'}
          onValueChange={(v) => handleChange('department', v)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">All Depts</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {tags.length > 0 && (
        <Select
          value={filters.tagId || '_all_'}
          onValueChange={(v) => handleChange('tagId', v)}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">All Tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
