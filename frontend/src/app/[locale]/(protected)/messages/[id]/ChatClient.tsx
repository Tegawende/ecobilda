'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Group,
  Avatar,
  Text,
  Button,
  Textarea,
  Alert,
  Center,
  Stack,
  Loader,
  Paper,
} from '@mantine/core';
import {
  IconMessages,
  IconSend,
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { messagingService } from '@/services/messaging';
import { profileService } from '@/services/profile';
import { participationsService } from '@/services/participations';
import { useMessages } from '@/hooks/useConvex';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import type { Conversation, User } from '@/types';
import logger from '@/lib/logger';

export function ChatClient({ conversationId: propConversationId, noLayout = false }: { conversationId?: string; noLayout?: boolean }) {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const conversationId = propConversationId || id;
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [participationRequest, setParticipationRequest] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState('');

  // Real-time reactive messages from Convex
  const { messages } = useMessages(conversationId || null);

  // Fetch conversation metadata + current user + participation request (one-time)
  useEffect(() => {
    if (!conversationId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [conv, user] = await Promise.all([
          messagingService.getConversation(conversationId as any),
          profileService.getProfile(),
        ]);
        setConversation(conv);
        setCurrentUser(user);
        await messagingService.markAsRead(conversationId as any);

        // Fetch participation request if present
        if (conv?.participationRequestId) {
          try {
            const req = await participationsService.getParticipationById(conv.participationRequestId);
            setParticipationRequest(req);
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        logger.error('Failed to fetch conversation:', err);
        setError(t('messaging.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [conversationId, t]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when new messages come in
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      messagingService.markAsRead(conversationId as any).catch(() => {});
    }
  }, [messages.length, conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !conversation || !currentUser) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      await messagingService.sendMessage(conversation._id, { body: messageText });
    } catch (err) {
      logger.error('Failed to send message:', err);
      setError(t('messaging.sendError'));
      setMessageInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async () => {
    if (!participationRequest) return;
    setIsActing(true);
    try {
      await participationsService.acceptRequest(participationRequest._id);
      setParticipationRequest({ ...participationRequest, status: 'ACCEPTED' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleRefuse = async () => {
    if (!participationRequest) return;
    setIsActing(true);
    try {
      await participationsService.refuseRequest(participationRequest._id);
      setParticipationRequest({ ...participationRequest, status: 'REFUSED' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsActing(false);
    }
  };

  const otherUser = conversation?.otherUser;

  // Is the current user the host? (user1 = host in our convention)
  const isHost = conversation && currentUser
    ? (conversation as any).user1Id === currentUser._id
    : false;

  const isPendingRequest = participationRequest?.status === 'PENDING';

  if (isLoading) {
    const loadingContent = (
      <Center mih="80vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">{t('messaging.loading')}</Text>
        </Stack>
      </Center>
    );
    return noLayout ? loadingContent : <Layout>{loadingContent}</Layout>;
  }

  if (error) {
    const errorContent = (
      <Container size="md" py="xl">
        <Alert color="red" icon={<IconAlertCircle size={18} />} title={t('messaging.error')}>
          <Text mb="md">{error}</Text>
          <Button variant="subtle" onClick={() => router.push('/messages')}>
            {t('messaging.backToMessages')}
          </Button>
        </Alert>
      </Container>
    );
    return noLayout ? errorContent : <Layout>{errorContent}</Layout>;
  }

  if (!conversation || !otherUser || !currentUser) {
    return null;
  }

  const chatContent = (
    <Flex direction="column" style={{ height: noLayout ? '100%' : '100vh' }} bg="gray.0">
        {/* Header */}
        <Box bg="white" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Container size="md">
            <Group justify="space-between">
              <Group>
                {!noLayout && (
                  <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={18} />}
                    onClick={() => router.push('/messages')}
                    size="sm"
                  >
                    {t('common.back')}
                  </Button>
                )}

                <Avatar
                  src={otherUser?.profilePictureUrl || (otherUser as any)?.profilePicture}
                  size="md"
                  radius="xl"
                  color="blue"
                >
                  {`${otherUser?.firstName?.[0] || ''}${otherUser?.lastName?.[0] || ''}`}
                </Avatar>

                <Box>
                  <Text fw={600}>
                    {otherUser?.firstName} {otherUser?.lastName}
                  </Text>
                </Box>
              </Group>

              <Button
                variant="subtle"
                onClick={() => {
                  const profileId = (otherUser as any)?.publicId ?? otherUser._id;
                  router.push(`/users/${profileId}`);
                }}
              >
                {t('messaging.viewProfile')}
              </Button>
            </Group>
          </Container>
        </Box>

        {/* Accept/Refuse banner — shown to host when request is PENDING */}
        {isHost && isPendingRequest && (
          <Box bg="eco-primary.0" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-eco-primary-2)' }}>
            <Container size="md">
              <Group justify="space-between" wrap="nowrap">
                <Text size="sm" fw={500} c="eco-primary.8">
                  {t('messaging.pendingApplication', {
                    name: `${otherUser.firstName} ${otherUser.lastName}`,
                  })}
                </Text>
                <Group gap="sm" wrap="nowrap">
                  <Button
                    size="sm"
                    radius="xl"
                    color="red"
                    variant="light"
                    leftSection={<IconX size={14} />}
                    loading={isActing}
                    onClick={handleRefuse}
                  >
                    {t('messaging.refuse')}
                  </Button>
                  <Button
                    size="sm"
                    radius="xl"
                    color="eco-primary"
                    leftSection={<IconCheck size={14} />}
                    loading={isActing}
                    onClick={handleAccept}
                  >
                    {t('messaging.accept')}
                  </Button>
                </Group>
              </Group>
            </Container>
          </Box>
        )}

        {/* Accepted/Refused status banner */}
        {isHost && participationRequest && !isPendingRequest && (
          <Box
            bg={participationRequest.status === 'ACCEPTED' ? 'green.0' : 'red.0'}
            px="md"
            py="xs"
            style={{
              borderBottom: `1px solid var(--mantine-color-${participationRequest.status === 'ACCEPTED' ? 'green' : 'red'}-2)`,
            }}
          >
            <Container size="md">
              <Text size="sm" fw={500} c={participationRequest.status === 'ACCEPTED' ? 'green.8' : 'red.8'}>
                {participationRequest.status === 'ACCEPTED'
                  ? t('messaging.applicationAccepted')
                  : t('messaging.applicationRefused')}
              </Text>
            </Container>
          </Box>
        )}

        {/* Messages Container */}
        <Box style={{ flex: 1, overflowY: 'auto' }} px="md" py="xl">
          <Container size="md">
            {messages.length > 0 ? (
              <>
                {messages.map((message: any) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isOwnMessage={message.senderId === currentUser._id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <Center h="100%">
                <Stack align="center" gap="md" c="dimmed">
                  <IconMessages size={48} stroke={1.5} />
                  <Text>{t('messaging.noMessages')}</Text>
                </Stack>
              </Center>
            )}
          </Container>
        </Box>

        {/* Message Input */}
        <Box bg="white" px="md" py="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Container size="md">
            <form onSubmit={handleSendMessage}>
              <Group gap="sm">
                <Textarea
                  style={{ flex: 1 }}
                  placeholder={t('messaging.typeMessage')}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  minRows={1}
                  maxRows={4}
                  autosize
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  color="eco-primary"
                  radius="xl"
                  disabled={!messageInput.trim() || isSending}
                  loading={isSending}
                >
                  <IconSend size={18} />
                </Button>
              </Group>
            </form>
          </Container>
        </Box>
      </Flex>
  );

  return noLayout ? chatContent : <Layout>{chatContent}</Layout>;
}
