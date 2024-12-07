import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
const about = () => {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated: () => redirect("/"),
  });
  return (
    <div>
      <h1>aabout</h1>
    </div>
  );
};

export default about;
