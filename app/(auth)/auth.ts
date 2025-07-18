import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        console.log('[Auth] Authorize called for email:', email);

        const users = await getUser(email);
        console.log('[Auth] Found users:', users.length);

        if (users.length === 0) {
          console.log('[Auth] No user found, comparing with dummy password');
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          console.log('[Auth] User has no password set');
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        console.log('[Auth] Comparing passwords...');
        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) {
          console.log('[Auth] Password mismatch');
          return null;
        }

        console.log('[Auth] Authentication successful for user:', user.id);
        return { ...user, type: 'regular' };
      },
    }),
    // Guest provider removed - no longer supporting guest users
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[Auth JWT Callback] Token:', token.id, 'User:', user?.id);
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      return token;
    },
    async session({ session, token }) {
      console.log(
        '[Auth Session Callback] Creating session for token:',
        token.id,
      );
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }

      return session;
    },
  },
});
