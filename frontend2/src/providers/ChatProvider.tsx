'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import logger from '@/lib/logger';
import { getAuthTokens } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';
import type { Message } from '@/types';

interface ChatContextType {
  /** Whether the chat WebSocket is connected */
  isConnected: boolean;
  /** Last message received via WebSocket (for any conversation) */
  lastMessage: Message | null;
  /** Send a message via WebSocket */
  sendMessage: (conversationId: number, body: string) => boolean;
  /** Send typing indicator */
  sendTyping: (conversationId: number) => void;
  /** Send stop typing indicator */
  sendStopTyping: (conversationId: number) => void;
  /** Register a listener for incoming messages */
  addMessageListener: (callback: ChatMessageListener) => () => void;
}

type ChatMessageListener = (data: ChatEvent) => void;

interface ChatEvent {
  type: 'new_message' | 'message_sent' | 'typing' | 'stop_typing' | 'connection_established' | 'error';
  message?: Message;
  conversation_id?: number;
  user_id?: number;
  user_name?: string;
  error?: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isConnecting = useRef(false);
  const listenersRef = useRef<Set<ChatMessageListener>>(new Set());

  const addMessageListener = useCallback((callback: ChatMessageListener) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const notifyListeners = useCallback((data: ChatEvent) => {
    listenersRef.current.forEach(listener => {
      try {
        listener(data);
      } catch (err) {
        logger.error('Chat listener error:', err);
      }
    });
  }, []);

  const sendMessage = useCallback((conversationId: number, body: string): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        body,
      }));
      return true;
    }
    return false;
  }, []);

  const sendTyping = useCallback((conversationId: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
      }));
    }
  }, []);

  const sendStopTyping = useCallback((conversationId: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_typing',
        conversation_id: conversationId,
      }));
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated) return;

    if (isConnecting.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    const tokens = getAuthTokens();
    if (!tokens?.access) return;

    isConnecting.current = true;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace('/api', '');
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/?token=${tokens.access}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.ws('connected', 'Chat WebSocket');
        isConnecting.current = false;
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'new_message' || data.type === 'message_sent') {
          if (data.message) {
            setLastMessage(data.message);
          }
        }

        // Notify all registered listeners
        notifyListeners(data);
      };

      ws.onerror = () => {
        logger.debug('Chat WebSocket connection failed (backend may not support WebSocket)');
        isConnecting.current = false;
        setIsConnected(false);
      };

      ws.onclose = () => {
        logger.ws('disconnected', 'Chat WebSocket');
        isConnecting.current = false;
        setIsConnected(false);

        // Reconnect with exponential backoff (max 5 attempts)
        if (isAuthenticated && reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            logger.log(`Chat WebSocket reconnecting... (attempt ${reconnectAttempts.current})`);
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= 5) {
          logger.log('Chat WebSocket: max reconnection attempts reached');
        }
      };
    } catch (error) {
      logger.error('Error creating Chat WebSocket:', error);
      isConnecting.current = false;
      setIsConnected(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, notifyListeners]);

  useEffect(() => {
    if (isAuthenticated) {
      connectWebSocket();
    } else {
      setIsConnected(false);
      setLastMessage(null);
      if (wsRef.current) wsRef.current.close();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value: ChatContextType = useMemo(() => ({
    isConnected,
    lastMessage,
    sendMessage,
    sendTyping,
    sendStopTyping,
    addMessageListener,
  }), [isConnected, lastMessage, sendMessage, sendTyping, sendStopTyping, addMessageListener]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
