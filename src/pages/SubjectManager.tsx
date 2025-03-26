
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  FileText, 
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Subject,
  Document,
  Quiz,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getDocumentsBySubjectId,
  getQuizzesBySubjectId,
  deleteDocument,
  initializeSubjectsIfNeeded
} from '@/services/subjectService';
import { deleteQuiz } from '@/services/quizService';

const SubjectManager = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit subject form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const icons = ['📚', '📝', '📊', '🧮', '🔬', '🧪', '🔭', '📜', '🌍', '🧠', '⚛️', '🧬', '🔠', '🎨', '🎭', '🎵', '🏛️', '💻', '🌐', '📱'];
  const colors = ['#4f46e5', '#16a34a', '#b45309', '#db2777', '#9333ea', '#059669', '#d97706', '#dc2626', '#0891b2', '#4338ca'];

  useEffect(() => {
    const initialize = async () => {
      // Initialize default subjects if needed
      await initializeSubjectsIfNeeded();
      await loadSubjects();
    };
    
    initialize();
  }, []);
  
  useEffect(() => {
    if (selectedSubject) {
      loadDocumentsAndQuizzes(selectedSubject.id);
    }
  }, [selectedSubject]);
  
  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const loadedSubjects = await getSubjects();
      setSubjects(loadedSubjects);
      
      if (loadedSubjects.length > 0) {
        setSelectedSubject(loadedSubjects[0]);
      } else {
        setSelectedSubject(null);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadDocumentsAndQuizzes = async (subjectId: string) => {
    try {
      const loadedDocuments = await getDocumentsBySubjectId(subjectId);
      const loadedQuizzes = await getQuizzesBySubjectId(subjectId);
      
      setDocuments(loadedDocuments);
      setQuizzes(loadedQuizzes);
    } catch (error) {
      console.error("Error loading subject content:", error);
      toast.error("Failed to load documents and quizzes");
    }
  };
  
  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
  };
  
  const handleEditSubject = (subject: Subject) => {
    setEditName(subject.name);
    setEditDescription(subject.description);
    setEditIcon(subject.icon);
    setEditColor(subject.color);
    setEditDialogOpen(true);
  };
  
  const handleUpdateSubject = async () => {
    if (!selectedSubject) return;
    
    if (!editName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    
    try {
      const updated = await updateSubject(selectedSubject.id, {
        name: editName,
        description: editDescription,
        icon: editIcon,
        color: editColor
      });
      
      if (updated) {
        setEditDialogOpen(false);
        await loadSubjects();
        
        // Re-select the updated subject
        const refreshedSubject = await getSubjectById(selectedSubject.id);
        if (refreshedSubject) {
          setSelectedSubject(refreshedSubject);
        }
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject");
    }
  };
  
  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const success = await deleteSubject(subjectId);
      
      if (success) {
        await loadSubjects();
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
    }
  };
  
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const success = await deleteDocument(documentId);
      
      if (success && selectedSubject) {
        await loadDocumentsAndQuizzes(selectedSubject.id);
        toast.success('Document deleted successfully');
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const success = await deleteQuiz(quizId);
      
      if (success && selectedSubject) {
        await loadDocumentsAndQuizzes(selectedSubject.id);
        toast.success('Quiz deleted successfully');
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };
  
  const handleCreateNewSubject = () => {
    navigate('/dashboard');
  };
  
  const handleAddDocument = () => {
    if (!selectedSubject) {
      toast.error('Please select a subject first');
      return;
    }
    
    navigate('/upload');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cat animate-spin mr-2" />
        <p className="text-muted-foreground">Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subject Manager</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your subjects and their associated documents and quizzes
          </p>
        </div>
        <Button 
          onClick={handleCreateNewSubject}
          className="cat-button"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Subject
        </Button>
      </div>
      
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="glass-card p-4 rounded-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-cat" />
              Your Subjects
            </h2>
            
            <div className="space-y-2">
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <button
                    key={subject.id}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedSubject?.id === subject.id
                        ? 'bg-cat/10 text-cat'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleSelectSubject(subject)}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{subject.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {documents.length} documents
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No subjects found
                  </p>
                  <Button 
                    onClick={handleCreateNewSubject}
                    variant="outline"
                    size="sm"
                  >
                    Create Your First Subject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          {selectedSubject ? (
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl"
                      style={{ backgroundColor: selectedSubject.color }}
                    >
                      {selectedSubject.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedSubject.name}</h2>
                      <p className="text-muted-foreground">
                        {selectedSubject.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSubject(selectedSubject)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Subject</DialogTitle>
                          <DialogDescription>
                            Make changes to your subject details
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Subject name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
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
                                  onClick={() => setEditIcon(icon)}
                                  className={`w-8 h-8 text-lg flex items-center justify-center rounded ${
                                    editIcon === icon ? 'bg-cat/20 border-2 border-cat' : 'hover:bg-gray-100'
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
                                  onClick={() => setEditColor(color)}
                                  className={`w-6 h-6 rounded-full ${
                                    editColor === color ? 'ring-2 ring-offset-2 ring-cat' : ''
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
                            onClick={() => setEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleUpdateSubject}
                            className="bg-cat hover:bg-cat/90"
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the subject "{selectedSubject.name}" and all its associated documents and quizzes. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteSubject(selectedSubject.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="text-center p-3 bg-cat/5 rounded-lg">
                    <div className="text-2xl font-bold text-cat">{documents.length}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                  <div className="text-center p-3 bg-cat/5 rounded-lg">
                    <div className="text-2xl font-bold text-cat">{quizzes.length}</div>
                    <div className="text-sm text-muted-foreground">Quizzes</div>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cat" />
                    Documents
                  </h3>
                  
                  <Button 
                    onClick={handleAddDocument}
                    className="cat-button-secondary"
                    size="sm"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Add Document
                  </Button>
                </div>
                
                {documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.map((document) => (
                      <Card key={document.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-6 h-6 rounded flex items-center justify-center bg-cat/10 text-cat">
                              {document.fileType.includes('pdf') ? '📄' : 
                                document.fileType.includes('doc') ? '📝' : 
                                document.fileType.includes('txt') ? '📃' : '📁'}
                            </span>
                            <span className="truncate">{document.name}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(document.uploadedAt).toLocaleDateString()} • {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {document.content.substring(0, 100)}...
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-cat hover:text-cat/80 hover:bg-cat/10 text-xs"
                            onClick={() => navigate('/upload')}
                          >
                            Create Quiz
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No documents found in this subject
                    </p>
                    <Button 
                      onClick={handleAddDocument}
                      variant="outline"
                      size="sm"
                    >
                      Add Your First Document
                    </Button>
                  </div>
                )}
              </div>
              
              {quizzes.length > 0 && (
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-cat" />
                    Quizzes
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                      <Card key={quiz.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{quiz.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(quiz.createdAt).toLocaleDateString()} • {quiz.questions.length} questions
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {quiz.results ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                                style={{ 
                                  backgroundColor: 
                                    quiz.results.punteggio_totale > 0.7 ? '#16a34a' : 
                                    quiz.results.punteggio_totale > 0.4 ? '#d97706' : '#dc2626'
                                }}
                              >
                                {Math.round(quiz.results.punteggio_totale * 100)}%
                              </div>
                              <div className="text-xs">
                                {quiz.results.punteggio_totale > 0.7 ? 'Great job!' : 
                                 quiz.results.punteggio_totale > 0.4 ? 'Good effort!' : 'Keep practicing!'}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Quiz not yet taken
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-cat hover:text-cat/80 hover:bg-cat/10 text-xs"
                            onClick={() => navigate('/quiz')}
                          >
                            Take Quiz
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-16 border border-dashed rounded-xl">
              <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Subject Selected</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Select a subject from the sidebar or create a new one to manage your documents and quizzes
              </p>
              <Button 
                onClick={handleCreateNewSubject}
                className="cat-button"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Subject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManager;
