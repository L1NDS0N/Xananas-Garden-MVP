import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { SWRConfig } from 'swr';
import { swrConfig } from '../lib/swr-config';
import { CartProvider } from '../context/CartContext';
import '../styles/globals.css';

export type NextPageWithLayout = NextPage &
  AppProps & {
    getLayout?: (page: any) => any;
  };

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? (page => page);

  // Global keyboard shortcut: Ctrl+Alt+Shift+L → opens hidden login
  // Also listen for postMessage from login popup
  useEffect(() => {
    const handleLoginShortcut = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        const loginWindow = window.open(
          '/admin/login',
          '_blank',
          'height=500,width=420'
        );
        if (loginWindow) {
          loginWindow.focus();
          const centerWindow = () => {
            const screenW = window.screen.availWidth;
            const screenH = window.screen.availHeight;
            const w = 420;
            const h = 500;
            loginWindow.moveTo(
              Math.max(0, (screenW - w) / 2),
              Math.max(0, (screenH - h) / 2)
            );
          };
          loginWindow.onload = centerWindow;
        }
      }
    };

    // Listen for login success from popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'LOGIN_SUCCESS' || event.data === 'GOOGLE_LINK_SUCCESS') {
        window.location.reload();
      }
    };

    document.addEventListener('keydown', handleLoginShortcut);
    window.addEventListener('message', handleMessage);
    return () => {
      document.removeEventListener('keydown', handleLoginShortcut);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <SWRConfig value={swrConfig}>
      <CartProvider>
        {getLayout(<Component {...pageProps} />)}
      </CartProvider>
    </SWRConfig>
  );
}

export default MyApp;
