import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "../components/header";
import SidebarStudent from "../components/SidebarStudent";
import JoinRoom from "../components/JoinRoom";
import JoinedRoom from "./joined_rooms";

const Index = () => {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState([]);

  const fetchJoinedRoom = async () => {
    console.log("Function reached");
    if (session?.user?.id) {
      try {
        const res = await fetch(
          `/api/accounts_student/room/join_room?student_id=${session.user.id}`
        );
        const data = await res.json();
        setRooms(data.roomData);
        console.log("room data: ", data);
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
    <div>
      <Header />
      <div className="flex border-2">
        <div className="flex flex-col  m-4 p-4 border-2 w-[200px]">
          <JoinRoom onRoomJoin={fetchJoinedRoom} />
          <SidebarStudent />
        </div>
        <div className="border-2 -black w-full">
          <h1 className="border-2">Student dashboard</h1>
          <div>
            <JoinedRoom rooms={rooms} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
