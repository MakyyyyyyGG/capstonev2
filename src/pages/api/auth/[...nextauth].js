import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const res = await fetch("http://localhost:3000/api/signin", {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            throw new Error("Failed to authenticate");
          }

          const user = await res.json();
          if (user) {
            return user;
          }
          return null;
        } catch (error) {
          console.error("Error in authorization:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email ?? user.name;

      if (!email) {
        console.error("Email is undefined");
        return false;
      }

      // Check if user exists in the database
      const existingUser = await query({
        query: `
          SELECT account_id, email, password, user_role, first_name, last_name
          FROM students
          WHERE email = ?
          UNION
          SELECT account_id, email, password, user_role, first_name, last_name
          FROM teachers
          WHERE email = ?
        `,
        values: [email, email],
      });

      if (existingUser.length === 0) {
        // User doesn't exist, insert new user
        user.user_role = "teacher"; // Default role

        const result = await query({
          query:
            "INSERT INTO teachers (email, name, provider, identifier, user_role) VALUES (?, ?, ?, ?, ?)",
          values: [
            email,
            user.name || null,
            account.provider,
            user.id,
            user.user_role,
          ],
        });
        user.account_id = result.insertId; // Set the new account_id
        user.first_name = ""; // Default first_name
        user.last_name = ""; // Default last_name
      } else {
        user.first_name = existingUser[0].first_name;
        user.last_name = existingUser[0].last_name;
        user.user_role = existingUser[0].user_role;
        user.account_id = existingUser[0].account_id; // Add account_id to user object
      }

      console.log("SignIn User:", user); // Add this log to debug

      return true;
    },
    async session({ session, token, user }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.first_name = token.firstName;
        session.user.last_name = token.lastName;
        session.user.role = token.role; // Add role to session user object
        session.expires = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      }

      // If the provider is Facebook, use session.user.name as session.user.email
      if (session.user && !session.user.email) {
        session.user.email = session.user.name;
      }

      console.log("Session:", session); // Add this log to debug

      return session;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.account_id; // Use user.account_id as the unique identifier
        token.role = user.user_role; // Add role to token
        token.firstName = user.first_name;
        token.lastName = user.last_name;
      }

      console.log("JWT Token:", token); // Add this log to debug
      console.log("JWT User:", user); // Add this log to debug

      return token;
    },
  },
};

export default NextAuth(authOptions);
