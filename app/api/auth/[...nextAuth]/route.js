import NextAuth from "next-auth";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials, req) {
        try {
          const a = await fetch(`${process.env.NEXTAUTH_URL}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const res = await a.json();
          console.log(res);
          if (res.success) {
            return res.user;
          }
        } catch (error) {
          console.log("Error in authorize function:", error.message);
          return null;
        }
      },
    }),
  ],
};

export default NextAuth(authOptions);
