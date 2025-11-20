import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Dashboard from '@/components/dashboard';

export const metadata = {
  title: 'Admin Dashboard - Jadwal Nonton Seminar',
  description: 'Manage spreadsheets and settings',
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <Dashboard />;
}
