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
      style={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: showAvatar ? 16 : 8,
      }}
    >
      <Group
        align="flex-end"
        gap="xs"
        style={{
          maxWidth: '60%',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        }}
        wrap="nowrap"
      >
        {/* Profile Picture (for received messages only) */}
        {!isOwnMessage && (
          <Box style={{ width: 28, height: 28 }}>
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
            px={16}
            py={10}
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
            style={{
              color: '#717171',
              textAlign: isOwnMessage ? 'right' : 'left',
              paddingLeft: isOwnMessage ? 0 : 4,
              paddingRight: isOwnMessage ? 4 : 0,
            }}
          >
            {dayjs(message.created_at).format('h:mm A')}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}
