'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConversations, useConversation } from '@/hooks/useConvex';
import { useAuth } from '@/providers/AuthProvider';
import { IconMail } from '@tabler/icons-react';
import {
  Box,
  Center,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { Layout } from '@/components/common/Layout';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ConversationDetails } from '@/components/messaging/ConversationDetails';
import { ChatClient } from './[id]/ChatClient';
import type { Conversation } from '@/types';

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

  // Reactive conversation for the right sidebar (enriched with participationDetails)
  const { conversation: selectedConversation } = useConversation(selectedConversationId);

  // Mobile: show either list or chat
  if (isMobile) {
    if (selectedConversationId) {
      return <ChatClient conversationId={selectedConversationId} />;
    }

    return (
      <Layout hideFooter>
        <Box h="calc(100vh - 60px)">
          <ConversationList
            conversations={conversations}
            selectedId={undefined}
            currentUserId={(currentUser as any)?._id}
            onSelect={(convId) => router.push(`/messages/${convId}`)}
          />
        </Box>
      </Layout>
    );
  }

  // Desktop: 3-column layout
  return (
    <Layout hideFooter>
      <Group gap={0} h="calc(100vh - 60px)" wrap="nowrap" align="stretch">
        {/* LEFT: Conversation list (320px) */}
        <Box
          w={320}
          style={{ flexShrink: 0, borderRight: '1px solid #e0e0e0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId ?? undefined}
            currentUserId={(currentUser as any)?._id}
            onSelect={(convId) => router.push(`/messages/${convId}`)}
          />
        </Box>

        {/* CENTER: Chat area */}
        <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedConversationId ? (
            <ChatClient conversationId={selectedConversationId} noLayout />
          ) : (
            <Center style={{ flex: 1 }} bg="gray.0">
              <Stack align="center" gap="md">
                <IconMail size={64} color="var(--mantine-color-gray-4)" />
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

        {/* RIGHT: Conversation details (280px) — shown when a conversation is selected */}
        {selectedConversationId && selectedConversation && currentUser && (
          <Box
            w={280}
            style={{ flexShrink: 0, borderLeft: '1px solid #e0e0e0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <ConversationDetails
              conversation={selectedConversation as Conversation}
              currentUserId={(currentUser as any)._id}
              onDelete={() => router.push('/messages')}
            />
          </Box>
        )}
      </Group>
    </Layout>
  );
}
