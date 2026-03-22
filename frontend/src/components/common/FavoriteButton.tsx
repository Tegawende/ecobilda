'use client';

import { useState, useEffect } from 'react';
import { ActionIcon, Tooltip, Loader } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { notifications } from '@mantine/notifications';
import {
  IconHeart,
  IconHeartFilled,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { favoritesService } from '@/services/favorites';
import { isAuthenticated } from '@/services/api';

interface FavoriteButtonProps {
  projectId: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circle' | 'ghost';
  initialFavorite?: boolean;
}

const sizeMap = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const;

const iconSizeMap = {
  sm: 20,
  md: 26,
  lg: 32,
};

export function FavoriteButton({
  projectId,
  size = 'md',
  variant = 'circle',
  initialFavorite = false
}: FavoriteButtonProps) {
  const t = useTranslations();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    if (!isLoggedIn) return;

    const checkFavoriteStatus = async () => {
      try {
        const favorites = await favoritesService.getFavorites();
        setIsFavorite(favorites.includes(projectId));
      } catch {
        // silently fail
      }
    };

    checkFavoriteStatus();
  }, [projectId, isLoggedIn]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const previousState = isFavorite;
    setIsLoading(true);
    setIsFavorite(!previousState);

    try {
      if (previousState) {
        await favoritesService.removeFavorite(projectId);
        notifications.show({
          title: t('favorites.removedTitle'),
          message: t('favorites.removedMessage'),
          color: 'eco-primary',
          icon: <IconCheck size={18} />,
          position: 'bottom-right',
        });
      } else {
        await favoritesService.addFavorite(projectId);
        notifications.show({
          title: t('favorites.addedTitle'),
          message: t('favorites.addedMessage'),
          color: 'eco-primary',
          icon: <IconCheck size={18} />,
          position: 'bottom-right',
        });
      }
      const favorites = await favoritesService.getFavorites();
      setIsFavorite(favorites.includes(projectId));
    } catch {
      notifications.show({
        title: t('favorites.errorTitle'),
        message: t('favorites.errorMessage'),
        color: 'red',
        icon: <IconX size={18} />,
        position: 'bottom-right',
      });
      setIsFavorite(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const label = isFavorite ? t('favorites.removeLabel') : t('favorites.addLabel');

  if (variant === 'ghost') {
    return (
      <Tooltip label={label} withArrow>
        <button
          onClick={handleToggleFavorite}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
          }}
          className="hover:scale-110 active:scale-95"
          aria-label={label}
        >
          {isLoading ? (
            <Loader size={iconSizeMap[size] - 4} color="red" />
          ) : (
            <IconHeart
              size={iconSizeMap[size]}
              stroke={1.5}
              color="white"
              fill={isFavorite ? '#ff385c' : 'rgba(0, 0, 0, 0.45)'}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                transition: 'fill 0.3s ease, transform 0.2s ease',
              }}
              className={isFavorite ? 'fill-[#ff385c]' : ''}
            />
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        onClick={handleToggleFavorite}
        disabled={isLoading}
        size={sizeMap[size]}
        radius="xl"
        variant={isFavorite ? 'filled' : 'light'}
        color="red"
        aria-label={label}
      >
        {isLoading ? (
          <Loader size={iconSizeMap[size] - 4} color="red" />
        ) : isFavorite ? (
          <IconHeartFilled size={iconSizeMap[size] - 4} />
        ) : (
          <IconHeart size={iconSizeMap[size] - 4} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
