'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useConversations } from '@/hooks/useConvex';
import { useAuth } from '@/providers/AuthProvider';
import { IconMail } from '@tabler/icons-react';
import {
  Box,
  Center,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
  Avatar,
} from '@mantine/core';
import { Layout } from '@/components/common/Layout';
import { ChatClient } from './[id]/ChatClient';
import type { Conversation } from '@/types';

// Conversation List Item
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const locale = useLocale();
  const otherUser = conversation.otherUser;
  const unreadCount = conversation.unreadCount ?? 0;

  return (
    <UnstyledButton
      onClick={onClick}
      className={`w-full border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-eco-primary/5 border-l-2 border-l-eco-primary' : ''}`}
      p="md"
    >
      <Group gap="sm" wrap="nowrap">
        {/* Avatar with fallback */}
        <Avatar
          src={otherUser?.profilePictureUrl || null}
          size={48}
          radius="xl"
          color="eco-primary"
          className="flex-shrink-0"
        >
          {`${otherUser?.firstName?.[0] || ''}${otherUser?.lastName?.[0] || ''}`}
        </Avatar>

        <Box className="flex-1 min-w-0">
          <Group justify="space-between" wrap="nowrap">
            <Text fw={unreadCount > 0 ? 700 : 500} truncate size="sm">
              {otherUser?.firstName} {otherUser?.lastName}
            </Text>
            {unreadCount > 0 && (
              <Center
                style={{ minWidth: 20, height: 20, borderRadius: 10 }}
                className="bg-eco-primary text-white text-xs font-bold px-1 flex-shrink-0"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Center>
            )}
          </Group>
          <Text size="xs" c="dimmed" truncate mt={2} lineClamp={1}>
            {conversation.lastMessageText}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            {conversation.lastMessageAt
              ? new Date(conversation.lastMessageAt).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                })
              : ''}
          </Text>
        </Box>
      </Group>
    </UnstyledButton>
  );
}

export function MessagesClient() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { conversations: convexConversations } = useConversations();
  const conversations = convexConversations as Conversation[];
  const { user: currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedConversationId = id || null;

  // Mobile: show either list or chat
  if (isMobile) {
    if (selectedConversationId) {
      return <ChatClient conversationId={selectedConversationId} />;
    }

    return (
      <Layout hideFooter>
        <Box h="calc(100vh - 60px)" bg="white">
          <Box p="md" className="border-b border-gray-200">
            <Title order={2} className="font-display">
              {t('messaging.title')}
            </Title>
          </Box>
          <Box className="overflow-y-auto h-[calc(100%-64px)]">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={false}
                  onClick={() => router.push(`/messages/${conv._id}`)}
                />
              ))
            ) : (
              <Stack align="center" justify="center" p="xl" gap="md" mt="xl">
                <IconMail size={48} className="text-gray-300" />
                <Text c="dimmed">{t('messaging.noConversations')}</Text>
              </Stack>
            )}
          </Box>
        </Box>
      </Layout>
    );
  }

  // Desktop: two-column layout
  return (
    <Layout hideFooter>
      <Group gap={0} h="calc(100vh - 60px)" wrap="nowrap" align="stretch">
        {/* Conversation List */}
        <Stack gap={0} w={320} className="flex-shrink-0 border-r border-gray-200 h-full" bg="white">
          <Box p="md" className="border-b border-gray-200">
            <Title order={2} className="font-display">
              {t('messaging.title')}
            </Title>
          </Box>
          <Box className="overflow-y-auto flex-1">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={conv._id === selectedConversationId}
                  onClick={() => router.push(`/messages/${conv._id}`)}
                />
              ))
            ) : (
              <Stack align="center" justify="center" p="xl" gap="md" mt="xl">
                <IconMail size={48} className="text-gray-300" />
                <Text c="dimmed">{t('messaging.noConversations')}</Text>
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Chat Area */}
        <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedConversationId ? (
            <ChatClient conversationId={selectedConversationId} noLayout />
          ) : (
            <Center style={{ flex: 1 }} bg="gray.0">
              <Stack align="center" gap="md">
                <IconMail size={64} className="text-gray-300" />
                <Text size="lg" fw={600} c="dark.3">
                  {t('messaging.selectConversation')}
                </Text>
                <Text c="dimmed" ta="center" maw={300}>
                  {t('messaging.selectConversationDesc')}
                </Text>
              </Stack>
            </Center>
          )}
        </Box>
      </Group>
    </Layout>
  );
}
