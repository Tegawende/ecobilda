'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Container, Title, Text, Paper, Button, Group, Stack, Avatar, Badge, Rating, TextInput, Textarea } from '@mantine/core';
import {
  IconPencil,
  IconMapPin,
  IconMail,
  IconMessage,
  IconHammer,
  IconGift,
  IconArrowLeft,
  IconLanguage,
  IconUser,
} from '@tabler/icons-react';
import { getSkillIcon } from '@/lib/skillIcons';
import { Layout } from '@/components/common/Layout';
import type { Review } from '@/types';

// Review Card Component using Mantine
function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations();

  return (
    <Paper radius="lg" p="lg" withBorder>
      <Group align="flex-start" gap="md">
        <Avatar
          src={review.writer.profile_picture}
          alt={`${review.writer.first_name} ${review.writer.last_name}`}
          size="lg"
          radius="xl"
          className="border-2 border-eco-primary/20"
        />
        <Stack gap="xs" className="flex-1">
          <Group justify="space-between">
            <Title order={5}>
              {review.writer.first_name} {review.writer.last_name}
            </Title>
            <Rating value={review.rating} readOnly size="sm" color="eco-terracotta" />
          </Group>
          <Text size="sm" c="dimmed">
            {new Date(review.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text size="sm">{review.feedback}</Text>

          {review.response && (
            <Paper radius="md" p="sm" bg="var(--mantine-color-eco-primary-light)" className="border-l-2 border-eco-primary">
              <Text size="sm" fw={600} c="eco-primary" mb={4}>
                {t('profile.yourResponse') || 'Your response'}
              </Text>
              <Text size="sm" c="dimmed">{review.response}</Text>
            </Paper>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}

// Edit Profile Form using Mantine
function EditProfileForm({ user, onSave, onCancel }: { user: any; onSave: (data: any) => void; onCancel: () => void }) {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    bio: user.bio,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Paper radius="lg" p="xl" withBorder>
      <Title order={2} className="font-display" mb="lg">
        {t('profile.editProfile') || 'Edit Profile'}
      </Title>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group grow>
            <TextInput
              label={t('auth.firstName') || 'First Name'}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              radius="lg"
            />
            <TextInput
              label={t('auth.lastName') || 'Last Name'}
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              radius="lg"
            />
          </Group>

          <Textarea
            label={t('profile.bio') || 'About me'}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder={t('profile.bioPlaceholder') || 'Tell others about yourself...'}
            radius="lg"
            minRows={4}
          />
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="outline" radius="xl" onClick={onCancel}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" radius="xl" color="eco-primary">
            {t('common.save') || 'Save Changes'}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}

export function ProfileClient() {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('@/services/profile').then(({ profileService }) => {
      profileService.getProfile()
        .then(data => { setUser(data); setLoading(false); })
        .catch(err => { setError('Failed to load profile'); setLoading(false); });
    });
  }, []);

  const handleSave = (data: any) => {
    setUser({ ...user, ...data });
    setIsEditing(false);
  };

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
              {t('profile.backToProfile') || 'Back to Profile'}
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
        <Container size="md">
          {/* Profile Header Card */}
          <Paper radius="lg" p="xl" withBorder mb="xl">
            <Group align="flex-start" gap="lg" wrap="wrap">
              {/* Avatar */}
              <Avatar
                src={user.profile_picture}
                alt={`${user.first_name} ${user.last_name}`}
                size={96}
                radius="xl"
                className="border-4 border-eco-primary/20"
              />

              {/* User Info */}
              <Stack gap="xs" className="flex-1" style={{ minWidth: 200 }}>
                <Group justify="space-between" wrap="wrap">
                  <div>
                    <Title order={1} className="font-display">
                      {user.first_name} {user.last_name}
                    </Title>
                    <Group gap="xs" mt={4}>
                      <IconMail size={16} className="text-gray-500" />
                      <Text c="dimmed">{user.email}</Text>
                    </Group>

                    {user.review_count > 0 && (
                      <Group gap="xs" mt="sm">
                        <Rating value={user.average_rating} readOnly fractions={2} color="eco-terracotta" />
                        <Text size="sm" c="dimmed">
                          ({user.review_count} {user.review_count === 1 ? (t('profile.review') || 'review') : (t('profile.reviews') || 'reviews')})
                        </Text>
                      </Group>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    radius="xl"
                    leftSection={<IconPencil size={18} />}
                    onClick={() => setIsEditing(true)}
                  >
                    {t('profile.editProfile') || 'Edit Profile'}
                  </Button>
                </Group>
              </Stack>
            </Group>

            {/* Bio */}
            {user.bio && (
              <Stack gap="xs" mt="xl" pt="lg" className="border-t border-gray-100">
                <Group gap="xs">
                  <IconUser size={16} className="text-gray-500" />
                  <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                    {t('profile.about') || 'About'}
                  </Text>
                </Group>
                <Text className="whitespace-pre-wrap">{user.bio}</Text>
              </Stack>
            )}

            {/* Details Grid */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Location */}
              {user.address && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconMapPin size={16} className="text-eco-terracotta" />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                      {t('profile.location') || 'Location'}
                    </Text>
                  </Group>
                  <Text fw={500}>{user.address.city}, {user.address.country?.name}</Text>
                </Stack>
              )}

              {/* Date of Birth */}
              {user.date_of_birth && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconGift size={16} className="text-eco-terracotta" />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                      {t('profile.birthday') || 'Birthday'}
                    </Text>
                  </Group>
                  <Text fw={500}>
                    {new Date(user.date_of_birth).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </Stack>
              )}

              {/* Languages */}
              {user.languages && user.languages.length > 0 && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconLanguage size={16} className="text-eco-terracotta" />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                      {t('profile.languages') || 'Languages'}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    {user.languages.map((lang: any) => (
                      <Badge key={lang.code} variant="light" color="eco-primary" size="sm">
                        {lang.name}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconHammer size={16} className="text-eco-terracotta" />
                    <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                      {t('profile.skills') || 'Skills'}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    {user.skills.map((skill: any) => (
                      <Badge key={skill.code} variant="light" color="eco-primary" size="sm">
                        {skill.icon} {skill.display_name_en}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}
            </div>
          </Paper>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <Stack gap="md">
              <Group gap="sm">
                <IconMessage size={24} className="text-eco-primary" />
                <Title order={2} className="font-display">
                  {t('profile.reviewsTitle') || 'Reviews'} ({reviews.length})
                </Title>
              </Group>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </Stack>
          )}
        </Container>
      </div>
    </Layout>
  );
}
