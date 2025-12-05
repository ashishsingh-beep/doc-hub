import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, FolderOpen, Calendar, Settings, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { statsAPI, usersAPI, documentsAPI } from '../services/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalUsers: 0,
    totalCategories: 0,
    recentUploads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notifications') !== 'off');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    setLoading(true);
    statsAPI.getStats()
      .then(res => {
        if (res.data.success) {
          setStats(res.data.stats);
        } else {
          setError('Failed to fetch stats');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch stats');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    documentsAPI.getDocuments()
      .then(res => {
        if (res.data.success) {
          setDocuments(res.data.documents);
        }
      });
  }, []);

  const statsCards = [
    { title: 'Total Documents', value: stats.totalDocuments, icon: FileText, color: 'bg-blue-500' },
    { title: 'Active Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500' },
    { title: 'Categories', value: stats.totalCategories, icon: FolderOpen, color: 'bg-purple-500' },
    { title: 'Recent Uploads', value: stats.recentUploads, icon: Calendar, color: 'bg-orange-500' },
  ];

  const handleDocumentClick = (doc) => {
    setViewingDoc(doc);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'All password fields are required', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    try {
      await usersAPI.changePassword(user.id, oldPassword, newPassword);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Success', description: 'Password changed successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to change password', variant: 'destructive' });
    }
  };

  const handleNotifToggle = () => {
    setNotifEnabled((prev) => {
      localStorage.setItem('notifications', prev ? 'off' : 'on');
      return !prev;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Welcome back, {user?.name || 'User'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleDocumentClick(doc)}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.title || doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.category} • {(doc.file_size ? (doc.file_size / (1024*1024)).toFixed(2) + ' MB' : '')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{doc.created_at ? doc.created_at.split('T')[0] : ''}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDocumentClick(doc);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Viewing: {viewingDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div><strong>Category:</strong> {viewingDoc?.category}</div>
              <div><strong>Size:</strong> {viewingDoc?.size}</div>
              <div><strong>Upload Date:</strong> {viewingDoc?.uploadDate}</div>
            </div>
            <div className="bg-gray-100 p-8 rounded-lg text-center min-h-[400px] flex items-center justify-center">
              <div>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">File preview not available</p>
                <p className="text-sm text-gray-500 mt-2">This is a sample document from the dashboard</p>
                <p className="text-xs text-blue-600 mt-2">To view actual files, please upload them in the Documents section</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Dashboard };
