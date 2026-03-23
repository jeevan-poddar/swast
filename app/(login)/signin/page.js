"use client";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";

const page = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const onSubmit = (data) => console.log(data);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
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
    </div>
  );
};

export default page;
