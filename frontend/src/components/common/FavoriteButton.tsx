import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Loader, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconHeart, IconHeartFilled, IconCheck, IconX } from '@tabler/icons-react';
import { favoritesService } from '../../services/favorites';
import { isAuthenticated } from '../../services/api';

interface FavoriteButtonProps {
  projectId: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const;

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function FavoriteButton({ projectId, size = 'md' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    if (!isLoggedIn) return;

    const checkFavoriteStatus = async () => {
      try {
        const favorites = await favoritesService.getFavorites();
        setIsFavorite(favorites.includes(projectId));
      } catch (error: any) {
        // Silently ignore 404 errors (favorite doesn't exist yet)
        if (error?.response?.status !== 404) {
          console.error('Failed to check favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [projectId, isLoggedIn]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const previousState = isFavorite;
    setIsLoading(true);
    
    // Optimistically update UI
    setIsFavorite(!previousState);

    try {
      if (previousState) {
        await favoritesService.removeFavorite(projectId);
        notifications.show({
          title: 'Removed from favorites',
          message: 'Project removed from your favorites',
          color: 'blue',
          icon: <IconCheck size={18} />,
          position: 'bottom-right',
        });
      } else {
        await favoritesService.addFavorite(projectId);
        notifications.show({
          title: 'Added to favorites',
          message: 'Project added to your favorites',
          color: 'green',
          icon: <IconCheck size={18} />,
          position: 'bottom-right',
        });
      }
      // Refresh favorites list to ensure consistency
      const favorites = await favoritesService.getFavorites();
      setIsFavorite(favorites.includes(projectId));
    } catch (error: any) {
      // Handle specific error cases
      const errorMessage = error?.response?.data?.detail || '';
      
      // Silently handle "own project" error - this is expected behavior
      if (errorMessage.includes('cannot favorite your own project')) {
        // Don't show error, just revert state
        setIsFavorite(previousState);
        return;
      }
      
      // Silently handle "already in favorites" error
      if (errorMessage.includes('already in favorites')) {
        // Don't show error, just keep current state
        setIsFavorite(true);
        return;
      }
      
      // Log other errors for debugging
      if (error?.response?.status !== 404) {
        console.error('Failed to toggle favorite:', error);
        if (error?.response?.data) {
          console.error('Error details:', error.response.data);
        }

        // Show error notification
        notifications.show({
          title: 'Error',
          message: 'Failed to update favorites. Please try again.',
          color: 'red',
          icon: <IconX size={18} />,
          position: 'bottom-right',
        });
      }

      // Revert to previous state on error
      setIsFavorite(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const label = isFavorite ? 'Remove from favorites' : 'Add to favorites';

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
          <IconHeartFilled size={iconSizeMap[size]} />
        ) : (
          <IconHeart size={iconSizeMap[size]} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
