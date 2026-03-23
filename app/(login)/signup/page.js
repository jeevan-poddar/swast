"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const page = () => {
  const [error, seterror] = useState("");
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
    console.log(res);
    if (res.status === 201) {
      seterror("");
    } else if (res.status === 400) {
      seterror("User with this email already exists");
    } else {
      seterror("Internal Server Error");
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-30/100 mx-auto mt-10"
      >
        {error && <p className="text-red-500">{error}</p>}
        <label htmlFor="name">Name:</label>
        <input
          className=" border-2 border-green-500"
          {...register("name", { required: "Name is required" })}
          aria-invalid={errors.name ? "true" : "false"}
        />
        {errors.name && <p role="alert">{errors.name.message}</p>}
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
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          className=" border-2 border-green-500"
          {...register("confirmPassword", {
            required: "Please confirm your password",
          })}
          aria-invalid={errors.confirmPassword ? "true" : "false"}
        />
        {errors.confirmPassword && (
          <p role="alert">{errors.confirmPassword.message}</p>
        )}
        <div className=" flex items-center justify-center">
          <input
            className=" p-2 px-4 rounded-full bg-blue-500 w-fit text-white"
            type="submit"
          />
        </div>
      </form>
      <div className="mt-4">
        <p>
          Already have an account?
          <Link href="/signin" className="text-blue-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default page;
