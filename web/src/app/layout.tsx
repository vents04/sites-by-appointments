import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "react-day-picker/style.css";
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/footer';
import CookieConsent from '@/components/CookieConsent';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kerelski Barber & Beauty | Записване на час',
  description: 'Запишете час при Kerelski Barber & Beauty – професионални услуги за мъже и жени. Стилни прически, грижа за брадата и красота на едно място. Резервирайте сега!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <head>
        <link rel="icon" type="image/png" href="/book/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/book/favicon.svg" />
        <link rel="shortcut icon" href="/book/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/book/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Kerelski Barber & Beauty" />
        <link rel="manifest" href="/book/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen max-w-7xl mx-auto">
          {children}
          <Toaster />
        </main>
        <Footer />
        <CookieConsent />
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          // nothing is sent before cookie consent (choice saved by CookieConsent, shared with kerelski.com)
          fbq('consent', (function () { try { return localStorage.getItem('kerelski_cookie_consent'); } catch (e) {} })() === 'granted' ? 'grant' : 'revoke');
          fbq('init', '1636223157974934');
          fbq('track', 'PageView');
        `}</Script>
        <script
          defer
          type="text/javascript"
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        />
      </body>
    </html>
  );
}
