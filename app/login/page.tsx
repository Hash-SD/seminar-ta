import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import LoginPage from '@/components/login-page';

export const metadata = {
  title: 'Login - Spreadsheet Reader',
  description: 'Sign in with your ITERA student account',
};

export default async function Login() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/');
  }

  return <LoginPage />;
}
