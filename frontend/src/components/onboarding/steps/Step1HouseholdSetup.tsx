import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MemberInput from '../MemberInput';
import { OnboardingMember } from '@/types/onboarding';

interface Step1Props {
  householdName: string;
  members: OnboardingMember[];
  onHouseholdNameChange: (name: string) => void;
  onAddMember: (name: string) => void;
  onRemoveMember: (memberId: string) => void;
}

const Step1HouseholdSetup = ({
  householdName,
  members,
  onHouseholdNameChange,
  onAddMember,
  onRemoveMember,
}: Step1Props) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="householdName">Household Name</Label>
        <Input
          id="householdName"
          value={householdName}
          onChange={e => onHouseholdNameChange(e.target.value)}
          placeholder="e.g., The Smith Family"
          className="mt-2"
        />
      </div>

      <div>
        <Label>Family Members (minimum 2)</Label>
        <div className="mt-2">
          <MemberInput
            members={members}
            onAdd={onAddMember}
            onRemove={onRemoveMember}
            minMembers={2}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Add all adults and older children who will participate in household tasks.
          The first person will be the household manager.
        </p>
      </div>
    </div>
  );
};

export default Step1HouseholdSetup;