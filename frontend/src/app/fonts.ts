import localFont from 'next/font/local';

export const lufgaFont = localFont({
  src: [
    {
      path: './fonts/Lufga-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Lufga-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-lufga',
});