'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Stack,
  Card,
  Group,
  Text,
  TextInput,
  Textarea,
  Switch,
  Badge,
  Box,
  Button,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconSmoking,
  IconMapPin,
} from '@tabler/icons-react';
import { useLanguages } from '@/hooks/useConvex';

export interface PlaceFormValues {
  title: string;
  accommodationDetails: string;
  foodDetails: string;
  internetProvided: boolean;
  familyFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  languages: string[];
  address: {
    city: string;
    postalCode: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
}

interface PlaceFormProps {
  initialValues?: Partial<PlaceFormValues>;
  onSubmit: (values: PlaceFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function PlaceForm({ initialValues, onSubmit, onCancel, submitLabel }: PlaceFormProps) {
  const t = useTranslations();
  const { languages } = useLanguages();
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<PlaceFormValues>({
    initialValues: {
      title: '',
      accommodationDetails: '',
      foodDetails: '',
      internetProvided: false,
      familyFriendly: false,
      petsAllowed: false,
      smokingAllowed: false,
      languages: [],
      address: {
        city: '',
        postalCode: '',
        countryCode: '',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
      },
      ...initialValues,
    },
    validate: {
      title: (v) => (v.length < 3 ? t('createPlace.validation.titleMin') : null),
      address: {
        city: (v) => (!v ? t('createPlace.validation.cityRequired') : null),
      },
    },
  });

  // Mapbox geocoding (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${token}&types=place,locality,neighborhood&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data.features ?? []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const selectAddress = (feature: any) => {
    const country = feature.context?.find((c: any) => c.id.startsWith('country'));
    const postcode = feature.context?.find((c: any) => c.id.startsWith('postcode'));
    form.setFieldValue('address', {
      city: feature.text,
      postalCode: postcode?.text ?? '',
      countryCode: country?.short_code?.toUpperCase() ?? '',
      latitude: feature.center[1],
      longitude: feature.center[0],
      formattedAddress: feature.place_name,
    });
    setSearchQuery(feature.place_name);
    setSearchResults([]);
  };

  const handleSubmit = async (values: PlaceFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Card withBorder radius="md" padding="md">
          <Stack gap="sm">
            <TextInput
              label={t('createPlace.fields.title')}
              placeholder={t('createPlace.fields.titlePlaceholder')}
              required
              {...form.getInputProps('title')}
            />

            <Box>
              <Text size="sm" fw={500} mb={4}>
                {t('createPlace.fields.address')} *
              </Text>
              <TextInput
                placeholder={t('createPlace.fields.addressPlaceholder')}
                value={searchQuery || form.values.address.formattedAddress}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<IconMapPin size={16} />}
                error={form.errors['address.city']}
              />
              {searchResults.length > 0 && (
                <Stack
                  gap={0}
                  mt={4}
                  p="xs"
                  style={{ border: '1px solid #ddd', borderRadius: 8, background: 'white' }}
                >
                  {searchResults.map((r) => (
                    <Box
                      key={r.id}
                      p={6}
                      style={{ cursor: 'pointer', borderRadius: 4 }}
                      onClick={() => selectAddress(r)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = '#f0f7f0')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Text size="sm">{r.place_name}</Text>
                    </Box>
                  ))}
                </Stack>
              )}
              {form.values.address.formattedAddress && !searchQuery && (
                <Text size="xs" c="dimmed" mt={2}>
                  {form.values.address.formattedAddress}
                </Text>
              )}
            </Box>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="md">
          <Stack gap="sm">
            <Text fw={600}>{t('createPlace.fields.hostingSection')}</Text>
            <Textarea
              label={t('createPlace.fields.accommodation')}
              placeholder={t('createPlace.fields.accommodationPlaceholder')}
              minRows={3}
              {...form.getInputProps('accommodationDetails')}
            />
            <Textarea
              label={t('createPlace.fields.food')}
              placeholder={t('createPlace.fields.foodPlaceholder')}
              minRows={3}
              {...form.getInputProps('foodDetails')}
            />
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="md">
          <Stack gap="sm">
            <Text fw={600}>{t('createPlace.fields.amenitiesSection')}</Text>
            <Group>
              <Switch
                label={t('createPlace.fields.wifi')}
                checked={form.values.internetProvided}
                onChange={(e) => form.setFieldValue('internetProvided', e.currentTarget.checked)}
                thumbIcon={<IconWifi size={12} />}
              />
              <Switch
                label={t('createPlace.fields.familyFriendly')}
                checked={form.values.familyFriendly}
                onChange={(e) => form.setFieldValue('familyFriendly', e.currentTarget.checked)}
                thumbIcon={<IconBabyCarriage size={12} />}
              />
              <Switch
                label={t('createPlace.fields.petsAllowed')}
                checked={form.values.petsAllowed}
                onChange={(e) => form.setFieldValue('petsAllowed', e.currentTarget.checked)}
                thumbIcon={<IconDog size={12} />}
              />
              <Switch
                label={t('createPlace.fields.smokingAllowed')}
                checked={form.values.smokingAllowed}
                onChange={(e) => form.setFieldValue('smokingAllowed', e.currentTarget.checked)}
                thumbIcon={<IconSmoking size={12} />}
              />
            </Group>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="md">
          <Stack gap="sm">
            <Text fw={600}>{t('createPlace.fields.languagesSection')}</Text>
            <Group gap="xs">
              {languages.slice(0, 20).map((lang: any) => {
                const checked = form.values.languages.includes(lang.code);
                return (
                  <Badge
                    key={lang.code}
                    variant={checked ? 'filled' : 'light'}
                    color="dark"
                    radius="xl"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      form.setFieldValue(
                        'languages',
                        checked
                          ? form.values.languages.filter((l) => l !== lang.code)
                          : [...form.values.languages, lang.code]
                      )
                    }
                  >
                    {lang.name}
                  </Badge>
                );
              })}
            </Group>
          </Stack>
        </Card>

        <Group justify="flex-end">
          {onCancel && (
            <Button variant="default" onClick={onCancel} radius="xl">
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" color="eco-primary" loading={submitting} radius="xl">
            {submitLabel ?? t('common.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
