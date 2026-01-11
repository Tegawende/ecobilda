import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { notifications as mantineNotifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../services/notifications';
import { getAuthTokens, isAuthenticated } from '../services/api';
import type { Notification } from '../types';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  isConnected: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const navigate = useNavigate();

  // Fetch initial unread count and notifications
  const refreshCount = async () => {
    if (!isAuthenticated()) return;

    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const refreshNotifications = async () => {
    if (!isAuthenticated()) return;

    try {
      const notifs = await notificationsService.getNotifications(true, 'MESSAGE');
      setNotifications(notifs.slice(0, 10)); // Show only last 10
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await notificationsService.markAsRead(id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Setup WebSocket connection
  const connectWebSocket = () => {
    if (!isAuthenticated()) return;

    const tokens = getAuthTokens();
    if (!tokens?.access) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_API_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/notifications/?token=${tokens.access}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Notification WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'connection_established') {
          console.log('Notification connection established');
        } else if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        } else if (data.type === 'new_notification') {
          const newNotif: Notification = data.notification;

          // Add to notifications list
          setNotifications(prev => [newNotif, ...prev].slice(0, 10));

          // Update unread count
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          mantineNotifications.show({
            title: newNotif.title,
            message: newNotif.message,
            color: 'blue',
            autoClose: 5000,
            onClick: () => {
              navigate(newNotif.link_url);
              markAsRead(newNotif.id);
            },
            style: { cursor: 'pointer' },
          });
        } else if (data.type === 'notification_marked_read') {
          // WebSocket confirmation of mark as read
          console.log('Notification marked as read:', data.notification_id);
        }
      };

      ws.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('Notification WebSocket disconnected');
        setIsConnected(false);

        // Attempt reconnection with exponential backoff
        if (isAuthenticated()) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (attempt ${reconnectAttempts.current})`);
            connectWebSocket();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Initialize connection and fetch data
  useEffect(() => {
    if (isAuthenticated()) {
      refreshCount();
      refreshNotifications();
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    refreshCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
