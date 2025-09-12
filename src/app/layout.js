import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from '../context/userContext';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

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
