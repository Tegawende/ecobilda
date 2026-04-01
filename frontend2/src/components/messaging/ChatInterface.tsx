'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Group,
  Avatar,
  Text,
  Button,
  Textarea,
  Center,
  Stack,
  ActionIcon,
} from '@mantine/core';
import {
  IconMessages,
  IconSend,
  IconPaperclip,
} from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { messagingService } from '@/services/messaging';
import { profileService } from '@/services/profile';
import { MessageBubble } from './MessageBubble';
import { useChat } from '@/providers/ChatProvider';
import type { Conversation, Message, User } from '@/types';
import logger from '@/lib/logger';

interface ChatInterfaceProps {
  conversationId: number;
  onConversationUpdate?: (conversation: Conversation) => void;
}

export function ChatInterface({ conversationId, onConversationUpdate }: ChatInterfaceProps) {
  const t = useTranslations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage: wsSendMessage, sendTyping, addMessageListener } = useChat();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Subscribe to chat events from the global ChatProvider
  useEffect(() => {
    if (!conversation || !currentUser) return;

    const unsubscribe = addMessageListener((data) => {
      if (data.type === 'new_message' || data.type === 'message_sent') {
        const newMessage = data.message;
        if (!newMessage) return;

        // Only add if message is for this conversation
        if (newMessage.conversation === conversation.id) {
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          // Mark as read if it's from the other user
          if (newMessage.sender.id !== currentUser.id) {
            messagingService.markAsRead(conversation.id).catch(err => logger.error('Mark as read error:', err));
          }
        }
      } else if (data.type === 'typing') {
        if (data.user_id !== currentUser.id && data.conversation_id === conversation.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      } else if (data.type === 'stop_typing') {
        if (data.user_id !== currentUser.id) {
          setIsTyping(false);
        }
      }
    });

    return unsubscribe;
  }, [conversation, currentUser, addMessageListener]);

  // Fetch conversation data
  useEffect(() => {
    fetchData();
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [conv, msgs, user] = await Promise.all([
        messagingService.getConversation(conversationId),
        messagingService.getMessages(conversationId),
        profileService.getProfile(),
      ]);
      setConversation(conv);
      setMessages(msgs);
      setCurrentUser(user);

      if (onConversationUpdate) {
        onConversationUpdate(conv);
      }

      await messagingService.markAsRead(conversationId);
    } catch (err) {
      logger.error('Failed to fetch conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !conversation || !currentUser) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      // Try WebSocket first, fall back to REST
      const sentViaWs = wsSendMessage(conversation.id, messageText);

      if (!sentViaWs) {
        // Fallback to REST API
        const newMessage = await messagingService.sendMessage(conversation.id, {
          body: messageText,
        });
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (err) {
      logger.error('Failed to send message:', err);
      setMessageInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    if (conversation) {
      sendTyping(conversation.id);
    }
  };

  // Determine other user
  const otherUser = conversation
    ? currentUser?.id === conversation.user1.id
      ? conversation.user2
      : conversation.user1
    : null;

  if (isLoading) {
    return (
      <Box display="flex" style={{ flexDirection: 'column', height: '100%' }}>
        <Center style={{ flex: 1 }}>
          <Text c="dimmed">{t('messaging.loading')}</Text>
        </Center>
      </Box>
    );
  }

  if (!conversation || !otherUser || !currentUser) {
    return (
      <Box display="flex" style={{ flexDirection: 'column', height: '100%' }}>
        <Center style={{ flex: 1 }}>
          <Stack align="center" gap="md">
            <IconMessages size={64} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed">{t('messaging.selectConversationDesc')}</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  return (
    <Box display="flex" bg="white" style={{ flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        px="lg"
        py="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <Avatar
              src={otherUser.profile_picture}
              size={40}
              radius="xl"
              color="blue"
            >
              {!otherUser.profile_picture &&
                `${otherUser.first_name[0]}${otherUser.last_name[0]}`}
            </Avatar>

            <Box>
              <Text fw={600} size="sm">
                {otherUser.first_name} {otherUser.last_name}
              </Text>
              <Text size="xs" c={isConnected ? 'green' : 'dimmed'}>
                {isConnected ? t('messaging.online') : t('messaging.offline')}
              </Text>
            </Box>
          </Group>
        </Group>
      </Box>

      {/* Messages Area */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
        bg="gray.0"
        p="lg"
      >
        {messages.length > 0 ? (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender.id === currentUser.id}
                showAvatar={
                  index === 0 ||
                  messages[index - 1].sender.id !== message.sender.id
                }
              />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <Group gap="xs" mb="md" ml="sm">
                <Avatar size={24} radius="xl" color="gray">
                  {otherUser.first_name[0]}
                </Avatar>
                <Box
                  px="sm"
                  py="xs"
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <Text size="sm" c="dimmed">
                    {t('messaging.typing', { name: otherUser.first_name })}
                  </Text>
                </Box>
              </Group>
            )}

            <div ref={messagesEndRef} />
          </>
        ) : (
          <Center py={48}>
            <Stack align="center" gap="md">
              <IconMessages size={64} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed">{t('messaging.noMessagesYet')}</Text>
            </Stack>
          </Center>
        )}
      </Box>

      {/* Message Input */}
      <Box
        px="lg"
        py="md"
        bg="white"
        style={{
          borderTop: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <form onSubmit={handleSendMessage}>
          <Group align="flex-start" gap="sm" wrap="nowrap">
            <ActionIcon variant="subtle" size="lg" color="gray" mt={8}>
              <IconPaperclip size={20} />
            </ActionIcon>

            <Textarea
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={t('messaging.writePlaceholder')}
              minRows={1}
              maxRows={4}
              autosize
              disabled={isSending}
              style={{
                flex: 1,
              }}
              styles={{
                input: {
                  borderRadius: 24,
                  padding: '12px 16px',
                },
              }}
            />

            <Button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              loading={isSending}
              radius="xl"
              size="md"
              mt={4}
            >
              <IconSend size={18} />
            </Button>
          </Group>
        </form>
      </Box>
    </Box>
  );
}
