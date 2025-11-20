import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllPublicLinks } from '@/app/api/db';
import PublicScheduleViewer from '@/components/public-schedule-viewer';
import { ModeToggle } from '@/components/mode-toggle';

export const revalidate = 0;

export const metadata = {
  title: 'Jadwal Seminar - ITERA',
  description: 'Jadwal seminar mahasiswa Institut Teknologi Sumatera.',
};

export default async function HomePage() {
  const links = await getAllPublicLinks();

  return (
    <div className="min-h-screen bg-background">
      {/* Apple-style Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[980px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
             {/* Simple text logo */}
             <Link href="/" className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity">
                Jadwal Seminar
             </Link>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Admin
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section - Minimalist */}
      <section className="pt-20 pb-16 px-4 text-center max-w-[980px] mx-auto">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-foreground mb-4">
              Jadwal Seminar.
          </h1>
          <p className="text-2xl sm:text-3xl font-medium text-muted-foreground max-w-2xl mx-auto leading-tight">
              Pantau jadwal terkini mahasiswa ITERA.
          </p>
      </section>

      {/* Main Content */}
      <main className="max-w-[980px] mx-auto px-4 pb-24">
        <PublicScheduleViewer links={links} />
      </main>

      {/* Footer */}
      <footer className="bg-secondary/30 py-8 text-center border-t border-border/40">
          <p className="text-xs text-muted-foreground">
              Copyright © {new Date().getFullYear()} Institut Teknologi Sumatera. All rights reserved.
          </p>
      </footer>
    </div>
  );
}
