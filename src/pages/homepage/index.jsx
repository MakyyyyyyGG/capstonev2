import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import JoinedRoom from "./joined_rooms";

const Index = () => {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState([]);
  const [assignments, setAssignments] = useState([]); // Added state for assignments
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const fetchJoinedRoom = async () => {
    console.log("Function reached");
    if (session?.user?.id) {
      try {
        const res = await fetch(
          `/api/accounts_student/room/join_room?student_id=${session.user.id}`
        );
        const data = await res.json();
        setRooms(data.roomData);
        setAssignments(data.assignments); // Set assignments from the fetched data
      } catch (error) {
        console.error("Error fetching joined rooms:", error);
      }
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchJoinedRoom();
    }
  }, [session?.user?.id, status]);

  return (
    <div className="p-4 w-full">
      <div className=" w-full">
        {/* <JoinRoom onRoomJoin={fetchJoinedRoom} /> */}
        <JoinedRoom
          rooms={rooms}
          assignments={assignments}
          onUnenroll={fetchJoinedRoom}
        />{" "}
        {/* Pass assignments to JoinedRoom */}
      </div>
    </div>
  );
};

export default Index;
