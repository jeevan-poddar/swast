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
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-30/100 mx-auto mt-10"
      >
        <label htmlFor="email">Email:</label>
        <input
          className=" border-2 border-green-500"
          {...register("email", { required: "Email Address is required" })}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && <p role="alert">{errors.email.message}</p>}
        <label htmlFor="password">Password:</label>
        <input
          className=" border-2 border-green-500"
          {...register("password", { required: "Password is required" })}
          aria-invalid={errors.password ? "true" : "false"}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}

        <input type="submit" />
      </form>
      <div className="mt-4">
        <p>
          Don't have an account?
          <Link href="/signup" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      <div className="">
        Continue with Google
        <button
          onClick={async () => {
            const a = await signIn("google", { callbackUrl: "/" });
          }}
          className="ml-2 px-4 py-2 bg-red-500 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default page;
