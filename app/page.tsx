import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAllPublicLinks } from '@/app/api/db';
import PublicScheduleViewer from '@/components/public-schedule-viewer';

export const revalidate = 0; // Disable static caching for this page

export const metadata = {
  title: 'Jadwal Nonton Seminar',
  description: 'Jadwal seminar mahasiswa ITERA',
};

export default async function HomePage() {
  // Fetch all public links
  // In a real scenario, we might want to fetch the data client-side or server-side and pass it.
  // For now, let's just pass the links to the client component which will fetch the data.
  const links = await getAllPublicLinks();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jadwal Nonton Seminar</h1>
            <p className="text-sm text-muted-foreground">Institut Teknologi Sumatera</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PublicScheduleViewer links={links} />
      </main>
    </div>
  );
}
