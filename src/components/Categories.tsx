import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderOpen, Plus, Edit, Trash2, FileText, ArrowLeft, Eye, Download, MessageSquare, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { documentsAPI, categoriesAPI } from '../services/api';

interface DocumentType {
  id: number;
  name: string;
  title?: string;
  category: string;
  uploadDate: string;
  size: string;
  uploader: string;
  file: File | null;
  fileUrl: string | null;
  fileData?: string;
}

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editDocForm, setEditDocForm] = useState({ name: '', category: '' });
  const [commentingDoc, setCommentingDoc] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'];

  const fetchCategories = () => {
    categoriesAPI.getCategories()
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.categories);
        } else {
          toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
        }
      })
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
      });
  };

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    setLoading(true);
    documentsAPI.getDocuments()
      .then(res => {
        if (res.data.success) {
          setDocuments(res.data.documents);
        } else {
          setError('Failed to fetch documents');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch documents');
        setLoading(false);
      });
  }, []);

  // Update category document counts
  useEffect(() => {
    const updatedCategories = categories.map(cat => ({
      ...cat,
      documentCount: documents.filter(doc => doc.category === cat.name).length
    }));
    setCategories(updatedCategories);
  }, [documents]);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a category name', variant: 'destructive' });
      return;
    }
    try {
      await categoriesAPI.addCategory(newCategory);
      setNewCategory({ name: '', description: '' });
      setIsDialogOpen(false);
      fetchCategories();
      toast({ title: 'Category added', description: `${newCategory.name} has been created successfully` });
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to add category', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await categoriesAPI.deleteCategory(categoryId);
      fetchCategories();
      toast({ title: 'Category deleted', description: 'Category has been removed successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to delete category', variant: 'destructive' });
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditForm({ name: category.name, description: category.description });
  };

  const handleSaveEdit = () => {
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, name: editForm.name, description: editForm.description }
        : cat
    ));
    setEditingCategory(null);
    toast({
      title: "Category updated",
      description: "Category has been updated successfully",
    });
  };

  const handleViewAll = (category) => {
    setSelectedCategory(category);
    setShowCategoryDetails(true);
  };

  const handleViewDocument = (doc) => {
    setViewingDoc(doc);
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setEditDocForm({ name: doc.name, category: doc.category });
  };

  const handleSaveDocumentEdit = async () => {
    try {
      await documentsAPI.updateDocument(editingDoc.id, { title: editDocForm.name });
      // Optionally, refetch documents if needed
      setDocuments(documents.map(doc =>
        doc.id === editingDoc.id
          ? { ...doc, name: editDocForm.name, title: editDocForm.name, category: editDocForm.category }
          : doc
      ));
      setEditingDoc(null);
      toast({
        title: "Document updated",
        description: "Document has been updated successfully",
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to update document',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = (doc) => {
    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Downloading ${doc.name}`,
      });
    } else {
      toast({
        title: "Download unavailable",
        description: "This file is not available for download",
        variant: "destructive"
      });
    }
  };

  const handleComment = (doc) => {
    setCommentingDoc(doc);
    setNewComment('');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: user?.name || 'Current User',
      comment: newComment.trim(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setComments(prev => ({
      ...prev,
      [commentingDoc.id]: [...(prev[commentingDoc.id] || []), comment]
    }));

    setNewComment('');
    toast({
      title: "Comment added",
      description: "Your comment has been added successfully",
    });
  };

  const renderFilePreview = (doc) => {
    if (!doc.fileUrl) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center min-h-[400px] flex items-center justify-center">
          <div>
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">File preview not available</p>
            <p className="text-sm text-gray-500 mt-2">No file URL available for preview</p>
          </div>
        </div>
      );
    }

    // Guess file type from extension if not present
    let fileType = doc.file_type || '';
    if (!fileType && doc.fileUrl) {
      const ext = doc.fileUrl.split('.').pop().toLowerCase();
      if (ext === 'pdf') fileType = 'application/pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) fileType = 'image/' + ext;
      else if (['txt', 'md', 'csv', 'log'].includes(ext)) fileType = 'text/plain';
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="w-full space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.open(doc.fileUrl, '_blank')} className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Eye className="w-4 h-4 mr-2" />Open in New Tab
              </Button>
              <Button onClick={() => handleDownload(doc)} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />Download PDF
              </Button>
            </div>
          </div>
          <div className="w-full border rounded-lg overflow-hidden bg-white">
            <embed src={doc.fileUrl} type="application/pdf" width="100%" height="600px" className="border-0" />
          </div>
        </div>
      );
    } else if (fileType.startsWith('image/')) {
      return (
        <div className="flex flex-col items-center min-h-[400px] bg-gray-50 rounded-lg p-4">
          <div className="mb-2 font-medium">{doc.title || doc.name}</div>
          <img
            src={encodeURI(doc.fileUrl)}
            alt={doc.title || doc.name}
            className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://via.placeholder.com/300x300?text=Image+not+found';
            }}
          />
        </div>
      );
    } else if (fileType.includes('text/') || fileType.includes('application/json')) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg min-h-[400px]">
          <p className="text-sm text-gray-600 mb-2">Text file preview:</p>
          <div className="bg-white p-4 rounded border font-mono text-sm">
            <p>File content preview would be available for text files</p>
          </div>
        </div>
      );
    } else if (["doc", "docx"].includes((doc.fileUrl || '').split('.').pop().toLowerCase())) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center min-h-[400px] flex items-center justify-center">
          <div>
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Preview not available for this file type</p>
            <Button onClick={() => handleDownload(doc)} className="mt-4 mr-2" variant="outline">
              <Download className="w-4 h-4 mr-2" />Download to view
            </Button>
            <Button
              onClick={() => {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  alert('Google Docs preview only works for publicly accessible files. Please deploy your app or use a public file URL.');
                } else {
                  window.open(`https://docs.google.com/gview?url=${encodeURIComponent(doc.fileUrl)}&embedded=true`, '_blank');
                }
              }}
              className="mt-4" variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />View in Google Docs
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center min-h-[400px] flex items-center justify-center">
          <div>
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Preview not available for this file type</p>
            <Button onClick={() => handleDownload(doc)} className="mt-4" variant="outline">
              <Download className="w-4 h-4 mr-2" />Download to view
            </Button>
          </div>
        </div>
      );
    }
  };

  if (showCategoryDetails && selectedCategory) {
    const categoryDocuments = documents.filter(doc => doc.category === selectedCategory.name);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setShowCategoryDetails(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedCategory.name} Documents</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${selectedCategory.color}`}>
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <span>Documents in {selectedCategory.name} ({categoryDocuments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">{selectedCategory.description}</p>
            
            {categoryDocuments.length > 0 ? (
              <div className="space-y-3">
                {categoryDocuments.map((doc) => {
                  console.log('Category Document object:', doc); // Debug log
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <h4 className="font-medium">{doc.title || doc.name || "Untitled Document"}</h4>
                          <p className="text-sm text-gray-500">{doc.size} • {doc.uploadDate} • {doc.uploader}</p>
                          {doc.fileUrl && <p className="text-xs text-green-600">✓ File available</p>}
                          {!doc.fileUrl && <p className="text-xs text-orange-600">⚠ File not available</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleComment(doc)}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents found in this category</p>
                <p className="text-sm text-gray-500 mt-2">Go to Documents page to upload files to this category</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Document Dialog */}
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Viewing: {viewingDoc?.name}</span>
                {viewingDoc?.file && (
                  <Button onClick={() => handleDownload(viewingDoc)} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div><strong>Category:</strong> {viewingDoc?.category}</div>
                <div><strong>Size:</strong> {viewingDoc?.size}</div>
                <div><strong>Upload Date:</strong> {viewingDoc?.uploadDate}</div>
                <div><strong>Uploader:</strong> {viewingDoc?.uploader}</div>
              </div>
              {viewingDoc && renderFilePreview(viewingDoc)}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDocName">Document Name</Label>
                <Input
                  id="editDocName"
                  value={editDocForm.name}
                  onChange={(e) => setEditDocForm({ ...editDocForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editDocCategory">Category</Label>
                <Input
                  id="editDocCategory"
                  value={editDocForm.category}
                  onChange={(e) => setEditDocForm({ ...editDocForm, category: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
                <Button onClick={handleSaveDocumentEdit}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={!!commentingDoc} onOpenChange={() => setCommentingDoc(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>{commentingDoc?.name}'s Comments</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="newComment" className="text-sm font-medium">Add Comment</Label>
                <Textarea
                  id="newComment"
                  placeholder="Add your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleAddComment} className="bg-green-600 hover:bg-green-700">
                  Add Comment
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-900">Comments ({comments[commentingDoc?.id]?.length || 0})</h4>
                {comments[commentingDoc?.id]?.length > 0 ? (
                  comments[commentingDoc.id].map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.user}</span>
                          <span className="text-xs text-gray-500">{comment.date} at {comment.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Enter category description"
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-700">
                Add Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>{category.documentCount} documents</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewAll(category)}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Category Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Categories };
