import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Dashboard from '@/components/dashboard';

export const metadata = {
  title: 'Spreadsheet Reader - Dashboard',
  description: 'Manage and view your Google Sheets data',
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <Dashboard />;
}
