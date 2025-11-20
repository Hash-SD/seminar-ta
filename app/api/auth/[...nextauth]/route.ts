import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { upsertUser } from '@/app/api/db';

if (!process.env.NEXTAUTH_GOOGLE_ID || !process.env.NEXTAUTH_GOOGLE_SECRET) {
  throw new Error('Missing Google OAuth environment variables: NEXTAUTH_GOOGLE_ID and NEXTAUTH_GOOGLE_SECRET');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable');
}

export const runtime = 'nodejs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXTAUTH_GOOGLE_ID,
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET,
    }),
  ],
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log admin login for Vercel monitoring
      console.log(`[Auth] Admin Login Successful: ${user.email} via ${account?.provider} (New User: ${isNewUser})`);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        // Domain validation for ITERA students/admins
        if (!user.email?.endsWith('@student.itera.ac.id')) {
          console.warn(`[Auth] Blocked login attempt from unauthorized domain: ${user.email}`);
          return false;
        }

        try {
            if (user.email && account?.providerAccountId && user.name) {
                await upsertUser(user.email, account.providerAccountId, user.name);
            }
        } catch (dbError) {
          console.error('[v0] Database user upsert error:', dbError);
          // Allow sign in to proceed even if DB write fails, as long as auth is valid?
          // Or fail? Prefer allow if it's just a sync issue, but might break relations.
          // We'll allow it but log it.
          return true;
        }
        
        return true;
      } catch (error) {
        console.error('[Auth] Sign in callback error:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Disable debug logs in production unless needed
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
