import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModelType } from '@/types/model';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: ModelType | 'all') => void;
  onSortChange?: (sort: string) => void;
}

export const SearchBar = ({ onSearch, onFilterChange, onSortChange }: SearchBarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ModelType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filters: Array<{ value: ModelType | 'all'; label: string }> = [
    { value: 'all', label: t('browse.filters.all') },
    { value: 'checkpoint', label: t('browse.filters.checkpoint') },
    { value: 'lora', label: t('browse.filters.lora') },
    { value: 'textualInversion', label: t('browse.filters.textualInversion') },
    { value: 'controlnet', label: t('browse.filters.controlnet') },
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterClick = (filter: ModelType | 'all') => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('browse.search')}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 pr-12 h-12 bg-card border-border/40 focus:border-primary/40 transition-colors"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Badge
            key={filter.value}
            variant="outline"
            className={cn(
              'cursor-pointer px-4 py-2 transition-all duration-300',
              activeFilter === filter.value
                ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
                : 'bg-card border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
            )}
            onClick={() => handleFilterClick(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
