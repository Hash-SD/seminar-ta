import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sql } from '@vercel/postgres';

if (!process.env.NEXTAUTH_GOOGLE_ID || !process.env.NEXTAUTH_GOOGLE_SECRET) {
  throw new Error('Missing Google OAuth environment variables: NEXTAUTH_GOOGLE_ID and NEXTAUTH_GOOGLE_SECRET');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXTAUTH_GOOGLE_ID,
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!user.email?.endsWith('@student.itera.ac.id')) {
          console.log('[v0] Invalid email domain:', user.email);
          return false;
        }

        try {
          await sql`
            INSERT INTO users (email, google_id, name)
            VALUES (${user.email}, ${account?.providerAccountId}, ${user.name})
            ON CONFLICT (google_id) DO UPDATE SET 
            updated_at = CURRENT_TIMESTAMP,
            name = EXCLUDED.name
          `;
        } catch (dbError) {
          console.log('[v0] Database insert error:', dbError);
          return true;
        }
        
        return true;
      } catch (error) {
        console.error('[v0] Sign in error:', error);
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
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
