import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Project: Minecraft",
  description: "Secure registration and authentication platform for Project: Minecraft. // Платформа безопасной регистрации и аутентификации.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-body min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground`}>
        <LanguageProvider>
          <div className="scanlines" />
          <div className="relative z-10">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
