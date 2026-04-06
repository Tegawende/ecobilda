'use client';

import { Box, Group, Avatar, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = true }: MessageBubbleProps) {
  const isSystem = (message as any).isSystem;

  // System message (acceptance / refusal) — centered event banner
  if (isSystem) {
    const isAccepted = message.body.startsWith('✓');
    return (
      <Box display="flex" mb="lg" mt="xs" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {/* Horizontal rule lines */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 420 }}>
          <Box style={{ flex: 1, height: 1, backgroundColor: isAccepted ? 'var(--mantine-color-green-2)' : 'var(--mantine-color-red-2)' }} />
          <Box
            px="md"
            py={6}
            style={{
              backgroundColor: isAccepted ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-red-0)',
              border: `1.5px solid var(--mantine-color-${isAccepted ? 'green' : 'red'}-3)`,
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {isAccepted
              ? <IconCheck size={13} color="var(--mantine-color-green-7)" style={{ flexShrink: 0 }} />
              : <IconX size={13} color="var(--mantine-color-red-7)" style={{ flexShrink: 0 }} />
            }
            <Text size="xs" fw={600} c={isAccepted ? 'green.7' : 'red.7'} style={{ whiteSpace: 'nowrap' }}>
              {message.body.replace(/^[✓✗]\s*/, '')}
            </Text>
          </Box>
          <Box style={{ flex: 1, height: 1, backgroundColor: isAccepted ? 'var(--mantine-color-green-2)' : 'var(--mantine-color-red-2)' }} />
        </Box>
        <Text size="xs" c="dimmed">
          {dayjs(message._creationTime).format('D MMM YYYY, h:mm A')}
        </Text>
      </Box>
    );
  }

  // Regular message
  return (
    <Box
      display="flex"
      mb={showAvatar ? 'md' : 'xs'}
      style={{ justifyContent: isOwnMessage ? 'flex-end' : 'flex-start' }}
    >
      <Group
        align="flex-end"
        gap="xs"
        maw="60%"
        style={{ flexDirection: isOwnMessage ? 'row-reverse' : 'row' }}
        wrap="nowrap"
      >
        {/* Avatar (received messages only) */}
        {!isOwnMessage && (
          <Box w={28} h={28}>
            {showAvatar && (
              <Avatar
                src={message.sender?.profilePictureUrl || (message.sender as any)?.profilePicture}
                size={28}
                radius="xl"
                color="gray"
              >
                {`${message.sender?.firstName?.[0] ?? ''}${message.sender?.lastName?.[0] ?? ''}`}
              </Avatar>
            )}
          </Box>
        )}

        {/* Bubble */}
        <Box>
          <Box
            px={message.imageUrl && !message.body ? 0 : 'md'}
            py={message.imageUrl && !message.body ? 0 : 'xs'}
            style={{
              backgroundColor: isOwnMessage
                ? 'var(--mantine-color-eco-blue-6)'
                : '#f0f0f0',
              color: isOwnMessage ? 'white' : '#222222',
              borderRadius: 16,
              borderBottomRightRadius: isOwnMessage ? 4 : 16,
              borderBottomLeftRadius: isOwnMessage ? 16 : 4,
              display: 'inline-block',
              overflow: 'hidden',
            }}
          >
            {message.imageUrl && (
              <Box
                mb={message.body ? 'xs' : 0}
                style={{
                  maxWidth: 240,
                  cursor: 'pointer',
                  borderRadius: message.body ? 0 : 16,
                  overflow: 'hidden',
                }}
                onClick={() => window.open(message.imageUrl!, '_blank')}
              >
                <img
                  src={message.imageUrl}
                  alt=""
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            )}
            {message.body && (
              <Box px={message.imageUrl ? 'md' : 0} py={message.imageUrl ? 'xs' : 0}>
                <Text
                  size="sm"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.4,
                  }}
                >
                  {message.body}
                </Text>
              </Box>
            )}
          </Box>

          <Text
            size="xs"
            mt={4}
            c="gray.6"
            ta={isOwnMessage ? 'right' : 'left'}
            pl={isOwnMessage ? 0 : 4}
            pr={isOwnMessage ? 4 : 0}
          >
            {dayjs(message._creationTime).format('h:mm A')}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}
