import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SYNC_REASONS, SyncReason, SyncScope, CustomDateRange } from '@/types/sync';
import { getScopeDescription } from '@/utils/taskFilters';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStep1Props {
  selectedScope: SyncScope;
  customDateRange?: CustomDateRange;
  selectedReason: string;
  customReason?: string;
  onSelectScope: (scope: SyncScope) => void;
  onCustomDateRangeChange: (range: CustomDateRange) => void;
  onSelectReason: (reasonId: string) => void;
  onCustomReasonChange: (reason: string) => void;
}

const SyncStep1Reason = ({
  selectedScope,
  customDateRange,
  selectedReason,
  customReason,
  onSelectScope,
  onCustomDateRangeChange,
  onSelectReason,
  onCustomReasonChange,
}: SyncStep1Props) => {
  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  
  // Get default end date (30 days from now)
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  const defaultEnd = defaultEndDate.toISOString().split('T')[0];
  return (
    <div className="space-y-6">
      {/* Scope Selector */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Recalibration Scope</Label>
        <p className="text-sm text-gray-600 mb-3">
          Choose the time window for task recalibration. Only unstarted tasks within this period will be considered.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onSelectScope('week')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
              selectedScope === 'week'
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <Calendar className={cn(
              'w-8 h-8 mb-2',
              selectedScope === 'week' ? 'text-blue-600' : 'text-gray-400'
            )} />
            <span className={cn(
              'font-semibold',
              selectedScope === 'week' ? 'text-blue-900' : 'text-gray-700'
            )}>
              This Week
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">
              {getScopeDescription('week')}
            </span>
            {selectedScope === 'week' && (
              <Badge className="mt-2 bg-blue-500">Selected</Badge>
            )}
          </button>

          <button
            onClick={() => onSelectScope('month')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
              selectedScope === 'month'
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <CalendarDays className={cn(
              'w-8 h-8 mb-2',
              selectedScope === 'month' ? 'text-purple-600' : 'text-gray-400'
            )} />
            <span className={cn(
              'font-semibold',
              selectedScope === 'month' ? 'text-purple-900' : 'text-gray-700'
            )}>
              This Month
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">
              {getScopeDescription('month')}
            </span>
            {selectedScope === 'month' && (
              <Badge className="mt-2 bg-purple-500">Selected</Badge>
            )}
          </button>

          <button
            onClick={() => onSelectScope('custom')}
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
              selectedScope === 'custom'
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <CalendarRange className={cn(
              'w-8 h-8 mb-2',
              selectedScope === 'custom' ? 'text-green-600' : 'text-gray-400'
            )} />
            <span className={cn(
              'font-semibold',
              selectedScope === 'custom' ? 'text-green-900' : 'text-gray-700'
            )}>
              Custom Range
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center">
              {selectedScope === 'custom' && customDateRange
                ? getScopeDescription('custom', customDateRange)
                : 'Choose dates'}
            </span>
            {selectedScope === 'custom' && (
              <Badge className="mt-2 bg-green-500">Selected</Badge>
            )}
          </button>
        </div>

        {/* Custom Date Range Inputs */}
        {selectedScope === 'custom' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  min={today}
                  value={customDateRange?.startDate || today}
                  onChange={(e) => onCustomDateRangeChange({
                    startDate: e.target.value,
                    endDate: customDateRange?.endDate || defaultEnd
                  })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  min={customDateRange?.startDate || today}
                  value={customDateRange?.endDate || defaultEnd}
                  onChange={(e) => onCustomDateRangeChange({
                    startDate: customDateRange?.startDate || today,
                    endDate: e.target.value
                  })}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-xs text-green-700">
              💡 Select the date range for tasks you want to recalibrate
            </p>
          </div>
        )}
      </div>

      {/* Reason Selector */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-semibold">Reason for Sync</Label>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Why sync?</strong> Understanding the reason helps us make better recommendations
            for task redistribution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNC_REASONS.map((reason: SyncReason) => (
          <Card
            key={reason.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedReason === reason.id
                ? 'border-2 border-purple-500 bg-purple-50'
                : 'border-2 border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => onSelectReason(reason.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <span className="text-3xl">{reason.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{reason.label}</h3>
                  <p className="text-sm text-gray-600">{reason.description}</p>
                </div>
                {selectedReason === reason.id && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedReason === 'custom' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Please describe your reason for this sync:
          </label>
          <Textarea
            value={customReason || ''}
            onChange={(e) => onCustomReasonChange(e.target.value)}
            placeholder="E.g., Starting a new project, kids back to school, etc."
            rows={3}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default SyncStep1Reason;