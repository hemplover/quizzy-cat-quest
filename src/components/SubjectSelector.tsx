import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Folder, BookOpen } from 'lucide-react';
import { Subject, getSubjects, createSubject } from '@/services/subjectService';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SubjectSelectorProps {
  selectedSubject: string | null;
  onSubjectChange: (subjectId: string) => void;
  className?: string;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  selectedSubject,
  onSubjectChange,
  className
}) => {
  const queryClient = useQueryClient();
  const [newSubjectDialogOpen, setNewSubjectDialogOpen] = useState(false);
  
  // New subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('📚');
  const [newSubjectColor, setNewSubjectColor] = useState('#4f46e5');
  
  const icons = ['📚', '📝', '📊', '🧮', '🔬', '🧪', '🔭', '📜', '🌍', '🧠', '⚛️', '🧬', '🔠', '🎨', '🎭', '🎵', '🏛️', '💻', '🌐', '📱'];
  const colors = ['#4f46e5', '#16a34a', '#b45309', '#db2777', '#9333ea', '#059669', '#d97706', '#dc2626', '#0891b2', '#4338ca'];

  // Fetch subjects with React Query
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: (subjectData: {
      name: string;
      description: string;
      icon: string;
      color: string;
    }) => createSubject(subjectData),
    onSuccess: () => {
      // Reset form
      setNewSubjectName('');
      setNewSubjectDescription('');
      setNewSubjectIcon('📚');
      setNewSubjectColor('#4f46e5');
      
      // Close dialog
      setNewSubjectDialogOpen(false);
      
      // Invalidate subjects query to refetch
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  });
  
  useEffect(() => {
    // Select first subject if none selected and we have subjects
    if (!selectedSubject && subjects.length > 0) {
      onSubjectChange(subjects[0].id);
    }
  }, [subjects, selectedSubject, onSubjectChange]);
  
  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    
    createSubjectMutation.mutate({
      name: newSubjectName,
      description: newSubjectDescription,
      icon: newSubjectIcon,
      color: newSubjectColor
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cat" />
          <h3 className="text-sm font-medium">Subject</h3>
        </div>
        
        <Dialog open={newSubjectDialogOpen} onOpenChange={setNewSubjectDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="text-xs text-cat flex items-center gap-1 hover:underline"
              type="button"
            >
              <PlusCircle className="w-3 h-3" />
              <span>New</span>
            </button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Subject name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newSubjectDescription}
                  onChange={(e) => setNewSubjectDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewSubjectIcon(icon)}
                      className={`w-8 h-8 text-lg flex items-center justify-center rounded ${
                        newSubjectIcon === icon ? 'bg-cat/20 border-2 border-cat' : 'hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSubjectColor(color)}
                      className={`w-6 h-6 rounded-full ${
                        newSubjectColor === color ? 'ring-2 ring-offset-2 ring-cat' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setNewSubjectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleCreateSubject}
                className="bg-cat hover:bg-cat/90"
                disabled={createSubjectMutation.isPending}
              >
                {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cat"></div>
        </div>
      ) : subjects.length > 0 ? (
        <Select 
          value={selectedSubject || undefined} 
          onValueChange={onSubjectChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <span>{subject.icon}</span>
                  <span>{subject.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="text-center p-4 border border-dashed rounded-md">
          <Folder className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No subjects found. Create your first subject to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubjectSelector;
