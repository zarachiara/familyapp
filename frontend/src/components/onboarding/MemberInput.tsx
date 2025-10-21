import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { OnboardingMember } from '@/types/onboarding';

interface MemberInputProps {
  members: OnboardingMember[];
  onAdd: (name: string) => void;
  onRemove: (memberId: string) => void;
  minMembers?: number;
}

const MemberInput = ({ members, onAdd, onRemove, minMembers = 2 }: MemberInputProps) => {
  const [newMemberName, setNewMemberName] = useState('');

  const handleAdd = () => {
    if (newMemberName.trim()) {
      onAdd(newMemberName);
      setNewMemberName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={newMemberName}
          onChange={e => setNewMemberName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter name"
        />
        <Button onClick={handleAdd} type="button">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{member.avatar}</span>
              <div>
                <p className="font-semibold">{member.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {index === 0 ? 'Manager' : 'Member'}
                </Badge>
              </div>
            </div>
            {members.length > minMembers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(member.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberInput;