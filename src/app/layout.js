import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from '../context/userContext';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DgtlDigiCard – Instantly Shareable Digital Business Cards",
  description: "A sleek, customizable digital card platform to showcase your identity, grow your network, and stand out — online or offline.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />

        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5VW1K9T1EZ"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5VW1K9T1EZ');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
         <UserProvider>
          {children}
         </UserProvider>
        
      </body>
    </html>
  );
}
