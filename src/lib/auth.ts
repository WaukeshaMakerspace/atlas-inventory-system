import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'wildapricot',
      name: 'WildApricot',
      type: 'oauth',
      authorization: {
        url: 'https://www.waukeshamakers.com/sys/login/OAuthLogin',
        params: {
          scope: 'contacts_me',
        },
      },
      token: 'https://oauth.wildapricot.org/auth/token',
      userinfo: {
        url: `https://api.wildapricot.org/v2.2/accounts/${process.env.WILDAPRICOT_ACCOUNT_ID}/contacts/me`,
        async request(context) {
          const response = await fetch(
            `https://api.wildapricot.org/v2.2/accounts/${process.env.WILDAPRICOT_ACCOUNT_ID}/contacts/me`,
            {
              headers: {
                Authorization: `Bearer ${context.tokens.access_token}`,
              },
            }
          );
          return await response.json();
        },
      },
      clientId: process.env.WILDAPRICOT_CLIENT_ID!,
      clientSecret: process.env.WILDAPRICOT_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.Id?.toString() || profile.id?.toString(),
          name: `${profile.FirstName || ''} ${profile.LastName || ''}`.trim() || profile.DisplayName,
          email: profile.Email,
          image: null,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and user info to the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token;
        token.id = (profile as any).Id?.toString() || (profile as any).id?.toString();
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);
