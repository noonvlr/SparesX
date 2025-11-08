'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { apiClient } from './api-client';
import { useAuth } from './auth-context';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // Refs to prevent multiple simultaneous requests
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Throttled load function to prevent rapid successive calls
  const loadNotifications = useCallback(async (force = false) => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Prevent multiple simultaneous requests
    if (loadingRef.current && !force) {
      console.log('Notification load already in progress, skipping...');
      return;
    }

    // Throttle requests - minimum 5 seconds between loads
    const now = Date.now();
    if (!force && now - lastLoadTimeRef.current < 5000) {
      console.log('Notification load throttled, too soon since last load');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      lastLoadTimeRef.current = now;
      
      const response = await apiClient.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Don't show error to user for notifications, just log it
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications(true); // Force refresh
  }, [loadNotifications]);

  // Setup polling with better error handling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Initial load
    loadNotifications(true);

    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Set up polling with exponential backoff on errors
    let pollInterval = 30000; // Start with 30 seconds
    let consecutiveErrors = 0;

    const poll = () => {
      loadNotifications().catch((error) => {
        consecutiveErrors++;
        // Increase poll interval on consecutive errors
        pollInterval = Math.min(pollInterval * 1.5, 300000); // Max 5 minutes
        console.warn(`Notification polling error ${consecutiveErrors}, increasing interval to ${pollInterval}ms`);
      }).finally(() => {
        // Reset error count on successful load
        if (consecutiveErrors > 0) {
          consecutiveErrors = 0;
          pollInterval = 30000; // Reset to 30 seconds
        }
        
        // Schedule next poll
        pollIntervalRef.current = setTimeout(poll, pollInterval);
      });
    };

    // Start polling
    pollIntervalRef.current = setTimeout(poll, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, loadNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
