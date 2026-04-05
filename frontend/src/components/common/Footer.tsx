'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Container, SimpleGrid, Stack, Group, Text, Anchor, Divider, NativeSelect, Box } from '@mantine/core';
import { IconBrandTwitter, IconBrandInstagram, IconBrandFacebook, IconWorld } from '@tabler/icons-react';

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const footerGroups = [
    {
      title: t('footer.about.title') || 'About',
      links: [
        { label: t('footer.about.us') || 'About Us', link: '/about' },
        { label: t('footer.about.contact') || 'Contact', link: '/contact' },
        { label: t('footer.about.faq') || 'FAQ', link: '/faq' },
      ],
    },
    {
      title: t('footer.projects.title') || 'Projects',
      links: [
        { label: t('footer.projects.browse') || 'Browse Projects', link: '/projects' },
        { label: t('footer.projects.howItWorks') || 'How It Works', link: '/how-it-works' },
        { label: t('footer.projects.forHosts') || 'For Hosts', link: '/for-hosts' },
      ],
    },
    {
      title: t('footer.legal.title') || 'Legal',
      links: [
        { label: t('footer.links.terms') || 'Terms', link: '/terms' },
        { label: t('footer.links.privacy') || 'Privacy', link: '/privacy' },
      ],
    },
  ];

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;
    router.push('/', { locale: newLocale as any });
  };

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <Container size="xl" px={{ base: 'lg', lg: 'xl' }}>
        <SimpleGrid cols={{ base: 1, md: 2, lg: 5 }} spacing="xl" mb="xl">
          <Box className="lg:col-span-2">
            <Group gap="xs">
              <Anchor href="https://www.facebook.com/Ecobilda/" target="_blank" rel="noopener noreferrer" c="gray.4" className="hover:text-eco-primary transition-colors" p={8}>
                <IconBrandFacebook size={20} stroke={1.5} />
              </Anchor>
              <Anchor href="https://twitter.com/Ecobilda" target="_blank" rel="noopener noreferrer" c="gray.4" className="hover:text-eco-primary transition-colors" p={8}>
                <IconBrandTwitter size={20} stroke={1.5} />
              </Anchor>
              <Anchor href="https://www.instagram.com/ecobilda/" target="_blank" rel="noopener noreferrer" c="gray.4" className="hover:text-eco-primary transition-colors" p={8}>
                <IconBrandInstagram size={20} stroke={1.5} />
              </Anchor>
            </Group>
          </Box>

          {footerGroups.map((group) => (
            <Stack key={group.title} gap="sm">
              <Text fw={700} c="dark">{group.title}</Text>
              <Stack gap="xs">
                {group.links.map((link) => (
                  <Anchor
                    key={link.label}
                    component={Link}
                    href={link.link}
                    c="dimmed"
                    size="sm"
                    className="hover:text-eco-primary transition-colors"
                  >
                    {link.label}
                  </Anchor>
                ))}
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>

        <Divider color="gray.1" />

        <Group justify="space-between" mt="lg" wrap="wrap" gap="md">
          <Text size="sm" c="gray.4">
            {t('footer.copyright', { year: currentYear })}
          </Text>

          <NativeSelect
            value={locale}
            onChange={handleLanguageChange}
            leftSection={<IconWorld size={18} />}
            size="xs"
            variant="unstyled"
            data={[
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'Français' },
              { value: 'es', label: 'Español' },
              { value: 'de', label: 'Deutsch' },
              { value: 'pt', label: 'Português' },
              { value: 'nl', label: 'Nederlands' },
            ]}
            styles={{
              input: {
                cursor: 'pointer',
              },
            }}
            className="hover:bg-gray-50 rounded-md transition-colors"
          />
        </Group>
      </Container>
    </footer>
  );
}
