import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Carousel } from '@mantine/carousel';
import {
  Card,
  Image,
  Text,
  Badge,
  Group,
  Center,
  Skeleton,
  Box,
} from '@mantine/core';
import {
  IconPlant,
  IconHammer,
  IconStarFilled,
} from '@tabler/icons-react';
import { FavoriteButton } from '../common/FavoriteButton';
import type { Project } from '../../types';
import classes from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Partial<Project> & { id: number; title: string };
}

// Mock images based on project type
const getMockImages = (projectType: 'PERM' | 'NATB' | undefined, projectId: number) => {
  const permImages = [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ];

  const natbImages = [
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ];

  const images = projectType === 'PERM' ? permImages : natbImages;
  // Use project ID to select consistent images for the same project
  const selectedImages = images.slice(0, 3 + (projectId % 3));
  return selectedImages;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Determine project type icon and label
  const isPerm = project.project_type === 'PERM';
  const ProjectIcon = isPerm ? IconPlant : IconHammer;
  const projectTypeLabel = isPerm
    ? t('projects.permaculture')
    : t('projects.naturalBuilding');
  const projectTypeColor = isPerm ? 'green' : 'orange';

  // Get all images sorted (cover first), or use mock images
  const sortedImages = project.images && project.images.length > 0
    ? [...project.images].sort((a, b) => {
        if (a.is_cover) return -1;
        if (b.is_cover) return 1;
        return a.order - b.order;
      })
    : [];

  // Use mock images if no real images
  const mockImages = sortedImages.length === 0 ? getMockImages(project.project_type, project.id) : [];
  const allImages = sortedImages.length > 0 
    ? sortedImages.map(img => img.image)
    : mockImages;

  const hasMultipleImages = allImages.length > 1;

  // Handle card click (navigate to project)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on carousel controls or favorite button
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-carousel-control]') ||
      target.closest('[data-favorite-button]') ||
      target.closest('button')
    ) {
      return;
    }
    navigate(`/projects/${project.id}`);
  };

  // Render carousel slides
  const slides = allImages.map((imageUrl, index) => (
    <Carousel.Slide key={index}>
      <Image src={imageUrl} height={220} alt={project.title} />
    </Carousel.Slide>
  ));

  // Render image section
  const renderImageSection = () => {
    if (allImages.length === 0) {
      // Fallback placeholder when no images at all
      return (
        <Center h={220} bg={isPerm ? 'green.1' : 'orange.1'}>
          <ProjectIcon size={64} color={isPerm ? 'green' : 'orange'} style={{ opacity: 0.6 }} />
        </Center>
      );
    }

    if (hasMultipleImages) {
      // Carousel for multiple images
      return (
        <Carousel
          withIndicators
          loop
          classNames={{
            root: classes.carousel,
            controls: classes.carouselControls,
            indicator: classes.carouselIndicator,
          }}
        >
          {slides}
        </Carousel>
      );
    }

    // Single image
    return <Image src={allImages[0]} height={220} alt={project.title} />;
  };

  // Get location string
  const location = project.address 
    ? `${project.address.city}, ${project.address.country.name}`
    : project.title;

  return (
    <Card
      radius="md"
      withBorder
      padding="xl"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Image Section with Carousel */}
      <Card.Section>
        {renderImageSection()}

        {/* Project Type Badge */}
        <Box style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <Badge
            color={projectTypeColor}
            variant="filled"
            leftSection={<ProjectIcon size={14} />}
          >
            {projectTypeLabel}
          </Badge>
        </Box>

        {/* Favorite Button */}
        <Box style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }} data-favorite-button>
          <FavoriteButton projectId={project.id} size="sm" />
        </Box>
      </Card.Section>

      {/* Location and Rating */}
      <Group justify="space-between" mt="lg">
        <Text fw={500} fz="lg" lineClamp={1} style={{ flex: 1 }}>
          {location}
        </Text>

        {project.owner?.average_rating && project.owner.average_rating > 0 && (
          <Group gap={5}>
            <IconStarFilled size={16} color="var(--mantine-color-yellow-6)" />
            <Text fz="sm" fw={600}>
              {project.owner.average_rating.toFixed(2)}
            </Text>
          </Group>
        )}
      </Group>

      {/* Description */}
      <Text fz="sm" c="dimmed" mt="sm" lineClamp={2}>
        {project.description || project.title}
      </Text>

      {/* Work Details */}
      {(project.hours_per_day || project.days_per_week) && (
        <Group justify="space-between" mt="md">
          <div>
            {project.hours_per_day && (
              <>
                <Text fz="lg" span fw={500}>
                  {project.hours_per_day}h
                </Text>
                <Text span fz="sm" c="dimmed">
                  {' '}/ day
                </Text>
              </>
            )}
            {project.hours_per_day && project.days_per_week && (
              <Text span fz="sm" c="dimmed">
                {' '}•{' '}
              </Text>
            )}
            {project.days_per_week && (
              <>
                <Text fz="lg" span fw={500}>
                  {project.days_per_week}d
                </Text>
                <Text span fz="sm" c="dimmed">
                  {' '}/ week
                </Text>
              </>
            )}
          </div>
        </Group>
      )}
    </Card>
  );
}

// Skeleton loader for loading state
export function ProjectCardSkeleton() {
  return (
    <Card radius="md" withBorder padding="xl">
      <Card.Section>
        <Skeleton h={220} />
      </Card.Section>
      <Group justify="space-between" mt="lg">
        <Skeleton h={24} w="60%" />
        <Skeleton h={20} w={50} />
      </Group>
      <Skeleton h={16} mt="sm" />
      <Skeleton h={16} mt={4} w="80%" />
      <Group justify="space-between" mt="md">
        <Skeleton h={20} w={100} />
      </Group>
    </Card>
  );
}
