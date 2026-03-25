"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

const page = () => {
  const [activityList, setActivityList] = useState([]);
  const [indexForUpdate, setIndexForUpdate] = useState("");
  const [active, setActive] = useState("");
  const { data: session, status } = useSession();
  const fetchActivity = async () => {
    if (!session?.user?._id) {
      return;
    }
    console.log("Fetching activities for user_id:", session?.user?._id);
    const a = await fetch("/api/activityFetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: session?.user?._id,
      }),
    });
    const res = await a.json();
    console.log(res.activities);
    setActivityList(res.activities);
  };
  useEffect(() => {
    fetchActivity();
  }, [session]);
  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm();

  const handleAdd = async (data) => {
    const a = await fetch("/api/activityUpdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        function: "add",
        _id: session?.user?._id,
      }),
    });
    const res = await a.json();
    console.log(res.message);
    setActive("");
    fetchActivity();
  };
  const handleEdit = async (data) => {
    const a = await fetch("/api/activityUpdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        function: "edit",
        index: indexForUpdate,
      }),
    });
    const res = await a.json();
    console.log(res.message);
    setActive("");
    fetchActivity();
  };
  const handleDelete = async (activityId) => {
    console.log("Deleting activity with ID:", activityId);
    const a = await fetch("/api/activityUpdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function: "delete",
        index: activityId,
      }),
    });
    const res = await a.json();
    console.log(res.message);
    setActive("");
    fetchActivity();
  };
  return (
    <div className="">
      <div className="w-screen h-screen ">
        <h1 className="text-2xl font-bold">Activity</h1>
        <div className="flex flex-col">
          <div className=" w-screen h-[30px] bg-gray-300 px-5 grid grid-cols-6 items-center font-bold ">
            <div className="">S.no.</div>
            <div className="">Activity Name</div>
            <div className="">Duration in mins</div>
            <div className="">Start Time</div>
            <div className="">Days</div>
            <div className="">Action</div>
          </div>
          {activityList.map((activity, index) => (
            <div
              key={index}
              className={
                "w-screen grid grid-cols-6 items-center px-5 min-h-[40px]" +
                (index % 2 === 0 ? " bg-slate-100" : " bg-slate-300")
              }
            >
              <div className="">{index + 1}</div>
              <div className="">{activity.activityName}</div>
              <div className="">{activity.duration}</div>
              <div className="">
                {new Date(
                  `1970-01-01T${activity.startTime}:00`,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="">{activity.days.join(", ")}</div>
              <div className="flex gap-2  items-center">
                <button
                  onClick={() => {
                    setActive("edit");
                    setIndexForUpdate(activity._id);
                    setValue("activityName", activity.activityName);
                    setValue("duration", activity.duration);
                    setValue("startTime", activity.startTime);
                    setValue("days", activity.days);
                  }}
                  className="bg-blue-500 text-white py-1 px-2 rounded-md h-fit"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    console.log("Deleting activity with ID:", activity._id);
                    handleDelete(activity._id);
                  }}
                  className="bg-red-500 text-white py-1 px-2 rounded-md h-fit"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center my-4">
          <button
            className=""
            onClick={() => {
              setActive("add");
              setValue("activityName", "");
              setValue("duration", "");
              setValue("startTime", "");
              setValue("days", []);
            }}
          >
            Add
          </button>
        </div>
      </div>
      {active != "" && (
        <div className="w-screen h-screen bg-black/20 absolute top-0 z-1"></div>
      )}
      {active == "add" && (
        <div className="w-screen h-screen bg-black/20 absolute top-0 z-1 flex flex-col justify-center items-center">
          <div className="w-[400px] min-h-[500px] bg-white rounded-lg p-4 flex flex-col gap-4 relative">
            <h1 className="text-xl font-bold">Add Activity</h1>
            <span
              className="absolute top-0 right-0 p-4 cursor-pointer"
              onClick={() => setActive("")}
            >
              X
            </span>
            <form
              onSubmit={handleSubmit(handleAdd)}
              className="flex flex-col gap-2"
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="activityName" className="flex flex-col gap-2">
                  Activity Name
                  <input
                    type="text"
                    id="activityName"
                    {...register("activityName", { required: true })}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.activityName && (
                    <span className="text-red-500">
                      Activity Name is required
                    </span>
                  )}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="duration" className="flex flex-col gap-2">
                  Duration in mins
                  <input
                    type="number"
                    id="duration"
                    {...register("duration", { required: true })}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.duration && (
                    <span className="text-red-500">Duration is required</span>
                  )}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="startTime" className="flex flex-col gap-2">
                  Start Time
                  <input
                    type="time"
                    id="startTime"
                    {...register("startTime", { required: true })}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.startTime && (
                    <span className="text-red-500">Start Time is required</span>
                  )}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="days" className="flex flex-col gap-2">
                  Days
                  <div className="flex flex-col flex-wrap gap-2">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <div key={day} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={day}
                          value={day}
                          {...register("days", { required: true })}
                          className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor={day}>{day}</label>
                      </div>
                    ))}
                  </div>
                  {errors.days && (
                    <span className="text-red-500">Days are required</span>
                  )}
                </label>
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
              >
                Add Activity
              </button>
            </form>
          </div>
        </div>
      )}
      {active == "edit" && (
        <div className="w-screen h-screen bg-black/20 absolute top-0 z-1 flex flex-col justify-center items-center">
          <div className="w-[400px] min-h-[500px] bg-white rounded-lg p-4 flex flex-col gap-4 relative">
            {" "}
            <h1 className="text-xl font-bold">Edit Activity</h1>
            <span
              className="absolute top-0 right-0 p-4 cursor-pointer"
              onClick={() => setActive("")}
            >
              X
            </span>
            <form
              onSubmit={handleSubmit(handleEdit)}
              className="flex flex-col gap-2"
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="activityName" className="flex flex-col gap-2">
                  Activity Name
                  <input
                    type="text"
                    id="activityName"
                    {...register("activityName", { required: true })}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.activityName && (
                    <span className="text-red-500">
                      Activity Name is required
                    </span>
                  )}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="duration" className="flex flex-col gap-2">
                  Duration in mins
                  <input
                    type="number"
                    id="duration"
                    {...register("duration", { required: true })}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.duration && (
                    <span className="text-red-500">Duration is required</span>
                  )}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="startTime" className="flex flex-col gap-2">
                  Start Time
                  <input
                    type="time"
                    id="startTime"
                    {...register("startTime", { required: true })}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.startTime && (
                    <span className="text-red-500">Start Time is required</span>
                  )}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="days" className="flex flex-col gap-2">
                  Days
                  <div className="flex flex-col flex-wrap gap-2">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <div key={day} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id={day}
                          value={day}
                          {...register("days", { required: true })}
                          className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor={day}>{day}</label>
                      </div>
                    ))}
                  </div>
                  {errors.days && (
                    <span className="text-red-500">Days are required</span>
                  )}
                </label>
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
              >
                Edit Activity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
