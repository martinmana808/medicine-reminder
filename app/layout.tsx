import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { getLanguage } from "@/lib/repo";
import { t } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medicine Reminder",
  description: "Personal medicine reminders with push notifications",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meds",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLanguage();
  const navItems = [
    { href: "/", label: t(lang, "nav.today") },
    { href: "/history", label: t(lang, "nav.history") },
    { href: "/settings", label: t(lang, "nav.settings") },
  ];
  return (
    <html lang={lang} className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <ServiceWorkerRegister />
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
          <div className="mx-auto max-w-xl px-4 py-3 flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-teal-600">
              {t(lang, "app.name")}
            </span>
            <nav className="ml-auto flex gap-1 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-xl flex-1 pt-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </body>
    </html>
  );
}
