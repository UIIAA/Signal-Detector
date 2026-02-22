import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '../../../shared/database/db';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Your name' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required');
        }

        try {
          const { rows: existingUsers } = await query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [credentials.email]
          );

          let user;
          if (existingUsers.length > 0) {
            user = existingUsers[0];
          } else {
            const userId = credentials.email;
            const name = credentials.name || credentials.email.split('@')[0];
            const { rows: newUsers } = await query(
              'INSERT INTO users (id, name, email, created_at) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
              [userId, name, credentials.email, new Date()]
            );
            user = newUsers[0];
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error.message);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login' // Error code passed in query string as ?error=
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // CRITICAL: NEXTAUTH_SECRET must be set in environment variables
  // This is validated at runtime - NextAuth will throw if not set
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});