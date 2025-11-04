import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Info } from 'lucide-react';

interface SaveEquilibriumModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (description?: string) => void;
  fairnessScore: number;
}

const SaveEquilibriumModal = ({
  open,
  onClose,
  onSave,
  fairnessScore,
}: SaveEquilibriumModalProps) => {
  const [description, setDescription] = useState('');

  const handleSave = () => {
    onSave(description.trim() || undefined);
    setDescription('');
    onClose();
  };

  const handleCancel = () => {
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="w-5 h-5 text-blue-600" />
            <span>💾 Save as Default Distribution</span>
          </DialogTitle>
          <DialogDescription>
            Things feel balanced? Save the current household setup as your default equilibrium.
            You can return to it anytime after temporary changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Current Fairness Score: {fairnessScore}%</strong>
              <br />
              This snapshot will save all current task assignments and member capacities.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description (Optional)
            </Label>
            <Input
              id="description"
              placeholder="e.g., 'Post-summer balance' or 'After school year starts'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              Add a note to help you remember this balance point
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-medium mb-1">What gets saved:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Current task assignments for all members</li>
              <li>Fairness score snapshot</li>
              <li>Member capacity levels</li>
              <li>Timestamp of this balance</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveEquilibriumModal;