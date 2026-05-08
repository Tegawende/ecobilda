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
} from '@mantine/core';
import {
  IconWifi,
  IconBabyCarriage,
  IconDog,
  IconSmoking,
  IconMapPin,
} from '@tabler/icons-react';
import { useLanguages } from '@/hooks/useConvex';

export interface PlaceFieldsValues {
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

export const emptyPlaceFieldsValues: PlaceFieldsValues = {
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
};

interface Props {
  values: PlaceFieldsValues;
  onChange: (next: PlaceFieldsValues) => void;
  errors?: { title?: string; addressCity?: string };
}

export function PlaceFieldsSection({ values, onChange, errors }: Props) {
  const t = useTranslations();
  const { languages } = useLanguages();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const set = (patch: Partial<PlaceFieldsValues>) => onChange({ ...values, ...patch });

  const selectAddress = (feature: any) => {
    const country = feature.context?.find((c: any) => c.id.startsWith('country'));
    const postcode = feature.context?.find((c: any) => c.id.startsWith('postcode'));
    set({
      address: {
        city: feature.text,
        postalCode: postcode?.text ?? '',
        countryCode: country?.short_code?.toUpperCase() ?? '',
        latitude: feature.center[1],
        longitude: feature.center[0],
        formattedAddress: feature.place_name,
      },
    });
    setSearchQuery(feature.place_name);
    setSearchResults([]);
  };

  const toggleLang = (code: string) => {
    set({
      languages: values.languages.includes(code)
        ? values.languages.filter((l) => l !== code)
        : [...values.languages, code],
    });
  };

  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="md">
        <Stack gap="sm">
          <TextInput
            label={t('createPlace.fields.title')}
            placeholder={t('createPlace.fields.titlePlaceholder')}
            required
            value={values.title}
            onChange={(e) => set({ title: e.currentTarget.value })}
            error={errors?.title}
          />

          <Box>
            <Text size="sm" fw={500} mb={4}>
              {t('createPlace.fields.address')} *
            </Text>
            <TextInput
              placeholder={t('createPlace.fields.addressPlaceholder')}
              value={searchQuery || values.address.formattedAddress}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconMapPin size={16} />}
              error={errors?.addressCity}
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f7f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Text size="sm">{r.place_name}</Text>
                  </Box>
                ))}
              </Stack>
            )}
            {values.address.formattedAddress && !searchQuery && (
              <Text size="xs" c="dimmed" mt={2}>
                {values.address.formattedAddress}
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
            value={values.accommodationDetails}
            onChange={(e) => set({ accommodationDetails: e.currentTarget.value })}
          />
          <Textarea
            label={t('createPlace.fields.food')}
            placeholder={t('createPlace.fields.foodPlaceholder')}
            minRows={3}
            value={values.foodDetails}
            onChange={(e) => set({ foodDetails: e.currentTarget.value })}
          />
        </Stack>
      </Card>

      <Card withBorder radius="md" padding="md">
        <Stack gap="sm">
          <Text fw={600}>{t('createPlace.fields.amenitiesSection')}</Text>
          <Group>
            <Switch
              label={t('createPlace.fields.wifi')}
              checked={values.internetProvided}
              onChange={(e) => set({ internetProvided: e.currentTarget.checked })}
              thumbIcon={<IconWifi size={12} />}
            />
            <Switch
              label={t('createPlace.fields.familyFriendly')}
              checked={values.familyFriendly}
              onChange={(e) => set({ familyFriendly: e.currentTarget.checked })}
              thumbIcon={<IconBabyCarriage size={12} />}
            />
            <Switch
              label={t('createPlace.fields.petsAllowed')}
              checked={values.petsAllowed}
              onChange={(e) => set({ petsAllowed: e.currentTarget.checked })}
              thumbIcon={<IconDog size={12} />}
            />
            <Switch
              label={t('createPlace.fields.smokingAllowed')}
              checked={values.smokingAllowed}
              onChange={(e) => set({ smokingAllowed: e.currentTarget.checked })}
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
              const checked = values.languages.includes(lang.code);
              return (
                <Badge
                  key={lang.code}
                  variant={checked ? 'filled' : 'light'}
                  color="dark"
                  radius="xl"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleLang(lang.code)}
                >
                  {lang.name}
                </Badge>
              );
            })}
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
