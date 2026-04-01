'use client';

import { Box, Group, Avatar, Text } from '@mantine/core';
import dayjs from 'dayjs';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = true }: MessageBubbleProps) {
  return (
    <Box
      display="flex"
      mb={showAvatar ? 'md' : 'xs'}
      style={{
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      }}
    >
      <Group
        align="flex-end"
        gap="xs"
        maw="60%"
        style={{
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        }}
        wrap="nowrap"
      >
        {/* Profile Picture (for received messages only) */}
        {!isOwnMessage && (
          <Box w={28} h={28}>
            {showAvatar && (
              <Avatar
                src={message.sender.profile_picture}
                size={28}
                radius="xl"
                color="gray"
              >
                {!message.sender.profile_picture &&
                  `${message.sender.first_name[0]}${message.sender.last_name[0]}`}
              </Avatar>
            )}
          </Box>
        )}

        {/* Message Bubble */}
        <Box>
          <Box
            px="md"
            py="xs"
            style={{
              backgroundColor: isOwnMessage ? '#222222' : '#f0f0f0',
              color: isOwnMessage ? 'white' : '#222222',
              borderRadius: 16,
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

          {/* Timestamp below bubble */}
          <Text
            size="xs"
            mt={4}
            c="gray.6"
            ta={isOwnMessage ? 'right' : 'left'}
            pl={isOwnMessage ? 0 : 4}
            pr={isOwnMessage ? 4 : 0}
          >
            {dayjs(message.created_at).format('h:mm A')}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}
