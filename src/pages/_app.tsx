import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
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

  return getLayout(<Component {...pageProps} />);
}

export default MyApp;
