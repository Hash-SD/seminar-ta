import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { upsertUser, storeUserToken } from '@/app/api/db';

// Support both naming conventions for robustness
const googleClientId = process.env.NEXTAUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.NEXTAUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error('Missing Google OAuth environment variables: NEXTAUTH_GOOGLE_ID / GOOGLE_CLIENT_ID');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable');
}

export const runtime = 'nodejs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          // Request offline access to get a refresh token, and read-only access to spreadsheets
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly"
        }
      }
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
        if (!user.email?.endsWith('@student.itera.ac.id') && !user.email?.endsWith('@itera.ac.id')) {
          console.warn(`[Auth] Blocked login attempt from unauthorized domain: ${user.email}`);
          return false;
        }

        try {
            if (user.email && account?.providerAccountId && user.name) {
                // Upsert user basic info
                const dbUser = await upsertUser(user.email, account.providerAccountId, user.name);

                // Save Refresh Token if present (Google sends it only on first login/consent)
                if (account.refresh_token && dbUser && dbUser[0]) {
                    await storeUserToken(dbUser[0].id, account.refresh_token);
                }
            }
        } catch (dbError) {
          console.error('[v0] Database user upsert error:', dbError);
          // Allow sign in to proceed even if DB write fails, but log it.
          return true;
        }
        
        return true;
      } catch (error) {
        console.error('[Auth] Sign in callback error:', error);
        return false;
      }
    },
    async jwt({ token, account }) {
      // Persist access token to the token object
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        // Pass access token to the client session
        // @ts-ignore
        session.accessToken = token.accessToken;
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
