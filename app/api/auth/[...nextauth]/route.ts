import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "@/lib/hash";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user || !user.isActive) {
          throw new Error("Invalid credentials or account inactive");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          assignedClinics: user.assignedClinics.map((id: any) => id.toString()),
          primaryClinic: user.primaryClinic?.toString(),
          preferences: user.preferences,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.assignedClinics = user.assignedClinics;
        token.primaryClinic = user.primaryClinic;
        token.preferences = user.preferences;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.assignedClinics = token.assignedClinics as string[];
        session.user.primaryClinic = token.primaryClinic as string | undefined;
        session.user.preferences = token.preferences as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes (NFR 1.2)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
