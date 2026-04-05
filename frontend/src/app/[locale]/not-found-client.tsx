'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { IconHome, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';
import { Center, Stack, Title, Text, Button, Box } from '@mantine/core';

export function NotFoundClient() {
    const t = useTranslations();

    return (
        <Layout>
            <Center mih="70vh" px="md">
                <Stack align="center" maw={512}>
                    {/* 404 Illustration */}
                    <Box pos="relative" mb="md">
                        <div className="text-[150px] sm:text-[200px] font-display font-bold text-eco-primary/10 leading-none select-none">
                            404
                        </div>
                        <Center pos="absolute" top={0} left={0} right={0} bottom={0}>
                            <Center className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-eco-primary/10">
                                <IconSearch size={48} className="text-eco-primary" strokeWidth={1.5} />
                            </Center>
                        </Center>
                    </Box>

                    {/* Title & Description */}
                    <Title order={1} ta="center" className="text-2xl sm:text-3xl font-display">
                        {t('errors.notFound.title') || 'Page not found'}
                    </Title>
                    <Text c="dimmed" ta="center" size="lg">
                        {t('errors.notFound.description')}
                    </Text>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                        <Button
                            component={Link}
                            href="/projects"
                            leftSection={<IconHome size={18} />}
                            radius="xl"
                            size="md"
                            className="bg-eco-primary hover:bg-eco-primaryDark shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            {t('errors.notFound.browseProjects')}
                        </Button>
                        <Button
                            variant="outline"
                            leftSection={<IconArrowLeft size={18} />}
                            radius="xl"
                            size="md"
                            color="gray"
                            onClick={() => window.history.back()}
                            className="border-2 hover:border-eco-primary hover:text-eco-primary transition-all"
                        >
                            {t('errors.notFound.goBack')}
                        </Button>
                    </div>
                </Stack>
            </Center>
        </Layout>
    );
}
