"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const page = () => {
  const router = useRouter();
  const [error, seterror] = useState("");
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const onSubmit = async (data) => {
    try {
      const a = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (a.ok) {
        router.push("/");
      } else if (a.error == "CredentialsSignin") {
        seterror("Invalid email or password");
      } else {
        seterror(a.error || "Login failed");
      }
    } catch (error) {
      console.log("Error in login page:", error.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-black/70 p-7 shadow-2xl shadow-red-950/30">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
          Welcome Back
        </p>
        <h1 className="mb-5 text-3xl font-black text-white">Sign In</h1>
        {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label htmlFor="email">Email</label>
          <input
            {...register("email", { required: "Email Address is required" })}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && <p role="alert">{errors.email.message}</p>}
          <label htmlFor="password">Password</label>
          <input
            type="password"
            {...register("password", { required: "Password is required" })}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && <p role="alert">{errors.password.message}</p>}
          <input type="submit" value="Sign In" />
        </form>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            Need an account?{" "}
            <Link href="/signup" className="font-semibold text-red-300">
              Sign up
            </Link>
          </p>
          <button
            onClick={async () => {
              await signIn("google", { callbackUrl: "/" });
            }}
            className="bg-red-700"
          >
            Google
          </button>
        </div>
      </section>
    </main>
  );
};

export default page;
