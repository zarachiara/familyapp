import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X, CheckCircle, Circle, User, Calendar } from 'lucide-react';
import { FamilyMember } from '@/types';
import { cn } from '@/lib/utils';

export type TaskFilter = 
  | 'incomplete'
  | 'completed'
  | 'due-this-week'
  | 'due-next-week'
  | { type: 'member'; memberId: string };

interface TaskFiltersProps {
  members: FamilyMember[];
  activeFilters: TaskFilter[];
  onFiltersChange: (filters: TaskFilter[]) => void;
}

const TaskFilters = ({ members, activeFilters, onFiltersChange }: TaskFiltersProps) => {
  const [open, setOpen] = useState(false);

  const isFilterActive = (filter: TaskFilter): boolean => {
    if (typeof filter === 'string') {
      return activeFilters.includes(filter);
    }
    return activeFilters.some(
      f => typeof f === 'object' && f.type === 'member' && f.memberId === filter.memberId
    );
  };

  const toggleFilter = (filter: TaskFilter) => {
    if (isFilterActive(filter)) {
      // Remove filter
      if (typeof filter === 'string') {
        onFiltersChange(activeFilters.filter(f => f !== filter));
      } else {
        onFiltersChange(
          activeFilters.filter(
            f => !(typeof f === 'object' && f.type === 'member' && f.memberId === filter.memberId)
          )
        );
      }
    } else {
      // Add filter
      onFiltersChange([...activeFilters, filter]);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const getFilterLabel = (filter: TaskFilter): string => {
    if (typeof filter === 'string') {
      switch (filter) {
        case 'incomplete': return 'Incomplete tasks';
        case 'completed': return 'Completed tasks';
        case 'due-this-week': return 'Due this week';
        case 'due-next-week': return 'Due next week';
      }
    } else {
      const member = members.find(m => m.id === filter.memberId);
      return member ? `${member.avatar} ${member.name}` : 'Unknown member';
    }
  };

  const activeFilterCount = activeFilters.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-2 h-5 min-w-5 px-1 bg-blue-500"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </SheetTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-sm"
              >
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Filters Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick filters</h3>
            <div className="flex flex-wrap gap-2">
              {/* Incomplete Tasks */}
              <Button
                variant={isFilterActive('incomplete') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter('incomplete')}
                className={cn(
                  'rounded-full',
                  isFilterActive('incomplete') && 'bg-blue-500 hover:bg-blue-600'
                )}
              >
                <Circle className="w-3 h-3 mr-2" />
                Incomplete tasks
              </Button>

              {/* Completed Tasks */}
              <Button
                variant={isFilterActive('completed') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter('completed')}
                className={cn(
                  'rounded-full',
                  isFilterActive('completed') && 'bg-blue-500 hover:bg-blue-600'
                )}
              >
                <CheckCircle className="w-3 h-3 mr-2" />
                Completed tasks
              </Button>

              {/* Due This Week */}
              <Button
                variant={isFilterActive('due-this-week') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter('due-this-week')}
                className={cn(
                  'rounded-full',
                  isFilterActive('due-this-week') && 'bg-blue-500 hover:bg-blue-600'
                )}
              >
                <Calendar className="w-3 h-3 mr-2" />
                Due this week
              </Button>

              {/* Due Next Week */}
              <Button
                variant={isFilterActive('due-next-week') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFilter('due-next-week')}
                className={cn(
                  'rounded-full',
                  isFilterActive('due-next-week') && 'bg-blue-500 hover:bg-blue-600'
                )}
              >
                <Calendar className="w-3 h-3 mr-2" />
                Due next week
              </Button>
            </div>
          </div>

          {/* Member Filters Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by member</h3>
            <div className="flex flex-wrap gap-2">
              {members.map(member => {
                const memberFilter: TaskFilter = { type: 'member', memberId: member.id };
                const isActive = isFilterActive(memberFilter);
                
                return (
                  <Button
                    key={member.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFilter(memberFilter)}
                    className={cn(
                      'rounded-full',
                      isActive && 'bg-blue-500 hover:bg-blue-600'
                    )}
                  >
                    <User className="w-3 h-3 mr-2" />
                    {member.avatar} {member.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Active filters</h3>
              <div className="space-y-2">
                {activeFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-blue-900">
                      {getFilterLabel(filter)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFilter(filter)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskFilters;