import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Search, Download, Edit, Trash2, Eye, Plus, MessageSquare, X } from 'lucide-react';
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
  userId: number; // Add userId to link documents to users
  file_size?: number;
  uploaded_by?: string;
  created_at?: string;
}

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [comments, setComments] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [commentingDoc, setCommentingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '' });
  const [newComment, setNewComment] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showGoogleDocsWarning, setShowGoogleDocsWarning] = useState(false);

  const fetchDocuments = () => {
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
  };

  useEffect(() => { if (user) fetchDocuments(); }, [user]);

  useEffect(() => {
    categoriesAPI.getCategories()
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.categories);
          setSelectedCategory(res.data.categories[0]?.name || '');
        }
      });
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('category', selectedCategory);
    try {
      await documentsAPI.uploadDocument(formData);
      fetchDocuments();
      setIsUploading(false);
      toast({
        title: 'File uploaded successfully',
        description: `${file.name} has been uploaded and is ready for viewing`,
      });
      window.dispatchEvent(new Event('docs-updated'));
    } catch (err) {
      setIsUploading(false);
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to upload document', variant: 'destructive' });
    }
  };

  const handleDownload = (doc) => {
    if (doc.fileUrl) {
      // Download using fileUrl
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.title || doc.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download started",
        description: `Downloading ${doc.title || doc.name}`,
      });
    } else {
      toast({
        title: "Download unavailable",
        description: "This file is not available for download",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (docId) => {
    try {
      await documentsAPI.deleteDocument(docId);
      fetchDocuments();
      toast({ title: 'Document deleted', description: 'Document has been removed successfully' });
      window.dispatchEvent(new Event('docs-updated'));
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to delete document', variant: 'destructive' });
    }
  };

  const handleView = (doc) => {
    setViewingDoc(doc);
    if (!doc.file) {
      toast({
        title: "File not available",
        description: "This file cannot be previewed",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setEditForm({ name: doc.name, category: doc.category });
  };

  const handleSaveEdit = async () => {
    try {
      await documentsAPI.updateDocument(editingDoc.id, { title: editForm.name });
      fetchDocuments();
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

  const handleDocumentClick = (doc) => {
    handleView(doc);
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

  const handleDeleteComment = (docId, commentId) => {
    setComments(prev => ({
      ...prev,
      [docId]: prev[docId]?.filter(comment => comment.id !== commentId) || []
    }));
    toast({
      title: "Comment deleted",
      description: "Comment has been removed",
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
            <h3 className="font-medium text-blue-900 mb-2">PDF Preview: {doc.title || doc.name}</h3>
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
      console.log('Image preview URL:', doc.fileUrl);
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
    } else if (['doc', 'docx'].includes((doc.fileUrl || '').split('.').pop().toLowerCase())) {
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
                  setShowGoogleDocsWarning(true);
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
            <p className="text-sm text-gray-500 mt-2">{fileType}</p>
            <Button onClick={() => handleDownload(doc)} className="mt-4" variant="outline">
              <Download className="w-4 h-4 mr-2" />Download to view
            </Button>
          </div>
        </div>
      );
    }
  };

  // Filter documents based on searchTerm
  const filteredDocuments = documents.filter(doc => {
    const search = searchTerm.toLowerCase();
    return (
      (doc.title && doc.title.toLowerCase().includes(search)) ||
      (doc.name && doc.name.toLowerCase().includes(search))
    );
  });

  // Show loading or login message if user is not available
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view your documents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  disabled={isUploading}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {isUploading && (
                <div className="text-center">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>My Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No documents found</p>
              <p className="text-gray-500">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const canPreview = !!doc.fileUrl && ([
                  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'txt', 'md', 'csv', 'log', 'json'
                ].includes((doc.fileUrl || '').split('.').pop().toLowerCase()));
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.title || doc.name || "Untitled Document"}</h3>
                        <p className="text-sm text-gray-500">{doc.category} • {doc.size || (doc.file_size ? (doc.file_size / (1024*1024)).toFixed(2) + ' MB' : '')} • Uploaded by {doc.uploaded_by || doc.uploader}</p>
                        {!canPreview && <p className="text-xs text-orange-600">⚠ File not available for preview</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{doc.created_at ? doc.created_at.split('T')[0] : doc.uploadDate}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleComment(doc)}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(doc)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
            <div className="border-b pb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Category:</strong> {commentingDoc?.category}</div>
                <div><strong>Size:</strong> {commentingDoc?.size}</div>
                <div><strong>Upload Date:</strong> {commentingDoc?.uploadDate}</div>
                <div><strong>Uploader:</strong> {commentingDoc?.uploader}</div>
              </div>
            </div>
            
            {/* Add Comment Section */}
            <div className="space-y-3">
              <Label htmlFor="newComment" className="text-sm font-medium">Add Comment</Label>
              <Textarea
                id="newComment"
                placeholder="Thanks for sharing this..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex space-x-2">
                <Button onClick={handleAddComment} className="bg-green-600 hover:bg-green-700">
                  Add Comment
                </Button>
                <Button variant="outline" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setCommentingDoc(null)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Comments List */}
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
                      {(user?.name === comment.user || user?.role === 'Admin') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 p-1 h-auto"
                          onClick={() => handleDeleteComment(commentingDoc.id, comment.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
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

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Viewing: {viewingDoc?.title || viewingDoc?.name}</span>
              {viewingDoc?.fileUrl && (
                <Button onClick={() => handleDownload(viewingDoc)} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div><strong>Category:</strong> {viewingDoc?.category}</div>
              <div><strong>Size:</strong> {viewingDoc?.file_size ? (viewingDoc.file_size / (1024*1024)).toFixed(2) + ' MB' : viewingDoc?.size}</div>
              <div><strong>Upload Date:</strong> {viewingDoc?.created_at ? viewingDoc.created_at.split('T')[0] : viewingDoc?.uploadDate}</div>
              <div><strong>Uploader:</strong> {viewingDoc?.uploaded_by || viewingDoc?.uploader}</div>
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
              <Label htmlFor="editName">Document Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Input
                id="editCategory"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showGoogleDocsWarning && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>
              Google Docs preview only works for publicly accessible files. Please deploy your app or use a public file URL.
            </span>
            <button
              className="ml-4 text-yellow-800 hover:text-yellow-600 font-bold"
              onClick={() => setShowGoogleDocsWarning(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { Documents };
