import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useSession } from "next-auth/react";
import CreateRoom from "../components/CreateRoom";
import Rooms from "./rooms";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";

const Dashboard = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState([]);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  // Function to fetch roomssm:hidden
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
    <div className="p-4 w-full">
      <div className="w-full">
        <Rooms rooms={rooms} onRoomDeleted={fetchRooms} />
        {/* <div className="absolute bottom-0 right-0 p-5 drop-shadow-lg sm:hidden">
          <CreateRoom onRoomCreated={fetchRooms} />
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
