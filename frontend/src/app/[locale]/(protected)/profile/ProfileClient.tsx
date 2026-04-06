'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslations, useLocale } from 'next-intl';
import { Container, Title, Text, Paper, Button, Group, Stack, Avatar, Badge, Rating, TextInput, Textarea, ThemeIcon, Alert } from '@mantine/core';
import {
  IconPencil,
  IconMapPin,
  IconMail,
  IconMessage,
  IconHome2,
  IconLeaf,
  IconGift,
  IconArrowLeft,
  IconLanguage,
  IconUser,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getSkillIcon } from '@/lib/skillIcons';
import { Layout } from '@/components/common/Layout';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { getSkillDisplayName, type Review, type Skill } from '@/types';

// Imported from types

function getLocalizedLanguageName(code: string, locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
    const name = displayNames.of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

// Review Card Component using Mantine
function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Paper radius="lg" p="lg" withBorder>
      <Group align="flex-start" gap="md">
        <Avatar
          src={review.writer?.profilePictureUrl}
          alt={`${review.writer?.firstName} ${review.writer?.lastName}`}
          size="lg"
          radius="xl"
          className="border-2 border-eco-primary/20"
        />
        <Stack gap="xs" className="flex-1">
          <Group justify="space-between">
            <Title order={5}>
              {review.writer?.firstName} {review.writer?.lastName}
            </Title>
            <Rating value={review.rating} readOnly size="sm" color="eco-terracotta" />
          </Group>
          <Text size="sm" c="dimmed">
            {review._creationTime ? new Date(review._creationTime).toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : ''}
          </Text>
          <Text size="sm">{review.feedback}</Text>

          {review.response && (
            <Paper radius="md" p="sm" bg="var(--mantine-color-eco-primary-light)" className="border-l-2 border-eco-primary">
              <Text size="sm" fw={600} c="eco-primary" mb={4}>
                {t('profile.yourResponse')}
              </Text>
              <Text size="sm" c="dimmed">{review.response}</Text>
            </Paper>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

// EditProfileForm imported from @/components/profile/EditProfileForm

export function ProfileClient() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(searchParams?.get('edit') === '1');
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('@/services/profile').then(({ profileService }) => {
      profileService.getProfile()
        .then(data => { setUser(data); setLoading(false); })
        .catch(err => { setError(t('profile.loadError')); setLoading(false); });
    });
  }, []);

  const { refreshUser } = useAuth();

  const handleSave = useCallback(async (data: any) => {
    setUser({ ...user, ...data });
    setIsEditing(false);
    await refreshUser();
  }, [user, refreshUser]);

  if (loading) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <Container size="sm">
            <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
              {error || t('profile.loadError')}
            </Alert>
          </Container>
        </div>
      </Layout>
    );
  }

  if (isEditing) {
    return (
      <Layout>
        <div className="bg-stone-50 min-h-screen py-12">
          <Container size="sm">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => setIsEditing(false)}
              mb="md"
            >
              {t('profile.backToProfile')}
            </Button>
            <EditProfileForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} />
          </Container>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-stone-50 min-h-screen py-12">
        <Container size="sm">
          <Stack gap="lg">
            {/* Header */}
            <Group gap="md" mb="xl">
              <ThemeIcon size={48} radius="md" color="eco-primary" variant="light">
                <IconUser size={28} />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={1} className="font-display">
                  {t('profile.title')}
                </Title>
                <Text c="dimmed">
                  {t('profile.subtitle')}
                </Text>
              </Stack>
            </Group>

            {/* Profile Header Card */}
            <Paper radius="lg" p="lg" withBorder>
              <Stack gap="md">
                <Group align="flex-start" gap="lg" wrap="wrap">
                  {/* Avatar */}
                  <Avatar
                    src={user.profilePictureUrl || user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    size={96}
                    radius="xl"
                    className="border-4 border-eco-primary/20"
                  />

                  {/* User Info */}
                  <Stack gap="xs" className="flex-1" style={{ minWidth: 200 }}>
                    <Group justify="space-between" align="flex-start">
                      <Title order={2} className="font-display">
                        {user.firstName} {user.lastName}
                      </Title>
                      <Button
                        variant="outline"
                        radius="xl"
                        size="xs"
                        leftSection={<IconPencil size={16} />}
                        onClick={() => setIsEditing(true)}
                      >
                        {t('profile.editProfile')}
                      </Button>
                    </Group>
                    <Group gap="xs">
                      <IconMail size={16} className="text-gray-500" />
                      <Text c="dimmed">{user.email}</Text>
                    </Group>
                    {user.dateOfBirth && (
                      <Group gap="xs">
                        <IconGift size={16} className="text-gray-500" />
                        <Text c="dimmed">
                          {new Date(user.dateOfBirth).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {' '}({Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} {t('profile.yearsOld')})
                        </Text>
                      </Group>
                    )}
                    {user.address?.city && (
                      <Group gap="xs">
                        <IconMapPin size={16} className="text-gray-500" />
                        <Text c="dimmed">{[user.address.city, user.address.country?.name].filter(Boolean).join(', ')}</Text>
                      </Group>
                    )}

                    {user.reviewCount > 0 && (
                      <Group gap="xs" mt="xs">
                        <Rating value={user.averageRating} readOnly fractions={2} color="eco-terracotta" />
                        <Text size="sm" c="dimmed">
                          ({user.reviewCount} {user.reviewCount === 1 ? t('profile.review') : t('profile.reviews')})
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Group>

                {/* Bio */}
                {user.bio && (
                  <Stack gap="xs" pt="md" className="border-t border-gray-100">
                    <Group gap="xs">
                      <IconUser size={16} className="text-gray-500" />
                      <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                        {t('profile.about')}
                      </Text>
                    </Group>
                    <Text className="whitespace-pre-wrap">{user.bio}</Text>
                  </Stack>
                )}

                {/* Languages */}
                {user.languages && user.languages.length > 0 && (
                  <Stack gap="xs" pt="md" className="border-t border-gray-100">
                    <Group gap="xs">
                      <IconLanguage size={16} className="text-eco-terracotta" />
                      <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                        {t('profile.languages')}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      {user.languages.map((lang: any) => (
                        <Badge key={lang.code} variant="light" color="eco-primary" size="sm">
                          {getLocalizedLanguageName(lang.code, locale)}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                )}

                {/* Skills - Natural Building */}
                {user.skills && user.skills.filter((s: any) => s.category === 'NATB').length > 0 && (
                  <Stack gap="xs" pt="md" className="border-t border-gray-100">
                    <Group gap="xs">
                      <IconHome2 size={16} className="text-eco-primary" />
                      <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                        {t('projects.naturalBuilding')}
                      </Text>
                    </Group>
                    <Group gap="xs" wrap="wrap">
                      {user.skills.filter((s: any) => s.category === 'NATB').map((skill: any) => {
                        const SkillIcon = getSkillIcon(skill.icon);
                        return (
                          <Badge key={skill.code} variant="light" color="eco-primary" size="sm" leftSection={<SkillIcon size={14} />}>
                            {getSkillDisplayName(skill, locale)}
                          </Badge>
                        );
                      })}
                    </Group>
                  </Stack>
                )}

                {/* Skills - Permaculture */}
                {user.skills && user.skills.filter((s: any) => s.category === 'PERM').length > 0 && (
                  <Stack gap="xs" pt="md" className="border-t border-gray-100">
                    <Group gap="xs">
                      <IconLeaf size={16} className="text-eco-terracotta" />
                      <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                        {t('projects.permaculture')}
                      </Text>
                    </Group>
                    <Group gap="xs" wrap="wrap">
                      {user.skills.filter((s: any) => s.category === 'PERM').map((skill: any) => {
                        const SkillIcon = getSkillIcon(skill.icon);
                        return (
                          <Badge key={skill.code} variant="light" color="eco-terracotta" size="sm" leftSection={<SkillIcon size={14} />}>
                            {getSkillDisplayName(skill, locale)}
                          </Badge>
                        );
                      })}
                    </Group>
                  </Stack>
                )}
              </Stack>
            </Paper>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <Paper radius="lg" p="lg" withBorder>
                <Group gap="sm" mb="lg" pb="md" className="border-b border-gray-100">
                  <IconMessage size={24} className="text-eco-primary" />
                  <Title order={4} className="font-display">
                    {t('profile.reviewsTitle')} ({reviews.length})
                  </Title>
                </Group>
                <Stack gap="md">
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </div>
    </Layout>
  );
}
