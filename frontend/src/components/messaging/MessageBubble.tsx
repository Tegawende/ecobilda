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

  // System message (acceptance / refusal) — centered banner style
  if (isSystem) {
    const isAccepted = message.body.startsWith('✓');
    return (
      <Box display="flex" mb="md" style={{ justifyContent: 'center' }}>
        <Box
          px="md"
          py="xs"
          style={{
            backgroundColor: isAccepted
              ? 'var(--mantine-color-green-0)'
              : 'var(--mantine-color-red-0)',
            border: `1px solid var(--mantine-color-${isAccepted ? 'green' : 'red'}-2)`,
            borderRadius: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: '80%',
          }}
        >
          {isAccepted
            ? <IconCheck size={14} color="var(--mantine-color-green-6)" style={{ flexShrink: 0 }} />
            : <IconX size={14} color="var(--mantine-color-red-6)" style={{ flexShrink: 0 }} />
          }
          <Text
            size="xs"
            fw={500}
            c={isAccepted ? 'green.7' : 'red.7'}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {message.body.replace(/^[✓✗]\s*/, '')}
          </Text>
        </Box>
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
            px="md"
            py="xs"
            style={{
              backgroundColor: isOwnMessage
                ? 'var(--mantine-color-eco-blue-6)'
                : '#f0f0f0',
              color: isOwnMessage ? 'white' : '#222222',
              borderRadius: 16,
              borderBottomRightRadius: isOwnMessage ? 4 : 16,
              borderBottomLeftRadius: isOwnMessage ? 16 : 4,
              display: 'inline-block',
            }}
          >
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
