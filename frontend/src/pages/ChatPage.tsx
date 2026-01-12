import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Group,
  Avatar,
  Text,
  Button,
  Textarea,
  Alert,
  Center,
  Stack,
  Loader,
} from '@mantine/core';
import {
  IconMessages,
  IconSend,
  IconArrowLeft,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Layout } from '../components/common/Layout';
import { messagingService } from '../services/messaging';
import { profileService } from '../services/profile';
import { MessageBubble } from '../components/messaging/MessageBubble';
import type { Conversation, Message, User } from '../types';
import logger from '../utils/logger';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!conversation || !currentUser) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_API_URL?.replace('http://', '').replace('https://', '') || 'localhost:8000';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${conversation.id}/?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.ws('connected', 'Chat');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'new_message') {
          setMessages((prev) => [...prev, data.message]);

          if (data.message.sender.id !== currentUser.id) {
            messagingService.markAsRead(conversation.id).catch(err => logger.error('Mark as read error:', err));
          }
        } else if (data.type === 'typing_indicator') {
          if (data.user_id !== currentUser.id) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
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

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [conv, msgs, user] = await Promise.all([
        messagingService.getConversation(parseInt(id)),
        messagingService.getMessages(parseInt(id)),
        profileService.getProfile(),
      ]);
      setConversation(conv);
      setMessages(msgs);
      setCurrentUser(user);

      await messagingService.markAsRead(parseInt(id));
    } catch (err: any) {
      logger.error('Failed to fetch conversation:', err);
      if (err.response?.status === 404) {
        // If conversation not found, try to create one with the ID as recipient_id
        // This handles the case where someone navigated with a user ID instead of conversation ID
        try {
          const conversation = await messagingService.getOrCreateConversation(parseInt(id));
          // Update URL to use conversation ID
          navigate(`/messages/${conversation.id}`, { replace: true });
          // Recursively fetch data with the correct conversation ID
          return;
        } catch (createErr: any) {
          logger.error('Failed to create conversation:', createErr);
          // If it's a 400 or 500 error, the conversation might already exist
          // Try to fetch it again or show a more helpful error message
          if (createErr.response?.status === 400 || createErr.response?.status === 500) {
            // The conversation might have been created by another request
            // Try to fetch conversations list and find the one with this user
            try {
              const conversations = await messagingService.getConversations();
              // Find conversation where the other user is the one we're trying to contact
              const conversation = conversations.find(
                (c) => c.user1.id === parseInt(id) || c.user2.id === parseInt(id)
              );
              if (conversation) {
                navigate(`/messages/${conversation.id}`, { replace: true });
                return;
              }
            } catch (fetchErr) {
              logger.error('Failed to fetch conversations:', fetchErr);
            }
          }
          setError(
            createErr.response?.data?.detail ||
            createErr.response?.data?.recipient_id?.[0] ||
            'Conversation not found and could not be created'
          );
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to load conversation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendTypingIndicator = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing_indicator',
          user_id: currentUser?.id,
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
        wsRef.current.send(
          JSON.stringify({
            type: 'send_message',
            body: messageText,
            sender_id: currentUser.id,
          })
        );
      } else {
        const newMessage = await messagingService.sendMessage(conversation.id, {
          body: messageText,
        });
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (err) {
      logger.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
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
      <Layout>
        <Center mih="80vh">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading conversation...</Text>
          </Stack>
        </Center>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container size="md" py="xl">
          <Alert color="red" icon={<IconAlertCircle size={18} />} title="Error">
            <Text mb="md">{error}</Text>
            <Button variant="subtle" onClick={() => navigate('/messages')}>
              Back to messages
            </Button>
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (!conversation || !otherUser || !currentUser) {
    return null;
  }

  return (
    <Layout>
      <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh' }} bg="gray.0">
        {/* Header */}
        <Box bg="white" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Container size="md">
            <Group justify="space-between">
              <Group>
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={() => navigate('/messages')}
                  hiddenFrom="sm"
                  size="sm"
                >
                  Back
                </Button>

                <Avatar
                  src={otherUser.profile_picture}
                  size="md"
                  radius="xl"
                  color="blue"
                >
                  {!otherUser.profile_picture &&
                    `${otherUser.first_name[0]}${otherUser.last_name[0]}`}
                </Avatar>

                <Box>
                  <Text fw={600}>
                    {otherUser.first_name} {otherUser.last_name}
                  </Text>
                  <Text size="xs" c={isConnected ? 'green' : 'dimmed'}>
                    {isConnected ? '● Online' : '○ Offline'}
                  </Text>
                </Box>
              </Group>

              <Button variant="subtle" onClick={() => navigate(`/users/${otherUser.id}`)}>
                View Profile
              </Button>
            </Group>
          </Container>
        </Box>

        {/* Messages Container */}
        <Box style={{ flex: 1, overflowY: 'auto' }} px="md" py="xl">
          <Container size="md">
            {messages.length > 0 ? (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender.id === currentUser.id}
                  />
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <Group gap="xs" mb="md" c="dimmed">
                    <Text size="sm">●</Text>
                    <Text size="sm">●</Text>
                    <Text size="sm">●</Text>
                    <Text size="sm">{otherUser.first_name} is typing...</Text>
                  </Group>
                )}

                <div ref={messagesEndRef} />
              </>
            ) : (
              <Center py={48}>
                <Stack align="center" gap="md">
                  <IconMessages size={64} color="var(--mantine-color-blue-6)" />
                  <Text c="dimmed">No messages yet. Start the conversation!</Text>
                </Stack>
              </Center>
            )}
          </Container>
        </Box>

        {/* Message Input */}
        <Box bg="white" px="md" py="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Container size="md">
            <form onSubmit={handleSendMessage}>
              <Group align="flex-end" gap="sm">
                <Textarea
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  minRows={1}
                  maxRows={4}
                  autosize
                  disabled={isSending}
                  style={{ flex: 1 }}
                />
                <Button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  loading={isSending}
                  leftSection={<IconSend size={18} />}
                >
                  Send
                </Button>
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                Press Enter to send, Shift+Enter for new line
              </Text>
            </form>
          </Container>
        </Box>
      </Box>
    </Layout>
  );
}
