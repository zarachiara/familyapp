import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RecurrencePattern } from '@/types';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

interface RecurringSchedulerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStartDate?: string;
  currentRecurrence?: RecurrencePattern;
  onSave: (startDate: string, recurrence: RecurrencePattern, daysOfWeek?: number[]) => void;
}

const RecurringSchedulerModal = ({
  open,
  onOpenChange,
  currentStartDate,
  currentRecurrence = 'none',
  onSave,
}: RecurringSchedulerModalProps) => {
  const [startDate, setStartDate] = useState<Date>(
    currentStartDate ? new Date(currentStartDate) : new Date()
  );
  const [recurrence, setRecurrence] = useState<RecurrencePattern>(currentRecurrence);
  const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]); // 0 = Sunday, 6 = Saturday

  const daysOfWeek = [
    { label: 'S', value: 0, full: 'Sunday' },
    { label: 'M', value: 1, full: 'Monday' },
    { label: 'T', value: 2, full: 'Tuesday' },
    { label: 'W', value: 3, full: 'Wednesday' },
    { label: 'T', value: 4, full: 'Thursday' },
    { label: 'F', value: 5, full: 'Friday' },
    { label: 'S', value: 6, full: 'Saturday' },
  ];

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    const isoDate = startDate.toISOString();
    onSave(isoDate, recurrence, recurrence === 'weekly' ? selectedDays : undefined);
    onOpenChange(false);
  };

  const handleClearRecurrence = () => {
    setRecurrence('none');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Schedule Recurring Task</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Start Date Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">💡</span>
                Start date
              </Label>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                <span className="text-sm font-medium">
                  {format(startDate, 'MM/dd/yy')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStartDate(new Date())}
                  className="h-5 w-5 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Calendar */}
            <div className="border rounded-lg p-3 bg-white">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Repeats Section */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Repeats</Label>
            <Select value={recurrence} onValueChange={(value) => setRecurrence(value as RecurrencePattern)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time (No repeat)</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days of Week Selection (only for weekly) */}
          {recurrence === 'weekly' && (
            <div>
              <Label className="text-sm font-medium mb-3 block">On these days</Label>
              <div className="flex gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex flex-col items-center">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                      className="h-10 w-10 rounded-md data-[state=checked]:bg-blue-500"
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="text-xs mt-1 cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedDays.length === 0 
                  ? 'None' 
                  : selectedDays
                      .sort((a, b) => a - b)
                      .map(d => daysOfWeek[d].full)
                      .join(', ')}
              </p>
            </div>
          )}

          {/* Summary */}
          {recurrence !== 'none' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Summary:</strong> This task will repeat{' '}
                {recurrence === 'daily' && 'every day'}
                {recurrence === 'weekly' && selectedDays.length > 0 && (
                  <>
                    every{' '}
                    {selectedDays
                      .sort((a, b) => a - b)
                      .map(d => daysOfWeek[d].full)
                      .join(', ')}
                  </>
                )}
                {recurrence === 'monthly' && 'on the same day each month'}
                {' '}starting {format(startDate, 'MMMM d, yyyy')}.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              Save Schedule
            </Button>
            {recurrence !== 'none' && (
              <Button variant="outline" onClick={handleClearRecurrence}>
                Clear Recurrence
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringSchedulerModal;