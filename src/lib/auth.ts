import { NextAuthOptions, getServerSession } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { refreshAccessToken } from "./spotify-auth";
import { needsRefresh, minutesUntilExpiry } from "./token-utils";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-read-email user-read-private user-read-recently-played user-top-read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "spotify" && account.access_token) {
        // Upsert user with Spotify data
        await prisma.user.upsert({
          where: { spotifyId: account.providerAccountId },
          update: {
            refreshToken: account.refresh_token,
            accessToken: account.access_token,
            tokenExpiresAt: account.expires_at,
            email: user.email,
            name: user.name,
            image: user.image,
          },
          create: {
            spotifyId: account.providerAccountId,
            email: user.email,
            name: user.name,
            image: user.image,
            refreshToken: account.refresh_token,
            accessToken: account.access_token,
            tokenExpiresAt: account.expires_at,
          },
        });
      }
      return true;
    },
    async jwt({ token, account }) {
      // Initial sign in - save account info to token
      if (account) {
        token.spotifyId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.spotifyId) {
        // Proactive Token Refresh (EC-AUTH-001: Token Death Spiral Prevention)
        // Check if token needs refresh (5-minute buffer)
        const dbUser = await prisma.user.findUnique({
          where: { spotifyId: token.spotifyId as string },
          select: {
            id: true,
            accessToken: true,
            refreshToken: true,
            tokenExpiresAt: true,
          },
        });

        if (dbUser) {
          session.user.id = dbUser.id;

          if (dbUser.tokenExpiresAt && dbUser.refreshToken) {
            // Check if needs refresh (5-minute buffer)
            if (needsRefresh(dbUser.tokenExpiresAt)) {
              try {
                console.log(
                  `[Auth] Refreshing token for user ${dbUser.id} (expires in ${minutesUntilExpiry(dbUser.tokenExpiresAt)} min)`
                );

                const refreshed = await refreshAccessToken(dbUser.refreshToken);

                // Update database with new tokens
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    accessToken: refreshed.accessToken,
                    refreshToken: refreshed.refreshToken, // CRITICAL: Update if rotated
                    tokenExpiresAt: refreshed.expiresAt,
                  },
                });

                console.log(
                  `[Auth] Token refreshed successfully for user ${dbUser.id}`
                );
              } catch (error) {
                console.error(
                  `[Auth] Token refresh failed for user ${dbUser.id}:`,
                  error
                );
                // Don't throw - allow session to continue with expired token
                // Worker will handle JIT refresh
              }
            }
          }
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const auth = () => getServerSession(authOptions);
