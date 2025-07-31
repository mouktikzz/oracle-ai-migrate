import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLog, SystemSetting, UserProfile, MigrationStats, SystemMetrics } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setIsAdmin(false);
        return;
      }

      console.log('Checking admin status for user:', user.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setIsAdmin(false);
        return;
      }

      console.log('User role:', profile?.role);
      const isAdminUser = profile?.role === 'admin' || profile?.role === 'moderator';
      console.log('Is admin:', isAdminUser);
      setIsAdmin(isAdminUser);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const getUsers = async (): Promise<UserProfile[]> => {
    console.log('Fetching all users...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      return [];
    }

    console.log('Fetched users:', data);
    console.log('Number of users:', data?.length || 0);
    return data || [];
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'moderator') => {
    // Get current user's profile to check their role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return false;
    }

    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Prevent users from changing their own role
    if (userId === user.id) {
      toast({
        title: "Error",
        description: "You cannot change your own role",
        variant: "destructive",
      });
      return false;
    }

    // Prevent moderators from changing admin roles
    if (currentUserProfile?.role === 'moderator') {
      const { data: targetUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (targetUserProfile?.role === 'admin') {
        toast({
          title: "Error",
          description: "Moderators cannot change admin roles",
          variant: "destructive",
        });
        return false;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
      return false;
    }

    await logAdminAction('user_management', 'update_user_role', userId, { role });
    toast({
      title: "Success",
      description: "User role updated successfully",
    });
    return true;
  };

  const getSystemSettings = async (): Promise<SystemSetting[]> => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive",
      });
      return [];
    }

    return data || [];
  };

  const updateSystemSetting = async (settingKey: string, settingValue: any) => {
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: settingValue,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', settingKey);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update system setting",
        variant: "destructive",
      });
      return false;
    }

    await logAdminAction('system_settings', 'update_setting', settingKey, { settingValue });
    toast({
      title: "Success",
      description: "System setting updated successfully",
    });
    return true;
  };

  const getAdminLogs = async (limit = 100): Promise<AdminLog[]> => {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Admin logs error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin logs",
        variant: "destructive",
      });
      return [];
    }

    return data || [];
  };

  const logAdminAction = async (
    targetType: string,
    action: string,
    targetId?: string,
    details?: any
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      });
  };

  const getMigrationStats = async (): Promise<MigrationStats> => {
    const { data: migrations } = await supabase
      .from('migrations')
      .select('id');

    const { data: files } = await supabase
      .from('migration_files')
      .select('conversion_status');

    const { data: users } = await supabase
      .from('profiles')
      .select('created_at');

    const totalMigrations = migrations?.length || 0;
    const totalFiles = files?.length || 0;
    const successfulConversions = files?.filter(f => f.conversion_status === 'success').length || 0;
    const failedConversions = files?.filter(f => f.conversion_status === 'failed').length || 0;
    const pendingConversions = files?.filter(f => f.conversion_status === 'pending').length || 0;
    const totalUsers = users?.length || 0;

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsersToday = users?.filter(u => new Date(u.created_at) >= today).length || 0;
    const activeUsersWeek = users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0;
    const activeUsersMonth = users?.filter(u => new Date(u.created_at) >= monthAgo).length || 0;

    return {
      total_migrations: totalMigrations,
      total_files: totalFiles,
      successful_conversions: successfulConversions,
      failed_conversions: failedConversions,
      pending_conversions: pendingConversions,
      total_users: totalUsers,
      active_users_today: activeUsersToday,
      active_users_week: activeUsersWeek,
      active_users_month: activeUsersMonth,
    };
  };

  const getSystemMetrics = async (): Promise<SystemMetrics> => {
    // Mock system metrics - in a real implementation, these would come from your server
    return {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      active_conversions: Math.floor(Math.random() * 10),
      queue_length: Math.floor(Math.random() * 50),
      cache_hit_rate: Math.random() * 100,
      average_response_time: Math.random() * 2000,
    };
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
      return false;
    }

    await logAdminAction('user_management', 'delete_user', userId);
    toast({
      title: "Success",
      description: "User deleted successfully",
    });
    return true;
  };

  return {
    isAdmin,
    loading,
    getUsers,
    updateUserRole,
    deleteUser,
    getSystemSettings,
    updateSystemSetting,
    getAdminLogs,
    logAdminAction,
    getMigrationStats,
    getSystemMetrics,
    checkAdminStatus,
  };
}; 