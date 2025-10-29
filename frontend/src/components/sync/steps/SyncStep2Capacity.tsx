import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FamilyMember } from '@/types';
import { MemberCapacity, CAPACITY_LABELS } from '@/types/sync';

interface SyncStep2Props {
  members: FamilyMember[];
  currentMember: FamilyMember;
  currentMemberIndex: number;
  capacity: MemberCapacity;
  onUpdateCapacity: (updates: Partial<MemberCapacity>) => void;
}

const SyncStep2Capacity = ({
  members,
  currentMember,
  currentMemberIndex,
  capacity,
  onUpdateCapacity,
}: SyncStep2Props) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>💭 {currentMember.name}'s Check-In:</strong> Help us understand your current capacity.
          Be honest - this helps create a fair distribution that works for everyone!
        </p>
      </div>

      <Card className="border-2" style={{ borderColor: currentMember.color }}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-4xl">{currentMember.avatar}</span>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: currentMember.color }}>
                {currentMember.name}
              </h3>
              <p className="text-sm text-gray-600">
                Member {currentMemberIndex + 1} of {members.length}
              </p>
            </div>
          </div>

          {/* Workload Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                💼 Current Workload (outside home)
              </label>
              <Badge variant="outline" className="text-xs">
                {CAPACITY_LABELS.workload[capacity.workloadLevel as keyof typeof CAPACITY_LABELS.workload]}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              How heavy is your work/school/other commitments right now?
            </p>
            <Slider
              value={[capacity.workloadLevel]}
              onValueChange={([value]) => onUpdateCapacity({ workloadLevel: value })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Very Light</span>
              <span>Moderate</span>
              <span>Very Heavy</span>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                ⚡ Energy Level
              </label>
              <Badge variant="outline" className="text-xs">
                {CAPACITY_LABELS.energy[capacity.energyLevel as keyof typeof CAPACITY_LABELS.energy]}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              How energized do you feel physically?
            </p>
            <Slider
              value={[capacity.energyLevel]}
              onValueChange={([value]) => onUpdateCapacity({ energyLevel: value })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Exhausted</span>
              <span>Moderate</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Emotional Capacity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                🧠 Emotional Capacity
              </label>
              <Badge variant="outline" className="text-xs">
                {CAPACITY_LABELS.emotional[capacity.emotionalCapacity as keyof typeof CAPACITY_LABELS.emotional]}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              How are you managing stress and emotional demands?
            </p>
            <Slider
              value={[capacity.emotionalCapacity]}
              onValueChange={([value]) => onUpdateCapacity({ emotionalCapacity: value })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Overwhelmed</span>
              <span>Managing</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              📝 Additional Notes (Optional)
            </label>
            <Textarea
              value={capacity.notes || ''}
              onChange={(e) => onUpdateCapacity({ notes: e.target.value })}
              placeholder="Any specific concerns or context you'd like to share..."
              rows={3}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress:</span>
          <span className="font-semibold text-purple-600">
            {currentMemberIndex + 1} / {members.length} members completed
          </span>
        </div>
      </div>
    </div>
  );
};

export default SyncStep2Capacity;