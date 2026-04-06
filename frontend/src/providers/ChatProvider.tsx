'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '@/types';

// Convex provides real-time messaging natively via reactive queries (useMessages, useConversations).
// This provider is kept for API compatibility but no longer manages WebSocket connections.

interface ChatContextType {
  isConnected: boolean;
  lastMessage: Message | null;
  sendMessage: (conversationId: string, body: string) => boolean;
  sendTyping: (conversationId: string) => void;
  sendStopTyping: (conversationId: string) => void;
  addMessageListener: (callback: (data: unknown) => void) => () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value: ChatContextType = useMemo(() => ({
    isConnected: false,
    lastMessage: null,
    sendMessage: () => false,
    sendTyping: () => {},
    sendStopTyping: () => {},
    addMessageListener: () => () => {},
  }), []);

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
