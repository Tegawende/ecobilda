'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Button,
  Stack,
  ThemeIcon,
  Center,
} from '@mantine/core';
import { IconHeart } from '@tabler/icons-react';
import type { Mission } from '@/types';
import { useFavorites } from '@/hooks/useConvex';
import { MissionCard, MissionCardSkeleton } from '@/components/missions/MissionCard';

export function FavoritesClient() {
  const t = useTranslations();
  const { favoriteMissionIds, isLoading: favLoading } = useFavorites();
  const favoriteMissions = useQuery(
    api.missions.getByIds,
    favoriteMissionIds.length > 0 ? { ids: favoriteMissionIds as any } : 'skip'
  );
  const favorites = (favoriteMissions ?? []) as Mission[];
  const isLoading =
    favLoading || (favoriteMissionIds.length > 0 && favoriteMissions === undefined);

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <Stack gap={4}>
          <ThemeIcon size={48} radius="md" color="red" variant="light">
            <IconHeart size={28} />
          </ThemeIcon>
          <Title order={2}>{t('favorites.title')}</Title>
          <Text c="dimmed">{t('favorites.subtitle')}</Text>
        </Stack>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {[...Array(6)].map((_, i) => (
              <MissionCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        ) : favorites.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {favorites.map((mission) => (
              <MissionCard key={mission._id} mission={mission} initialFavorite />
            ))}
          </SimpleGrid>
        ) : (
          <Center py="xl">
            <Paper radius="lg" p="xl" withBorder>
              <Stack align="center" gap="md">
                <IconHeart size={64} color="#e5e7eb" />
                <Title order={3}>{t('favorites.noFavorites')}</Title>
                <Text c="dimmed" maw={400} ta="center">
                  {t('favorites.noFavoritesDesc')}
                </Text>
                <Button component={Link} href="/missions" radius="xl" color="eco-primary">
                  {t('favorites.browseMissions')}
                </Button>
              </Stack>
            </Paper>
          </Center>
        )}
      </Stack>
    </Container>
  );
}
