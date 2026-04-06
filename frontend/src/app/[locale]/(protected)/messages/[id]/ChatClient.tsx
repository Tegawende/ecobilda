'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
  ActionIcon,
  Drawer,
  CloseButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconMessages,
  IconSend,
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconPhoto,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { messagingService } from '@/services/messaging';
import { profileService } from '@/services/profile';
import { participationsService } from '@/services/participations';
import { useMessages, useConversation } from '@/hooks/useConvex';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { ConversationDetails } from '@/components/messaging/ConversationDetails';
import type { User } from '@/types';
import logger from '@/lib/logger';
import dayjs from 'dayjs';

// ============================================
// Date separator component
// ============================================
function DateSeparator({ label }: { label: string }) {
  return (
    <Box style={{ display: 'flex', justifyContent: 'center' }} my="md">
      <Text
        size="xs"
        c="dimmed"
        px="sm"
        py={2}
        style={{ backgroundColor: '#f0f0f0', borderRadius: 12 }}
      >
        {label}
      </Text>
    </Box>
  );
}

function getDateLabel(timestamp: number, locale: string, t: any): string {
  const msgDay = dayjs(timestamp).startOf('day');
  const today = dayjs().startOf('day');
  const yesterday = dayjs().subtract(1, 'day').startOf('day');

  if (msgDay.isSame(today)) return t('messaging.today');
  if (msgDay.isSame(yesterday)) return t('messaging.yesterday');
  return msgDay.toDate().toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ChatClient({ conversationId: propConversationId, noLayout = false }: { conversationId?: string; noLayout?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const conversationId = propConversationId || id;
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState('');

  // Image upload state
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Mobile details drawer
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);

  // Reactive conversation from Convex (replaces one-shot fetch)
  const { conversation, isLoading: convLoading } = useConversation(conversationId || null);

  // Real-time reactive messages from Convex
  const { messages } = useMessages(conversationId || null);

  // Fetch current user (one-time)
  useEffect(() => {
    profileService.getProfile()
      .then(setCurrentUser)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Mark conversation as read on open and when new messages arrive
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      messagingService.markAsRead(conversationId as any).catch(() => {});
    }
  }, [messages.length, conversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle image file selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    const url = URL.createObjectURL(file);
    setPendingImagePreview(url);
    // Reset file input so same file can be selected again
    e.target.value = '';
  }, []);

  const clearPendingImage = useCallback(() => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  }, [pendingImagePreview]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !pendingImage) || !conversation || !currentUser) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      let imageStorageId: string | undefined;

      if (pendingImage) {
        setIsUploadingImage(true);
        try {
          const uploadUrl = await messagingService.generateMessageUploadUrl(conversation._id);
          const uploadResult = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': pendingImage.type },
            body: pendingImage,
          });
          const uploadData = await uploadResult.json();
          imageStorageId = uploadData.storageId;
        } finally {
          setIsUploadingImage(false);
          clearPendingImage();
        }
      }

      await messagingService.sendMessage(conversation._id, { body: messageText, imageStorageId });
    } catch (err) {
      logger.error('Failed to send message:', err);
      setError(pendingImage ? t('messaging.imageSendError') : t('messaging.sendError'));
      setMessageInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async () => {
    if (!conversation?.participationRequestId) return;
    setIsActing(true);
    try {
      await participationsService.acceptRequest(conversation.participationRequestId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleRefuse = async () => {
    if (!conversation?.participationRequestId) return;
    setIsActing(true);
    try {
      await participationsService.refuseRequest(conversation.participationRequestId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsActing(false);
    }
  };

  const otherUser = conversation?.otherUser;
  const isHost = conversation && currentUser
    ? (conversation as any).user1Id === currentUser._id
    : false;

  const participationStatus = conversation?.participationDetails?.status ?? null;
  const isPendingRequest = participationStatus === 'PENDING';

  // Read receipt: find the last message sent by current user that the other user has read
  const otherUserLastReadAt = conversation && currentUser
    ? ((conversation as any).user1Id === currentUser._id
        ? (conversation as any).user2LastReadAt
        : (conversation as any).user1LastReadAt)
    : null;

  const lastSeenMessageId = otherUserLastReadAt && messages.length > 0
    ? [...messages]
        .reverse()
        .find(
          (m: any) => m.senderId === currentUser?._id && (m._creationTime ?? 0) <= otherUserLastReadAt
        )?._id ?? null
    : null;

  if (isLoading || convLoading) {
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
      <Box bg="white" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}>
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

            {/* Mobile details button */}
            <ActionIcon
              variant="subtle"
              color="gray"
              hiddenFrom="md"
              onClick={openDetails}
              aria-label={t('messaging.openDetails')}
            >
              <IconInfoCircle size={20} />
            </ActionIcon>
          </Group>
        </Container>
      </Box>

      {/* Accept/Refuse banner — shown to host when request is PENDING */}
      {isHost && isPendingRequest && (
        <Box bg="eco-primary.0" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-eco-primary-2)', flexShrink: 0 }}>
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
      {isHost && participationStatus && !isPendingRequest && (
        <Box
          bg={participationStatus === 'ACCEPTED' ? 'green.0' : 'red.0'}
          px="md"
          py="xs"
          style={{
            borderBottom: `1px solid var(--mantine-color-${participationStatus === 'ACCEPTED' ? 'green' : 'red'}-2)`,
            flexShrink: 0,
          }}
        >
          <Container size="md">
            <Text size="sm" fw={500} c={participationStatus === 'ACCEPTED' ? 'green.8' : 'red.8'}>
              {participationStatus === 'ACCEPTED'
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
              {messages.map((message: any, index: number) => {
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const showDateSeparator = !prevMessage ||
                  !dayjs(message._creationTime).isSame(dayjs(prevMessage._creationTime), 'day');

                return (
                  <Box key={message._id}>
                    {showDateSeparator && (
                      <DateSeparator
                        label={getDateLabel(message._creationTime, locale, t)}
                      />
                    )}
                    <MessageBubble
                      message={message}
                      isOwnMessage={message.senderId === currentUser._id}
                    />
                    {message._id === lastSeenMessageId && (
                      <Text
                        size="xs"
                        c="dimmed"
                        ta="right"
                        pr="md"
                        mt={-6}
                        mb="xs"
                      >
                        {t('messaging.seen')}
                      </Text>
                    )}
                  </Box>
                );
              })}
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
      <Box bg="white" px="md" py="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}>
        <Container size="md">
          {/* Image preview */}
          {pendingImagePreview && (
            <Box mb="xs" style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={pendingImagePreview}
                alt={t('messaging.attachImage')}
                style={{ height: 80, borderRadius: 8, display: 'block' }}
              />
              <CloseButton
                size="xs"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '50%',
                }}
                onClick={clearPendingImage}
              />
            </Box>
          )}

          <form onSubmit={handleSendMessage}>
            <Group gap="sm" align="flex-end">
              {/* Image attach button */}
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('messaging.attachImage')}
                mb={2}
              >
                <IconPhoto size={20} />
              </ActionIcon>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />

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
                    handleSendMessage(e as any);
                  }
                }}
              />
              <Button
                type="submit"
                color="eco-primary"
                radius="xl"
                disabled={(!messageInput.trim() && !pendingImage) || isSending}
                loading={isSending || isUploadingImage}
                mb={2}
              >
                <IconSend size={18} />
              </Button>
            </Group>
          </form>
        </Container>
      </Box>

      {/* Mobile details drawer */}
      <Drawer
        opened={detailsOpened}
        onClose={closeDetails}
        position="right"
        size={300}
        withCloseButton={false}
        padding={0}
      >
        <ConversationDetails
          conversation={conversation}
          currentUserId={currentUser._id}
          onDelete={() => {
            closeDetails();
            router.push('/messages');
          }}
        />
      </Drawer>
    </Flex>
  );

  return noLayout ? chatContent : <Layout>{chatContent}</Layout>;
}
