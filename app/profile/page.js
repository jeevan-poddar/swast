"use client";
import calculateAge from "@/action/ageCalculator";
import {  signOut, useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

const page = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    setError: seterrrors,
    watch,
    setValue,
  } = useForm();
  const { data: session } = useSession();
  useEffect(() => {
    const fetchProfile = async () => {
      const a = await fetch("/api/profileFetch", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const text = await a.text();
      const res = text ? JSON.parse(text) : {};
      if (res.profile) {
        setValue("name", res.profile.name);
        setValue("email", res.profile.email);
        setValue("goal", res.profile.goal);
        setValue("howMuchWeight", res.profile.howMuchWeight);
        setValue("inHowManyDays", res.profile.inHowManyDays);
        setValue("foodType", res.profile.foodType);
        setValue("meat", res.profile.meat);
        setValue("meatPreferenceDays", res.profile.meatPreferenceDays);
        setValue(
          "dob",
          res.profile.dob
            ? new Date(res.profile.dob).toISOString().split("T")[0]
            : "",
        );
        setValue("gender", res.profile.gender);
        setValue("kitchen", res.profile.kitchen);
        setValue("city", res.profile.city);
        setValue("state", res.profile.state);
        setValue("country", res.profile.country);
        setValue("weight", res.profile.weight);
        setValue("height", res.profile.height);
        setValue("allergies", res.profile.allergies);
        setValue("jobType", res.profile.jobType);
      } else {
        setValue("name", session?.user?.name || "");
        setValue("email", session?.user?.email || "");
        setValue("country", "India");
      }
    };
    fetchProfile();
  }, [setValue, session?.user?.email, session?.user?.name]);

  const onSubmit = async (data) => {
    console.log(data);
    const a = await fetch("/api/profileUpdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const text = await a.text();
    const res = text ? JSON.parse(text) : {};
    if (!a.ok) {
      alert(res.message || "Profile update failed");
      return;
    }
    if (res.message === "Profile updated successfully") {
      alert("Profile updated successfully");
      if (data.email !== session?.user?.email) {
        alert("Email updated successfully. Please sign in again.");
        signOut();
      }
    } else {
      alert("Profile update failed");
    }
  };
  return (
    <div>
      <div className="">
        <h1 className="text-2xl font-bold">Profile</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 w-30/100 mx-auto mt-10"
        >
          <label htmlFor="name" className="flex flex-col gap-2">
            Name:
            <input
              className=" border-2 border-green-500"
              {...register("name", { required: "Name is required" })}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && <p role="alert">{errors.name.message}</p>}
          </label>
          <label htmlFor="email" className="flex flex-col gap-2">
            Email:
            <input
              className=" border-2 border-green-500"
              {...register("email", { required: "Email is required" })}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && <p role="alert">{errors.email.message}</p>}
          </label>
          <label htmlFor="goal" className="flex flex-col gap-2">
            Goal:
            <select
              className=" border-2 border-green-500"
              {...register("goal", { required: "Goal is required" })}
              aria-invalid={errors.goal ? "true" : "false"}
            >
              <option value="">Select Goal</option>
              <option value="Lose Weight">Lose Weight</option>
              <option value="Gain Weight">Gain Weight</option>
              <option value="Maintain Weight">Maintain Weight</option>
            </select>
            {errors.goal && <p role="alert">{errors.goal.message}</p>}
          </label>
          {watch("goal") !== "Maintain Weight" && (
            <>
              <label htmlFor="howMuchWeight" className="flex flex-col gap-2">
                How Much Weight (kg):
                <input
                  className=" border-2 border-green-500"
                  type="number"
                  {...register("howMuchWeight", {
                    required: "How Much Weight is required",
                  })}
                  aria-invalid={errors["howMuchWeight"] ? "true" : "false"}
                />
                {errors["HowMuchWeight"] && (
                  <p role="alert">{errors["howMuchWeight"].message}</p>
                )}
              </label>
              <label htmlFor="inHowManyDays" className="flex flex-col gap-2">
                In how many days:
                <input
                  className=" border-2 border-green-500"
                  type="number"
                  {...register("inHowManyDays", {
                    required: "In how many days is required",
                  })}
                  aria-invalid={errors["inHowManyDays"] ? "true" : "false"}
                />
                {errors.inHowManyDays && (
                  <p role="alert">{errors.inHowManyDays.message}</p>
                )}
              </label>
            </>
          )}
          <label htmlFor="foodType" className="flex flex-col gap-2">
            Food Type:
            <select
              className=" border-2 border-green-500"
              {...register("foodType", { required: "Food Type is required" })}
              aria-invalid={errors.foodType ? "true" : "false"}
            >
              <option value="">Select Food Type</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
            </select>
            {errors.foodType && <p role="alert">{errors.foodType.message}</p>}
          </label>
          {watch("foodType") === "Non-Vegetarian" && (
            <div className="">
              <div className="flex flex-col gap-4">
                <label htmlFor="meat">Meat Preference:</label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="chicken"
                    {...register("meat")}
                  />
                  Chicken
                </label>
                <label className="flex gap-2">
                  <input type="checkbox" value="mutton" {...register("meat")} />
                  Mutton
                </label>
                <label className="flex gap-2">
                  <input type="checkbox" value="fish" {...register("meat")} />
                  Fish
                </label>
                <label className="flex gap-2">
                  <input type="checkbox" value="egg" {...register("meat")} />
                  Egg
                </label>
                {errors.meatPreference && (
                  <p role="alert">{errors.meatPreference.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <label htmlFor="meatPreferenceDays">
                  On which days do you eat meat?
                </label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="monday"
                    {...register("meatPreferenceDays")}
                  />
                  Monday
                </label>

                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="tuesday"
                    {...register("meatPreferenceDays")}
                  />
                  Tuesday
                </label>

                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="wednesday"
                    {...register("meatPreferenceDays")}
                  />
                  Wednesday
                </label>

                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="thursday"
                    {...register("meatPreferenceDays")}
                  />
                  Thursday
                </label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="friday"
                    {...register("meatPreferenceDays")}
                  />
                  Friday
                </label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="saturday"
                    {...register("meatPreferenceDays")}
                  />
                  Saturday
                </label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    value="sunday"
                    {...register("meatPreferenceDays")}
                  />
                  Sunday
                </label>
                {errors.meatPreferenceDays && (
                  <p role="alert">{errors.meatPreferenceDays.message}</p>
                )}
              </div>
            </div>
          )}

          <label htmlFor="dob" className="flex flex-col gap-2">
            Date of Birth:
            <input
              className=" border-2 border-green-500"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              {...register("dob", { required: "Date of Birth is required" })}
              aria-invalid={errors.dob ? "true" : "false"}
            />
            {watch("dob") && (
              <p role="alert">Your age is {calculateAge(watch("dob"))}</p>
            )}
            {errors.dob && <p role="alert">{errors.dob.message}</p>}
          </label>
          <label htmlFor="gender" className="flex flex-col gap-2">
            Gender:
            <select
              className=" border-2 border-green-500"
              {...register("gender", { required: "Gender is required" })}
              aria-invalid={errors.gender ? "true" : "false"}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p role="alert">{errors.gender.message}</p>}
          </label>
          <label htmlFor="kitchen" className="flex flex-col gap-2">
            Kitchen:
            <select
              className=" border-2 border-green-500"
              {...register("kitchen", { required: "Kitchen is required" })}
              aria-invalid={errors.kitchen ? "true" : "false"}
            >
              <option value="">Select Kitchen Setup</option>
              <option value="Full Kitchen">Full Kitchen</option>
              <option value="Basic Induction/Stove">
                Basic Induction/Stove
              </option>
              <option value="No Cooking/Hostel Life">
                No Cooking/Hostel Life
              </option>
            </select>
            {errors.kitchen && <p role="alert">{errors.kitchen.message}</p>}
          </label>

          <label htmlFor="city" className="flex flex-col gap-2">
            City:
            <input
              className=" border-2 border-green-500"
              {...register("city", { required: "City is required" })}
              aria-invalid={errors.city ? "true" : "false"}
            />
            {errors.city && <p role="alert">{errors.city.message}</p>}
          </label>
          <label htmlFor="state" className="flex flex-col gap-2">
            State:
            <input
              className=" border-2 border-green-500"
              {...register("state", { required: "State is required" })}
              aria-invalid={errors.state ? "true" : "false"}
            />
            {errors.state && <p role="alert">{errors.state.message}</p>}
          </label>
          <label htmlFor="country" className="flex flex-col gap-2">
            Country:
            <input
              className=" border-2 border-green-500"
              {...register("country", { required: "Country is required" })}
              aria-invalid={errors.country ? "true" : "false"}
            />
            {errors.country && <p role="alert">{errors.country.message}</p>}
          </label>
          <label htmlFor="weight" className="flex flex-col gap-2">
            Weight (kg):
            <input
              className=" border-2 border-green-500"
              type="number"
              {...register("weight", { required: "Weight is required" })}
              aria-invalid={errors.weight ? "true" : "false"}
            />
            {errors.weight && <p role="alert">{errors.weight.message}</p>}
          </label>
          <label htmlFor="height" className="flex flex-col gap-2">
            Height (cm):
            <input
              className=" border-2 border-green-500"
              type="number"
              {...register("height", { required: "Height is required" })}
              aria-invalid={errors.height ? "true" : "false"}
            />
            {errors.height && <p role="alert">{errors.height.message}</p>}
          </label>
          <label htmlFor="allergies" className="flex flex-col gap-2">
            Allergies:
            <input
              className=" border-2 border-green-500"
              type="text"
              {...register("allergies")}
              aria-invalid={errors.allergies ? "true" : "false"}
            />
            {errors.allergies && <p role="alert">{errors.allergies.message}</p>}
          </label>

          <label htmlFor="jobType" className="flex flex-col gap-2">
            Job Type:
            <select
              className=" border-2 border-green-500"
              {...register("jobType", { required: "Job Type is required" })}
              aria-invalid={errors.jobType ? "true" : "false"}
            >
              <option value="">Select Job Type</option>
              <option value="1">
                Sedentary: Sitting for 6+ hours (e.g., Student in lectures, Desk
                job).
              </option>
              <option value="2">
                Lightly Active: Standing/Walking in an office or classroom
                (e.g., Teacher, Lab work).
              </option>
              <option value="3">
                Moderately Active: Constant movement/Light lifting (e.g., Nurse,
                Retail staff, Waiter).
              </option>
              <option value="4">
                Very Active: Intense physical activity or manual labor (e.g.,
                Athlete, Construction worker).
              </option>
            </select>
            {errors.jobType && <p role="alert">{errors.jobType.message}</p>}
          </label>

          <input type="submit" value="Update Profile" />
        </form>
      </div>
    </div>
  );
};

export default page;
