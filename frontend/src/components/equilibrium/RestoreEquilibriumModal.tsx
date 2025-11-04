import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { EquilibriumSnapshot } from '@/types';
import { format } from 'date-fns';

interface RestoreEquilibriumModalProps {
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
  equilibrium: EquilibriumSnapshot | null;
  currentDrift: number;
}

const RestoreEquilibriumModal = ({
  open,
  onClose,
  onRestore,
  equilibrium,
  currentDrift,
}: RestoreEquilibriumModalProps) => {
  if (!equilibrium) return null;

  const handleRestore = () => {
    onRestore();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-green-600" />
            <span>🔄 Return to Default Balance?</span>
          </DialogTitle>
          <DialogDescription>
            This will restore your household to its saved default task distribution.
            Temporary or special reassignments will be cleared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentDrift > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900">
                <strong>{currentDrift}% of tasks</strong> have been reassigned since your last equilibrium.
                Restoring will revert these changes.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Saved Equilibrium</p>
              <p className="text-xs text-gray-500">
                {format(new Date(equilibrium.timestamp), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>

            {equilibrium.description && (
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-600">{equilibrium.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700">Fairness Score</p>
              <p className="text-2xl font-bold text-green-600">{equilibrium.fairnessScore}%</p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600">
                <strong>What will happen:</strong>
                <br />
                • All tasks will be reassigned to their equilibrium owners
                <br />
                • Any temporary redistributions will be cleared
                <br />
                • Your household will return to its natural balance
              </p>
            </div>
          </div>

          {currentDrift === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900">
                You're already at equilibrium! No changes needed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleRestore} 
            className="bg-green-600 hover:bg-green-700"
            disabled={currentDrift === 0}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore Default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RestoreEquilibriumModal;