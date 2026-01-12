import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { NotificationProvider } from './contexts/NotificationContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { theme } from './theme'
import './index.css'
import './i18n'
import App from './App.tsx'

// Mantine styles
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/carousel/styles.css'

// Initialize Mapbox access token and disable telemetry
if (typeof window !== 'undefined' && (window as any).mapboxgl) {
  // Support both variable names for backward compatibility
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || '';
  (window as any).mapboxgl.accessToken = token;

  // Disable telemetry to prevent CORS errors
  if ((window as any).mapboxgl.config) {
    (window as any).mapboxgl.config.API_URL = 'https://api.mapbox.com';
    // Disable telemetry events
    (window as any).mapboxgl.config.collectResourceTiming = false;
  }

  // Override event tracking if available
  if ((window as any).mapboxgl.Evented) {
    const originalEmit = (window as any).mapboxgl.Evented.prototype.emit;
    (window as any).mapboxgl.Evented.prototype.emit = function (event: string, ...args: any[]) {
      // Block telemetry events
      if (event && (event.includes('telemetry') || event.includes('analytics'))) {
        return;
      }
      return originalEmit.apply(this, [event, ...args]);
    };
  }
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications />
        <ModalsProvider>
          <BrowserRouter>
            <NotificationProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </NotificationProvider>
          </BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
