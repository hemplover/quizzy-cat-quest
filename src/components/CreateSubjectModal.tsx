import React, { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSubject } from '@/services/subjectService';

interface CreateSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubjectCreated?: (subjectId: string) => void;
}

const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({ 
  open, 
  onOpenChange,
  onSubjectCreated 
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Predefined options
  const icons = ['📚', '📝', '📊', '🧮', '🔬', '🧪', '🔭', '📜', '🌍', '🧠', '⚛️', '🧬', '🔠', '🎨', '🎭', '🎵', '🏛️', '💻', '🌐', '📱'];
  const colors = ['#4f46e5', '#16a34a', '#b45309', '#db2777', '#9333ea', '#059669', '#d97706', '#dc2626', '#0891b2', '#4338ca'];
  
  const [selectedIcon, setSelectedIcon] = useState(icons[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleCreateSubject = async () => {
    if (!name.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const newSubject = await createSubject({
        name,
        description,
        icon: selectedIcon,
        color: selectedColor
      });
      
      onOpenChange(false);
      setName('');
      setDescription('');
      
      if (onSubjectCreated && newSubject) {
        onSubjectCreated(newSubject.id);
      }
    } catch (error) {
      console.error('Error creating subject:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('newSubject')}</DialogTitle>
          <DialogDescription>
            {t('createYourFirstSubject')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('subjectName')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('subjectName')}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('subjectDescription')}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('subjectDescription')}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('icon')}</label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-8 h-8 text-lg flex items-center justify-center rounded ${
                    selectedIcon === icon ? 'bg-cat/20 border-2 border-cat' : 'hover:bg-gray-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('color')}</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-cat' : ''
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
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button 
            type="button" 
            onClick={handleCreateSubject}
            className="bg-cat hover:bg-cat/90"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? t('creating') : t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSubjectModal;
