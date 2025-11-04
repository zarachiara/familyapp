import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, Clock, TrendingUp, Info } from 'lucide-react';
import { EquilibriumSnapshot } from '@/types';
import { format } from 'date-fns';

interface EquilibriumHistoryProps {
  history: EquilibriumSnapshot[];
  currentEquilibrium: EquilibriumSnapshot | null;
  onRestore: (snapshotId: string) => void;
}

const EquilibriumHistory = ({
  history,
  currentEquilibrium,
  onRestore,
}: EquilibriumHistoryProps) => {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📜 Equilibrium History</CardTitle>
          <CardDescription>
            View and restore previous default distributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-gray-200">
            <Info className="h-4 w-4" />
            <AlertDescription>
              No previous equilibrium snapshots yet. When you save a new default distribution,
              your current one will be added to history.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📜 Equilibrium History</CardTitle>
        <CardDescription>
          View and restore previous default distributions ({history.length} saved)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((snapshot, index) => (
            <div
              key={snapshot.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(snapshot.timestamp), 'MMM d, yyyy \'at\' h:mm a')}
                    </span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Most Recent
                      </Badge>
                    )}
                  </div>

                  {snapshot.description && (
                    <p className="text-sm text-gray-600 pl-6">
                      {snapshot.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 pl-6">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-gray-600">
                        Fairness: <strong className="text-green-600">{snapshot.fairnessScore}%</strong>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {Object.keys(snapshot.assignments).length} members
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(snapshot.id)}
                  className="ml-4"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            💡 <strong>Tip:</strong> Restoring a snapshot will make it your new active equilibrium
            and move your current one to history.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquilibriumHistory;