import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          console.log("Authorizing user with credentials:", credentials);
          const a = await fetch(`http://localhost:3000/api/loginUser`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });
          const res = await a.json();
          console.log(res);
          if (res.success && res.user) {
            return {
              _id: res.user._id,
              email: res.user.email,
              name: res.user.name,
            };
          }
          return null;
        } catch (error) {
          console.log("Error in authorize function:", error.message);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  pages: {
    signIn: "/signin", // Your custom login page
  },
};

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id || user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user._id = token._id;
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    },
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          console.log(
            "Google sign-in detected, creating user if not exists:",
            user,
          );
          const res = await fetch(
            `${process.env.NEXTAUTH_URL}/api/createUser`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: user.name,
                email: user.email,
                password: "IS_GOOGLE_AUTH",
              }),
            },
          );
          const result = await res.json();
          if (
            result.message == "User created successfully" ||
            result.message == "User with this email already exists"
          ) {
            console.log(
              "User creation/check completed for Google sign-in:",
              user.email,
            );
            const pass= await fetch(
              `${process.env.NEXTAUTH_URL}/api/getPass`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                }),
              },
            );
            const passRes = await pass.json();
            console.log("Fetched password for Google user:", passRes);
            const signin = await fetch(
              `${process.env.NEXTAUTH_URL}/api/loginUser`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  password: passRes.password,
                }),
              },
            );
            const signinResult = await signin.json();
            console.log("Sign-in result for Google user:", signinResult);
          }
        } catch (error) {
          console.error("Error creating user during sign-in:", error);
        }
      }
      return true; // Allow sign in for other providers
    },
  },
});
export { handler as GET, handler as POST };
