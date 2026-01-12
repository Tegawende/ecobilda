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
import { messagingService } from '../../services/messaging';
import { profileService } from '../../services/profile';
import { MessageBubble } from './MessageBubble';
import { getAuthTokens } from '../../services/api';
import type { Conversation, Message, User } from '../../types';
import logger from '../../utils/logger';

interface ChatInterfaceProps {
  conversationId: number;
  onConversationUpdate?: (conversation: Conversation) => void;
}

export function ChatInterface({ conversationId, onConversationUpdate }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch conversation data
  useEffect(() => {
    fetchData();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!conversation || !currentUser) return;

    const tokens = getAuthTokens();
    if (!tokens?.access) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_API_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/?token=${tokens.access}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.ws('connected', 'Chat');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'connection_established') {
          logger.ws('established', 'Chat connection');
        } else if (data.type === 'new_message' || data.type === 'message_sent') {
          const newMessage = data.message;

          // Only add if message is for this conversation
          if (newMessage.conversation === conversation.id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) {
                return prev;
              }
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
      };

      ws.onerror = (error) => {
        logger.error('Chat WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        logger.ws('disconnected', 'Chat');
        setIsConnected(false);
      };
    } catch (err) {
      logger.error('Failed to create Chat WebSocket:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversation, currentUser]);

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

      // Notify parent component of conversation update
      if (onConversationUpdate) {
        onConversationUpdate(conv);
      }

      // Mark as read
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

  const sendTypingIndicator = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && conversation) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          conversation_id: conversation.id,
        })
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !conversation || !currentUser) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send via WebSocket
        wsRef.current.send(
          JSON.stringify({
            type: 'send_message',
            conversation_id: conversation.id,
            body: messageText,
          })
        );
      } else {
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
    sendTypingIndicator();
  };

  // Determine other user
  const otherUser = conversation
    ? currentUser?.id === conversation.user1.id
      ? conversation.user2
      : conversation.user1
    : null;

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Center style={{ flex: 1 }}>
          <Text c="dimmed">Loading conversation...</Text>
        </Center>
      </Box>
    );
  }

  if (!conversation || !otherUser || !currentUser) {
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Center style={{ flex: 1 }}>
          <Stack align="center" gap="md">
            <IconMessages size={64} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed">Select a conversation to start messaging</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
      {/* Header */}
      <Box
        px="lg"
        py="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'white',
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
                {isConnected ? '● Online' : '○ Offline'}
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
          backgroundColor: '#f7f7f7',
          padding: '20px',
        }}
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
                  style={{
                    padding: '8px 12px',
                    borderRadius: '16px',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <Text size="sm" c="dimmed">
                    {otherUser.first_name} is typing...
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
              <Text c="dimmed">No messages yet. Start the conversation!</Text>
            </Stack>
          </Center>
        )}
      </Box>

      {/* Message Input */}
      <Box
        px="lg"
        py="md"
        style={{
          borderTop: '1px solid #e0e0e0',
          backgroundColor: 'white',
        }}
      >
        <form onSubmit={handleSendMessage}>
          <Group align="flex-start" gap="sm" wrap="nowrap">
            <ActionIcon variant="subtle" size="lg" color="gray" style={{ marginTop: 8 }}>
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
              placeholder="Write a message..."
              minRows={1}
              maxRows={4}
              autosize
              disabled={isSending}
              style={{
                flex: 1,
              }}
              styles={{
                input: {
                  borderRadius: '24px',
                  border: '1px solid #e0e0e0',
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
              style={{ marginTop: 4 }}
            >
              <IconSend size={18} />
            </Button>
          </Group>
        </form>
      </Box>
    </Box>
  );
}
