'use client';

import { Link } from '@/i18n/navigation';
import { Box, Group, Avatar, Text, Badge } from '@mantine/core';
import { IconVolume3, IconMapPin } from '@tabler/icons-react';
import type { Conversation, User } from '@/types';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: number;
  onClick?: () => void;
}

export function ConversationCard({ conversation, currentUserId, onClick }: ConversationCardProps) {
  // Determine the other user (recipient)
  const otherUser: User =
    conversation.user1.id === currentUserId ? conversation.user2 : conversation.user1;

  // Determine unread count for current user
  const unreadCount =
    conversation.user1.id === currentUserId
      ? conversation.unread_count_user1
      : conversation.unread_count_user2;

  // Check if conversation is muted
  const isMuted =
    conversation.user1.id === currentUserId
      ? conversation.user1_muted
      : conversation.user2_muted;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 day - show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // Less than 7 days - show day
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // Older - show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          src={otherUser.profile_picture}
          size="md"
          radius="xl"
          color="blue"
        >
          {!otherUser.profile_picture &&
            `${otherUser.first_name[0]}${otherUser.last_name[0]}`}
        </Avatar>

        {/* Conversation Info */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" mb={4}>
            <Text
              size="sm"
              fw={unreadCount > 0 ? 600 : 500}
              c={unreadCount > 0 ? 'dark' : 'dimmed'}
            >
              {otherUser.first_name} {otherUser.last_name}
            </Text>
            <Text size="xs" c="dimmed">
              {formatTime(conversation.last_message_at)}
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
              {conversation.last_message_text || 'No messages yet'}
            </Text>
          </Group>

          {/* Location */}
          {otherUser.address && (
            <Group gap={4} mt={4}>
              <IconMapPin size={12} color="gray" />
              <Text size="xs" c="dimmed">
                {otherUser.address.city}, {otherUser.address.country.code}
              </Text>
            </Group>
          )}
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
      component={Link} href={`/messages/${conversation.id}`}
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
