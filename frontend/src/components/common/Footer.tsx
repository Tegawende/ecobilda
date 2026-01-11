import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconWorld } from '@tabler/icons-react';

export function Footer() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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
        { label: t('footer.projects.howItWorks') || 'How It Works', link: '/about' },
        { label: t('footer.projects.forHosts') || 'For Hosts', link: '/about' },
      ],
    },
    {
      title: t('footer.legal.title') || 'Legal & Support',
      links: [
        { label: t('footer.links.support') || 'Support Us', link: '#' },
        { label: t('footer.links.terms') || 'Terms', link: '#' },
        { label: t('footer.links.privacy') || 'Privacy', link: '#' },
      ],
    },
  ];

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">

            <div className="flex gap-2">
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
                  <a
                    key={link.label}
                    href={link.link}
                    className="text-gray-500 hover:text-eco-primary transition-colors text-sm"
                    onClick={(e) => {
                      if (link.link.startsWith('/')) {
                        e.preventDefault();
                        navigate(link.link);
                        window.scrollTo(0, 0);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            {t('footer.copyright', { year: currentYear }) || `© ${currentYear} Ecobilda. All rights reserved.`}
          </p>

          <div className="relative">
            <IconWorld size={18} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="appearance-none bg-transparent border border-transparent text-gray-700 py-1.5 pl-9 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-eco-primary cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
              <option value="nl">Nederlands</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
