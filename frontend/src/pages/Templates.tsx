import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Template, Task } from '@/types';
import { showSuccess } from '@/utils/toast';

const Templates = () => {
  const { templates, addTask, household } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleApplyTemplate = (template: Template) => {
    const managerId = household?.managerId || '';
    
    template.tasks.forEach((taskTemplate, index) => {
      const newTask: Task = {
        id: `task-${Date.now()}-${index}`,
        ...taskTemplate,
        assigneeId: household?.members[0]?.id || '',
        status: 'todo',
        createdBy: managerId,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      };
      addTask(newTask);
    });

    showSuccess(`Applied template: ${template.name} (${template.tasks.length} tasks created)`);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Templates</h1>
          <p className="text-gray-600 mt-1">
            Pre-built checklists to help you get started quickly
          </p>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {/* Categories */}
      {categories.map(category => {
        const categoryTemplates = templates.filter(t => t.category === category);

        return (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span>{template.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {template.tasks.length} tasks
                      </Badge>
                      {template.isCustom && (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <span>{selectedTemplate?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <p className="text-gray-600">{selectedTemplate.description}</p>

              <div>
                <h3 className="font-semibold mb-3">Tasks in this template:</h3>
                <div className="space-y-2">
                  {selectedTemplate.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {task.points} pts
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.estimatedMinutes} min
                          </Badge>
                          {task.room && (
                            <Badge variant="outline" className="text-xs">
                              {task.room}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleApplyTemplate(selectedTemplate)}>
                  Apply Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;