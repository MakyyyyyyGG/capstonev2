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
  Spinner,
} from "@nextui-org/react";
import Loader from "../components/Loader";

const Dashboard = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState([]);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  // Function to fetch rooms
  const fetchRooms = async () => {
    if (session?.user?.id) {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/accounts_teacher/room/create_room?account_id=${session.user.id}`
        );
        const data = await res.json();
        setRooms(data.roomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setIsLoading(false);
      }
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
