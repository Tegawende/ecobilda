'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Box, Group, Avatar, Text, Badge } from '@mantine/core';
import { IconVolume3, IconMapPin } from '@tabler/icons-react';
import type { Conversation, User } from '@/types';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onClick?: () => void;
}

export function ConversationCard({ conversation, currentUserId, onClick }: ConversationCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  // Determine the other user (recipient)
  const otherUser = conversation.otherUser;

  // Determine unread count for current user
  const unreadCount = conversation.unreadCount ?? 0;

  // Check if conversation is muted
  const isMuted = conversation.isMuted ?? false;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 day - show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }

    // Less than 7 days - show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString(locale, { weekday: 'short' });
    }

    // Older - show date
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  const commonStyle = {
    display: 'block',
    borderBottom: '1px solid var(--mantine-color-gray-3)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background-color 0.15s',
    cursor: 'pointer',
  };

  const content = (
    <>
      <Group align="flex-start" wrap="nowrap">
        {/* Profile Picture */}
        <Avatar
          src={otherUser?.profilePictureUrl || otherUser?.profilePicture}
          size="md"
          radius="xl"
          color="blue"
        >
          {!otherUser?.profilePicture &&
            `${otherUser?.firstName?.[0] ?? ''}${otherUser?.lastName?.[0] ?? ''}`}
        </Avatar>

        {/* Conversation Info */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" mb={4}>
            <Text
              size="sm"
              fw={unreadCount > 0 ? 600 : 500}
              c={unreadCount > 0 ? 'dark' : 'dimmed'}
            >
              {otherUser?.firstName} {otherUser?.lastName}
            </Text>
            <Text size="xs" c="dimmed">
              {conversation.lastMessageAt ? formatTime(String(conversation.lastMessageAt)) : ''}
            </Text>
          </Group>

          {/* Last Message */}
          <Group gap={4}>
            {isMuted && <IconVolume3 size={14} color="gray" />}
            <Text
              size="sm"
              c={unreadCount > 0 ? 'dark' : 'dimmed'}
              fw={unreadCount > 0 ? 500 : 400}
              lineClamp={1}
              style={{ flex: 1 }}
            >
              {conversation.lastMessageText || t('messaging.noMessagesYet')}
            </Text>
          </Group>
        </Box>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <Badge size="sm" circle>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Group>
    </>
  );

  if (onClick) {
    return (
      <Box
        onClick={onClick}
        p="md"
        bg={unreadCount > 0 ? 'blue.0' : 'white'}
        style={commonStyle}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)')}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.backgroundColor = unreadCount > 0 ? 'var(--mantine-color-blue-0)' : 'white')}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      component={Link} href={`/messages/${conversation._id}`}
      p="md"
      bg={unreadCount > 0 ? 'blue.0' : 'white'}
      style={commonStyle}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)')}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.backgroundColor = unreadCount > 0 ? 'var(--mantine-color-blue-0)' : 'white')}
    >
      {content}
    </Box>
  );
}
