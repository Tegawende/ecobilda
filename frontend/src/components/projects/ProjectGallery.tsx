'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Image,
  SimpleGrid,
  Center,
  Text,
  Stack,
  Modal,
  ActionIcon,
  Group,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPhoto, IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import type { ProjectImage } from '@/types';

interface ProjectGalleryProps {
  images: ProjectImage[];
  title: string;
}

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const t = useTranslations();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [opened, { open, close }] = useDisclosure(false);

  // Sort images: cover first, then by order
  const sortedImages = [...images].sort((a, b) => {
    if (a.order === 0) return -1;
    if (b.order === 0) return 1;
    return a.order - b.order;
  });

  if (sortedImages.length === 0) {
    return (
      <Center h={384} bg="gray.2" style={{ borderRadius: 8 }}>
        <Stack align="center" gap="xs">
          <IconPhoto size={64} color="gray" />
          <Text c="dimmed">{t('projects.noImages')}</Text>
        </Stack>
      </Center>
    );
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    open();
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <>
      {/* Gallery Grid */}
      <SimpleGrid cols={4} spacing={8} h={384}>
        {/* Main Image (spans 2x2) */}
        <Box
          style={{
            gridColumn: 'span 2',
            gridRow: 'span 2',
            cursor: 'pointer',
            overflow: 'hidden',
            borderRadius: 8,
          }}
          onClick={() => handleImageClick(0)}
        >
          <Image
            src={sortedImages[0].url}
            alt={`${title} - Main`}
            h="100%"
            fit="cover"
            style={{ transition: 'transform 0.3s' }}
          />
        </Box>

        {/* Thumbnail Grid */}
        {sortedImages.slice(1, 5).map((image, index) => (
          <Box
            key={image._id}
            pos="relative"
            style={{
              cursor: 'pointer',
              overflow: 'hidden',
              borderRadius: 8,
            }}
            onClick={() => handleImageClick(index + 1)}
          >
            <Image
              src={image.url}
              alt={`${title} - ${index + 2}`}
              h="100%"
              fit="cover"
            />
            {/* Show count overlay on last thumbnail */}
            {index === 3 && sortedImages.length > 5 && (
              <Center
                pos="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(0,0,0,0.6)"
              >
                <Text c="white" fw={600} size="xl">
                  {t('projects.moreImages', { count: sortedImages.length - 5 })}
                </Text>
              </Center>
            )}
          </Box>
        ))}

        {/* Fill empty slots */}
        {sortedImages.length < 5 &&
          Array.from({ length: 5 - sortedImages.length }).map((_, index) => (
            <Center key={`empty-${index}`} bg="gray.1" style={{ borderRadius: 8 }}>
              <IconPhoto size={32} color="gray" />
            </Center>
          ))}
      </SimpleGrid>

      {/* Lightbox Modal */}
      <Modal
        opened={opened}
        onClose={close}
        size="100vw"
        fullScreen
        withCloseButton={false}
        styles={{
          content: { backgroundColor: 'rgba(0,0,0,0.95)' },
          body: { padding: 0, height: '100vh' },
        }}
      >
        <Box h="100vh" pos="relative">
          {/* Close button */}
          <ActionIcon
            pos="absolute"
            top={16}
            right={16}
            size="xl"
            variant="subtle"
            color="white"
            onClick={close}
            style={{ zIndex: 10 }}
          >
            <IconX size={32} />
          </ActionIcon>

          {/* Navigation buttons */}
          {sortedImages.length > 1 && (
            <>
              <ActionIcon
                pos="absolute"
                left={16}
                top="50%"
                style={{ transform: 'translateY(-50%)', zIndex: 10 }}
                size="xl"
                variant="subtle"
                color="white"
                onClick={handlePrevious}
              >
                <IconChevronLeft size={48} />
              </ActionIcon>

              <ActionIcon
                pos="absolute"
                right={16}
                top="50%"
                style={{ transform: 'translateY(-50%)', zIndex: 10 }}
                size="xl"
                variant="subtle"
                color="white"
                onClick={handleNext}
              >
                <IconChevronRight size={48} />
              </ActionIcon>
            </>
          )}

          {/* Main Image */}
          <Center h="calc(100vh - 100px)" p="md">
            <Image
              src={sortedImages[selectedImageIndex].url}
              alt={`${title} - ${selectedImageIndex + 1}`}
              fit="contain"
              mah="85vh"
              maw="90vw"
            />
          </Center>

          {/* Image counter */}
          <Text c="white" ta="center" size="sm" mt="xs">
            {selectedImageIndex + 1} / {sortedImages.length}
          </Text>

          {/* Thumbnail strip */}
          {sortedImages.length > 1 && (
            <Group
              pos="absolute"
              bottom={16}
              left="50%"
              style={{ transform: 'translateX(-50%)' }}
              gap={8}
              wrap="nowrap"
            >
              {sortedImages.map((image, index) => (
                <UnstyledButton
                  key={image._id}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: index === selectedImageIndex ? '2px solid white' : '2px solid transparent',
                    opacity: index === selectedImageIndex ? 1 : 0.6,
                    transform: index === selectedImageIndex ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Image src={image.url} alt={`Thumbnail ${index + 1}`} h={64} w={64} fit="cover" />
                </UnstyledButton>
              ))}
            </Group>
          )}
        </Box>
      </Modal>
    </>
  );
}
