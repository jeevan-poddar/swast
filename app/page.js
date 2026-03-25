"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    console.log("Session provider:", session?.provider);
    if (session?.provider === "google") {
      const googleToCredentials = async () => {
        try {
          const pass = await fetch(`/api/getPass`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session?.user?.email,
            }),
          });
          const passRes = await pass.json();
          console.log("Fetched password for Google user:", passRes);
          const signin = await signIn("credentials", {
            email: session?.user?.email,
            password: passRes.password,
            redirect: false,
          });
          console.log("Sign-in result after Google credentials handling:", signin);
          if (signin.ok) {
            console.log("Successfully signed in with credentials after Google auth");
          } else {
            console.error("Failed to sign in with credentials after Google auth:", signin.error);
          }
        } catch (error) {
          console.error(
            "Error during Google credentials handling:",
            error.message,
          );
        }
      };
      googleToCredentials();
    }
  }, [session, status]);

  return (
    <div className="">
      I am home
      <div className="">
        Click to go to <Link href="/signin">signin</Link>
      </div>
      <div className="">
        Click to go to
        <button onClick={() => signOut()}>Sign out</button>
      </div>
      <div className="">
        Click to go to <Link href="/profile">profile</Link>
      </div>
      <div className="">
        Click to go to <Link href="/activity">activity</Link>
      </div>
    </div>
  );
}
