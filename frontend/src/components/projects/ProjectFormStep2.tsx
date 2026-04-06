'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm } from '@mantine/form';
import { useTranslations } from 'next-intl';
import {
  Stack,
  Title,
  Text,
  Textarea,
  Button,
  Group,
  NumberInput,
  Grid,
  Switch,
  Combobox,
  useCombobox,
  InputBase,
  Loader,
} from '@mantine/core';
import {
  IconMapPin,
  IconClock,
  IconHome,
  IconToolsKitchen2,
  IconSearch,
} from '@tabler/icons-react';
import type { ProjectFormData } from '@/app/[locale]/(protected)/create-project/CreateProjectClient';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface CityResult {
  label: string;
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface Step2FormData {
  hoursPerDay: number;
  daysPerWeek: number;
  maxHelpers: number;
  accommodationProvided: boolean;
  accommodationDetails: string;
  foodProvided: boolean;
  foodDetails: string;
}

interface ProjectFormStep2Props {
  data: ProjectFormData;
  onUpdate: (data: Partial<ProjectFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProjectFormStep2({ data, onUpdate, onNext, onBack }: ProjectFormStep2Props) {
  const t = useTranslations();

  // City autocomplete state
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [cityDisplay, setCityDisplay] = useState(() => {
    const city = data.address.city || '';
    const cc = data.address.countryCode || '';
    return city ? `${city}${cc ? `, ${cc}` : ''}` : '';
  });
  const [cityError, setCityError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(
    data.address.city ? {
      label: cityDisplay,
      street: data.address.street,
      streetNumber: data.address.streetNumber,
      city: data.address.city,
      country: '',
      countryCode: data.address.countryCode,
      postalCode: data.address.postalCode,
      latitude: data.address.latitude,
      longitude: data.address.longitude,
    } : null
  );
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });

  const form = useForm<Step2FormData>({
    initialValues: {
      hoursPerDay: data.hoursPerDay || 5,
      daysPerWeek: data.daysPerWeek || 5,
      maxHelpers: data.maxHelpers || 2,
      accommodationProvided: !!data.accommodationDetails,
      accommodationDetails: data.accommodationDetails || '',
      foodProvided: !!data.foodDetails,
      foodDetails: data.foodDetails || '',
    },
    validate: {
      hoursPerDay: (value) => (value < 1 || value > 10 ? t('createProject.step2.validation.hoursRange') : null),
      daysPerWeek: (value) => (value < 1 || value > 7 ? t('createProject.step2.validation.daysRange') : null),
      maxHelpers: (value) => (value < 1 || value > 20 ? t('createProject.step2.validation.maxVolunteersRange') : null),
    },
  });

  const handleCitySearch = useCallback((query: string) => {
    setCityDisplay(query);
    setCityError(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query || query.length < 2 || !MAPBOX_TOKEN) {
      setCityResults([]);
      return;
    }
    setIsSearchingCity(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=address,place&limit=5&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        const results: CityResult[] = (data.features || []).map((f: any) => {
          const ctx = f.context || [];
          const countryCtx = ctx.find((c: any) => c.id?.startsWith('country'));
          const postcodeCtx = ctx.find((c: any) => c.id?.startsWith('postcode'));
          const placeCtx = ctx.find((c: any) => c.id?.startsWith('place'));
          const isAddress = f.place_type?.includes('address');
          return {
            label: f.place_name,
            street: isAddress ? f.text : '',
            streetNumber: isAddress ? (f.address || '') : '',
            city: placeCtx?.text || (isAddress ? '' : f.text),
            country: countryCtx?.text || '',
            countryCode: countryCtx?.short_code?.toUpperCase() || '',
            postalCode: postcodeCtx?.text || '',
            latitude: f.center[1],
            longitude: f.center[0],
          };
        });
        setCityResults(results);
        if (results.length > 0) combobox.openDropdown();
      } catch {
        setCityResults([]);
      } finally {
        setIsSearchingCity(false);
      }
    }, 300);
  }, [combobox]);

  const handleCitySelect = (result: CityResult) => {
    setSelectedCity(result);
    setCityDisplay(result.label);
    setCityError(null);
    combobox.closeDropdown();
  };

  const handleFormSubmit = (formData: Step2FormData) => {
    if (!selectedCity) {
      setCityError(t('createProject.step2.validation.cityRequired'));
      return;
    }

    onUpdate({
      address: {
        street: selectedCity.street,
        streetNumber: selectedCity.streetNumber,
        city: selectedCity.city,
        postalCode: selectedCity.postalCode,
        countryCode: selectedCity.countryCode,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
        formattedAddress: selectedCity.label,
      },
      hoursPerDay: formData.hoursPerDay,
      daysPerWeek: formData.daysPerWeek,
      maxHelpers: formData.maxHelpers,
      accommodationDetails: formData.accommodationProvided ? formData.accommodationDetails : '',
      foodDetails: formData.foodProvided ? formData.foodDetails : '',
    });
    onNext();
  };

  return (
    <form onSubmit={form.onSubmit(handleFormSubmit, () => {
      setTimeout(() => {
        const firstError = document.querySelector('[data-error="true"]');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    })}>
      <Stack gap="xl">
        <div>
          <Title order={2} mb="xs">
            {t('createProject.step2.title')}
          </Title>
          <Text c="dimmed">
            {t('createProject.step2.description')}
          </Text>
        </div>

        {/* Location - City Autocomplete */}
        <Stack gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {t('createProject.step2.location')}
          </Text>

          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
              const result = cityResults.find(r => r.label === val);
              if (result) handleCitySelect(result);
            }}
          >
            <Combobox.Target>
              <InputBase
                placeholder={t('createProject.step2.cityPlaceholder')}
                value={cityDisplay}
                onChange={(e) => handleCitySearch(e.currentTarget.value)}
                onBlur={() => combobox.closeDropdown()}
                leftSection={<IconMapPin size={18} className="text-eco-terracotta" />}
                rightSection={isSearchingCity ? <Loader size={16} /> : null}
                size="md"
                error={cityError}
              />
            </Combobox.Target>

            {cityResults.length > 0 && (
              <Combobox.Dropdown>
                <Combobox.Options>
                  {cityResults.map((result, index) => (
                    <Combobox.Option key={`${result.label}-${index}`} value={result.label}>
                      <Group gap="xs">
                        <IconMapPin size={14} className="text-eco-terracotta" />
                        <Text size="sm">{result.label}</Text>
                      </Group>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            )}
          </Combobox>
        </Stack>

        {/* Work Arrangement */}
        <Stack gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {t('createProject.step2.workArrangement')}
          </Text>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.hoursPerDay')}
                min={1}
                max={10}
                size="md"
                leftSection={<IconClock size={16} />}
                description={t('createProject.step2.hoursPerDayDesc')}
                {...form.getInputProps('hoursPerDay')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.daysPerWeek')}
                min={1}
                max={7}
                size="md"
                description={t('createProject.step2.daysPerWeekDesc')}
                {...form.getInputProps('daysPerWeek')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label={t('createProject.step2.maxVolunteers')}
                min={1}
                max={20}
                size="md"
                description={t('createProject.step2.maxVolunteersDesc')}
                {...form.getInputProps('maxHelpers')}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        {/* Accommodation */}
        <Stack gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {t('createProject.step2.accommodationDetails')}
          </Text>

          <Switch
            label={t('createProject.step2.accommodationProvided')}
            description={t('createProject.step2.accommodationProvidedDesc')}
            checked={form.values.accommodationProvided}
            onChange={(event) => form.setFieldValue('accommodationProvided', event.currentTarget.checked)}
            size="md"
            color="eco-primary"
          />

          {form.values.accommodationProvided && (
            <Textarea
              placeholder={t('createProject.step2.accommodationPlaceholder')}
              minRows={3}
              size="md"
              leftSection={<IconHome size={16} />}
              {...form.getInputProps('accommodationDetails')}
            />
          )}
        </Stack>

        {/* Food */}
        <Stack gap="md">
          <Text size="sm" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {t('createProject.step2.foodDetails')}
          </Text>

          <Switch
            label={t('createProject.step2.foodProvided')}
            description={t('createProject.step2.foodProvidedDesc')}
            checked={form.values.foodProvided}
            onChange={(event) => form.setFieldValue('foodProvided', event.currentTarget.checked)}
            size="md"
            color="eco-primary"
          />

          {form.values.foodProvided && (
            <Textarea
              placeholder={t('createProject.step2.foodPlaceholder')}
              minRows={3}
              size="md"
              leftSection={<IconToolsKitchen2 size={16} />}
              {...form.getInputProps('foodDetails')}
            />
          )}
        </Stack>

        {/* Navigation */}
        <Group justify="space-between" pt="md" className="border-t border-gray-200">
          <Button type="button" onClick={onBack} variant="default">
            {t('createProject.step2.back')}
          </Button>
          <Button type="submit" color="eco-blue">
            {t('createProject.step2.next')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
