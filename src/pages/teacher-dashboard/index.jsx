import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useSession } from "next-auth/react";
import CreateRoom from "../components/CreateRoom";
import Rooms from "./rooms";

const Dashboard = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState([]);

  // Function to fetch rooms
  const fetchRooms = async () => {
    if (session?.user?.id) {
      const res = await fetch(
        `/api/accounts_teacher/room/create_room?account_id=${session.user.id}`
      );
      const data = await res.json();
      setRooms(data.roomsData);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [session?.user?.id]);

  return (
    <div>
      <Header />
      <div className="flex border-2">
        <Sidebar />
        <div className="p-4 w-full">
          {/* Pass the fetchRooms function to CreateRoom */}
          <CreateRoom onRoomCreated={fetchRooms} />
          <div>
            <Rooms rooms={rooms} onRoomDeleted={fetchRooms} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
