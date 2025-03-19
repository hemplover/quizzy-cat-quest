
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectDialogOpen, setNewSubjectDialogOpen] = useState(false);
  
  // New subject form state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('📚');
  const [newSubjectColor, setNewSubjectColor] = useState('#4f46e5');
  
  const icons = ['📚', '📝', '📊', '🧮', '🔬', '🧪', '🔭', '📜', '🌍', '🧠', '⚛️', '🧬', '🔠', '🎨', '🎭', '🎵', '🏛️', '💻', '🌐', '📱'];
  const colors = ['#4f46e5', '#16a34a', '#b45309', '#db2777', '#9333ea', '#059669', '#d97706', '#dc2626', '#0891b2', '#4338ca'];

  useEffect(() => {
    loadSubjects();
  }, []);
  
  const loadSubjects = () => {
    const loadedSubjects = getSubjects();
    setSubjects(loadedSubjects);
    
    // If no subject is selected and we have subjects, select the first one
    if (!selectedSubject && loadedSubjects.length > 0) {
      onSubjectChange(loadedSubjects[0].id);
    }
  };
  
  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    
    try {
      createSubject({
        name: newSubjectName,
        description: newSubjectDescription,
        icon: newSubjectIcon,
        color: newSubjectColor
      });
      
      // Reset form
      setNewSubjectName('');
      setNewSubjectDescription('');
      setNewSubjectIcon('📚');
      setNewSubjectColor('#4f46e5');
      
      // Close dialog
      setNewSubjectDialogOpen(false);
      
      // Reload subjects
      loadSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
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
              >
                Create Subject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {subjects.length > 0 ? (
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
