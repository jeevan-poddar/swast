"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const page = () => {
  const [error, seterror] = useState("");
  const router = useRouter();
  const {
    register,
    formState: { errors },
    handleSubmit,
    setError: seterrrors,
  } = useForm();
  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      seterrrors("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }
    const a = await fetch("/api/createUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });
    const res = await a.json();
    // console.log(res);
    if (res.status === 201) {
      seterror("");
      const signin = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (signin.ok) {
        router.push("/");
      } else if (signin.error == "CredentialsSignin") {
        seterror("Invalid email or password");
      } else {
        seterror(signin.error || "Login failed");
      }
    } else if (res.status === 400) {
      seterror("User with this email already exists");
    } else {
      seterror("Internal Server Error");
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-black/70 p-7 shadow-2xl shadow-red-950/30">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
          Join Swast
        </p>
        <h1 className="mb-5 text-3xl font-black text-white">Create Account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-300">{error}</p>}
          <label htmlFor="name">Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p role="alert">{errors.name.message}</p>}
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
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
            })}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
          />
          {errors.confirmPassword && (
            <p role="alert">{errors.confirmPassword.message}</p>
          )}
          <input type="submit" value="Create Account" />
        </form>
        <div className="mt-4">
          <p className="text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-red-300">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default page;
