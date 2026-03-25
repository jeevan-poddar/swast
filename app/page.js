"use client";
import {useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
console.log("Session Name:", session?.user?.name);
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
