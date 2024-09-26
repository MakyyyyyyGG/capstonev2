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
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

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
      <Header
        isCollapsed={isCollapsedSidebar}
        toggleCollapse={toggleSidebarCollapseHandler}
      />
      <div className="flex border-2">
        <Sidebar
          isCollapsed={isCollapsedSidebar}
          toggleCollapse={toggleSidebarCollapseHandler}
        />
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
