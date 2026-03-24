'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
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
    // Use router to switch locale
    router.push('/', { locale: newLocale as any });
  };

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex gap-2">
              <a href="https://www.facebook.com/Ecobilda/" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-eco-primary transition-colors">
                <IconBrandFacebook size={20} stroke={1.5} />
              </a>
              <a href="https://twitter.com/Ecobilda" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-eco-primary transition-colors">
                <IconBrandTwitter size={20} stroke={1.5} />
              </a>
              <a href="https://www.instagram.com/ecobilda/" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-eco-primary transition-colors">
                <IconBrandInstagram size={20} stroke={1.5} />
              </a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h4 className="font-bold text-gray-900">{group.title}</h4>
              <div className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.link}
                    className="text-gray-500 hover:text-eco-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            {t('footer.copyright', { year: currentYear })}
          </p>

          <div className="relative">
            <IconWorld size={18} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={locale}
              onChange={handleLanguageChange}
              className="appearance-none bg-transparent border border-transparent text-gray-700 py-1.5 pl-9 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-eco-primary cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="nl">Nederlands</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
