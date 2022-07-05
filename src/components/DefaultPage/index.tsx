import Head from 'next/head';
import React from 'react';

type DefaultPageProps = {
  title: string;
  children: React.ReactNode;
};

const DefaultPage = ({ title, children }: DefaultPageProps) => {
  let fullTitle = `${title} • Xananas’ Garden`;
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta property="og:title" content={fullTitle} key="title" />
        <meta property="og:site_name" content="Xananas' Garden" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png"></link>
      </Head>
      {children}
    </>
  );
};

export default DefaultPage;
