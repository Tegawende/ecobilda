'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { IconHome, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { Layout } from '@/components/common/Layout';

export function NotFoundClient() {
    const t = useTranslations();

    return (
        <Layout>
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="text-center max-w-lg">
                    {/* 404 Illustration */}
                    <div className="relative mb-8">
                        <div className="text-[150px] sm:text-[200px] font-display font-bold text-eco-primary/10 leading-none select-none">
                            404
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-eco-primary/10 flex items-center justify-center">
                                <IconSearch size={48} className="text-eco-primary" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Title & Description */}
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
                        {t('errors.notFound.title') || 'Page not found'}
                    </h1>
                    <p className="text-gray-600 mb-8 text-base sm:text-lg">
                        {t('errors.notFound.description')}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/projects"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-eco-primary text-white font-semibold hover:bg-eco-primaryDark transition-all shadow-lg hover:-translate-y-0.5"
                        >
                            <IconHome size={18} />
                            {t('errors.notFound.browseProjects')}
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-eco-primary hover:text-eco-primary transition-all"
                        >
                            <IconArrowLeft size={18} />
                            {t('errors.notFound.goBack')}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
