import type { ReactNode } from 'react';
import { AppShell, Box } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter = false }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const isTransparent = isHomePage && !scrolled;

  return (
    <>
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppShell
        header={{ height: isHomePage ? 0 : 64 }}
      >
        <AppShell.Header
          style={{
            backgroundColor: isTransparent ? 'transparent' : 'var(--mantine-color-white)',
            borderBottom: isTransparent ? 'none' : '1px solid var(--mantine-color-gray-2)',
            position: isHomePage ? 'fixed' : 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            width: '100%',
            minHeight: '64px', // Force height for content visibility
            transition: 'background-color 0.3s ease, border-bottom 0.3s ease',
          }}
        >
          <Navbar />
        </AppShell.Header>

        <AppShell.Main id="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', padding: 0 }}>
          <Box style={{ flex: 1 }}>
            {children}
          </Box>
          {!hideFooter && <Footer />}
        </AppShell.Main>
      </AppShell>
    </>
  );
}
