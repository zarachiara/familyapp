import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Heart, Star, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppreciationNote } from '@/types';
import { showSuccess } from '@/utils/toast';

const Family = () => {
  const { household, badges, notes, addAppreciationNote } = useApp();
  const [open, setOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    toId: '',
    message: '',
  });

  const currentUserId = household?.managerId || '';

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();

    const newNote: AppreciationNote = {
      id: `note-${Date.now()}`,
      fromId: currentUserId,
      toId: noteForm.toId,
      message: noteForm.message,
      createdAt: new Date().toISOString(),
    };

    addAppreciationNote(newNote);
    showSuccess('Appreciation note sent! 💝');
    setOpen(false);
    setNoteForm({ toId: '', message: '' });
  };

  const getMemberById = (memberId: string) => {
    return household?.members.find(m => m.id === memberId);
  };

  const getMemberBadges = (memberId: string) => {
    return badges.filter(b => b.earnedBy.includes(memberId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
          <p className="text-gray-600 mt-1">
            Celebrate your family's achievements and contributions
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Heart className="w-4 h-4 mr-2" />
              Send Appreciation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Appreciation Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendNote} className="space-y-4">
              <div>
                <Label htmlFor="recipient">To</Label>
                <Select
                  value={noteForm.toId}
                  onValueChange={value => setNoteForm({ ...noteForm, toId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {household?.members
                      .filter(m => m.id !== currentUserId)
                      .map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.avatar} {member.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={noteForm.message}
                  onChange={e => setNoteForm({ ...noteForm, message: e.target.value })}
                  placeholder="Write a heartfelt message..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Note</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Family Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {household?.members
              .sort((a, b) => b.points - a.points)
              .map((member, index) => {
                const memberBadges = getMemberBadges(member.id);
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-400">#{index + 1}</div>
                      </div>
                      
                      <div className="text-4xl">{member.avatar}</div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{member.name}</h3>
                          <Badge variant="secondary">{member.role}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {member.tasksCompleted} tasks completed
                        </p>
                        
                        {memberBadges.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {memberBadges.slice(0, 3).map(badge => (
                              <span key={badge.id} className="text-xl" title={badge.name}>
                                {badge.icon}
                              </span>
                            ))}
                            {memberBadges.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{memberBadges.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: member.color }}>
                        {member.points}
                      </div>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-purple-600" />
            <span>Achievement Badges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map(badge => (
              <div
                key={badge.id}
                className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4 className="font-semibold">{badge.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  <div className="mt-3">
                    <Badge variant="secondary">
                      {badge.earnedBy.length} earned
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Appreciation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <span>Recent Appreciation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notes.slice(-10).reverse().map(note => {
              const from = getMemberById(note.fromId);
              const to = getMemberById(note.toId);
              
              return (
                <div
                  key={note.id}
                  className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{from?.avatar}</span>
                    <span className="font-medium">{from?.name}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-2xl">{to?.avatar}</span>
                    <span className="font-medium">{to?.name}</span>
                  </div>
                  <p className="text-gray-700">{note.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}

            {notes.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No appreciation notes yet</p>
                <p className="text-sm mt-1">Be the first to send one!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Family;