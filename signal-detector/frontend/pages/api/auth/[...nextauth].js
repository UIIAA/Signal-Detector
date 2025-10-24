import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Your name' }
      },
      async authorize(credentials) {
        // In a real app, you would verify the credentials against your database
        // For now, we'll simulate the existing behavior but with proper JWT
        
        if (!credentials?.email) {
          throw new Error('Email is required');
        }

        // Simulate the backend API call to register/login user
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: credentials.email,
              name: credentials.name || credentials.email.split('@')[0],
              email: credentials.email
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Authentication failed');
          }

          const userData = await response.json();
          
          // Return user data for the session
          return {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.name,
            ...userData.user
          };
        } catch (error) {
          throw new Error(error.message || 'Authentication failed');
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