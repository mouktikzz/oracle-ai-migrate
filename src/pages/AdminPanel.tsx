import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Settings, 
  Activity, 
  FileText, 
  Shield, 
  BarChart3, 
  Trash2, 
  Edit,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile, SystemSetting, AdminLog, MigrationStats, SystemMetrics } from '@/types/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { 
    isAdmin, 
    loading, 
    getUsers, 
    updateUserRole, 
    deleteUser,
    getSystemSettings, 
    updateSystemSetting,
    getAdminLogs,
    getMigrationStats,
    getSystemMetrics
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [showSettingDialog, setShowSettingDialog] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/migration');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [usersData, settingsData, logsData, statsData, metricsData] = await Promise.allSettled([
        getUsers(),
        getSystemSettings(),
        getAdminLogs(),
        getMigrationStats(),
        getSystemMetrics()
      ]);

      setUsers(usersData.status === 'fulfilled' ? usersData.value : []);
      setSystemSettings(settingsData.status === 'fulfilled' ? settingsData.value : []);
      setAdminLogs(logsData.status === 'fulfilled' ? logsData.value : []);
      setMigrationStats(statsData.status === 'fulfilled' ? statsData.value : null);
      setSystemMetrics(metricsData.status === 'fulfilled' ? metricsData.value : null);

      // Log any errors for debugging
      if (usersData.status === 'rejected') console.error('Users error:', usersData.reason);
      if (settingsData.status === 'rejected') console.error('Settings error:', settingsData.reason);
      if (logsData.status === 'rejected') console.error('Logs error:', logsData.reason);
      if (statsData.status === 'rejected') console.error('Stats error:', statsData.reason);
      if (metricsData.status === 'rejected') console.error('Metrics error:', metricsData.reason);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleUserRoleUpdate = async (userId: string, role: 'user' | 'admin' | 'moderator') => {
    const success = await updateUserRole(userId, role);
    if (success) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;
    
    const success = await deleteUser(selectedUser.id);
    if (success) {
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSettingUpdate = async (settingKey: string, settingValue: any) => {
    const success = await updateSystemSetting(settingKey, settingValue);
    if (success) {
      setSystemSettings(settings => 
        settings.map(setting => 
          setting.setting_key === settingKey 
            ? { ...setting, setting_value: settingValue }
            : setting
        )
      );
      setShowSettingDialog(false);
      setEditingSetting(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/migration')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">System administration and monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {profile?.role || 'Admin'}
              </Badge>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{migrationStats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {migrationStats?.active_users_today || 0} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Migrations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{migrationStats?.total_migrations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {migrationStats?.total_files || 0} files processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {migrationStats?.total_files 
                      ? Math.round((migrationStats.successful_conversions / migrationStats.total_files) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {migrationStats?.successful_conversions || 0} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemMetrics?.cpu_usage ? Math.round(systemMetrics.cpu_usage) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CPU Usage
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{log.target_type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>{systemMetrics?.cpu_usage ? Math.round(systemMetrics.cpu_usage) : 0}%</span>
                      </div>
                      <Progress value={systemMetrics?.cpu_usage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{systemMetrics?.memory_usage ? Math.round(systemMetrics.memory_usage) : 0}%</span>
                      </div>
                      <Progress value={systemMetrics?.memory_usage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cache Hit Rate</span>
                        <span>{systemMetrics?.cache_hit_rate ? Math.round(systemMetrics.cache_hit_rate) : 0}%</span>
                      </div>
                      <Progress value={systemMetrics?.cache_hit_rate || 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(role) => handleUserRoleUpdate(user.id, role as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                {/* Only show admin option if current user is admin and target user is not admin */}
                                {profile?.role === 'admin' && user.role !== 'admin' && (
                                  <SelectItem value="admin">Admin</SelectItem>
                                )}
                                {/* Show admin option if current user is admin and target user is admin (for demotion) */}
                                {profile?.role === 'admin' && user.role === 'admin' && (
                                  <SelectItem value="admin">Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Only show delete button for admins */}
                            {profile?.role === 'admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {systemSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{setting.setting_key}</h3>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {JSON.stringify(setting.setting_value)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingSetting(setting);
                          setShowSettingDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  View all administrative actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.admin_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.target_type}</p>
                            {log.target_id && (
                              <p className="text-xs text-muted-foreground">{log.target_id}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.details && (
                            <pre className="text-xs bg-gray-100 p-1 rounded">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>{systemMetrics?.cpu_usage ? Math.round(systemMetrics.cpu_usage) : 0}%</span>
                      </div>
                      <Progress value={systemMetrics?.cpu_usage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{systemMetrics?.memory_usage ? Math.round(systemMetrics.memory_usage) : 0}%</span>
                      </div>
                      <Progress value={systemMetrics?.memory_usage || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disk Usage</span>
                        <span>{systemMetrics?.disk_usage ? Math.round(systemMetrics.disk_usage) : 0}%</span>
                      </div>
                      <Progress value={systemMetrics?.disk_usage || 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Active Conversions</span>
                      <span className="font-medium">{systemMetrics?.active_conversions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue Length</span>
                      <span className="font-medium">{systemMetrics?.queue_length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Hit Rate</span>
                      <span className="font-medium">{systemMetrics?.cache_hit_rate ? Math.round(systemMetrics.cache_hit_rate) : 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time</span>
                      <span className="font-medium">{systemMetrics?.average_response_time ? Math.round(systemMetrics.average_response_time) : 0}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete user "{selectedUser?.full_name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUserDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingDialog} onOpenChange={setShowSettingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting: {editingSetting?.setting_key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Value</Label>
              <Input
                value={JSON.stringify(editingSetting?.setting_value)}
                onChange={(e) => {
                  try {
                    const value = JSON.parse(e.target.value);
                    setEditingSetting(prev => prev ? { ...prev, setting_value: value } : null);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder="Enter JSON value"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {editingSetting?.description}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingSetting) {
                  handleSettingUpdate(editingSetting.setting_key, editingSetting.setting_value);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel; 