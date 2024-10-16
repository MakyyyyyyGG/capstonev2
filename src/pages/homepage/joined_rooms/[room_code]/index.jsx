import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Tabs, Tab } from "@nextui-org/react";
import { SquareLibrary, Shapes, GraduationCap } from "lucide-react";
import StudentList from "@/pages/components/StudentList";
import ClassWorkList from "@/pages/components/ClassWorkList";
import SidebarStudent from "@/pages/components/SidebarStudent";
import Header from "@/pages/components/Header";

const fetchRoomDetails = async (room_code, setRoomData) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/room_details?room_code=${room_code}`
    );
    const data = await res.json();
    setRoomData(data.roomsData);
    console.log(data);
  } catch (error) {
    console.error("Error fetching room details:", error);
  }
};

const IndividualRoom = () => {
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const { data: session } = useSession();
  const [roomData, setRoomData] = useState(null);
  const router = useRouter();
  const { room_code } = router.query;
  const [games, setGames] = useState([]);
  const fetchGames = async () => {
    const response = await fetch(
      `/api/games/fetch_games?room_code=${room_code}`
    );
    const data = await response.json();
    setGames(data);
    // console.log("data:", data);
  };
  const [selectedTab, setSelectedTab] = useState("classroom");

  useEffect(() => {
    if (room_code) {
      fetchRoomDetails(room_code, setRoomData);
      fetchGames();
    }
  }, [room_code]);

  // useEffect(() => {
  //   if (roomData) {
  //     setRoomName(roomData[0]?.room_name || "");
  //     setDifficulty(roomData[0]?.room_difficulty || "");
  //   }
  // }, [roomData]);

  if (!roomData) return <p>Loading...</p>;

  return (
    <div className="w-full">
      <div className="">
        <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
          <div className="">
            <div className="flex justify-between items-center">
              <div className="text-3xl font-extrabold mb-2">
                <h1>{roomData[0]?.room_name || "Room"}</h1>
              </div>
            </div>
            <div className="w-full">
              <Tabs
                aria-label="Options"
                color="secondary"
                variant="underlined"
                className="w-full"
                classNames={{
                  tabList:
                    "gap-8 w-full relative rounded-none p-0 border-b-2 border-divider max-sm:gap-4",
                  cursor: "w-full bg-[#7469B6]",
                  tab: "max-w-fit px-0 h-12",
                  tabContent:
                    "group-data-[selected=true]:text-[#7469B6] font-bold max-sm:text-xs",
                }}
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
              >
                <Tab
                  key="classroom"
                  title={
                    <div className="flex items-center space-x-2">
                      <Shapes className="max-sm:w-4 max-sm:h-4" />
                      <span>Classroom</span>
                    </div>
                  }
                ></Tab>
                <Tab
                  key="classworks"
                  title={
                    <div className="flex items-center space-x-2">
                      <SquareLibrary className="max-sm:w-4 max-sm:h-4" />
                      <span>Classworks</span>
                    </div>
                  }
                ></Tab>
                <Tab
                  key="classmates"
                  title={
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="max-sm:w-4 max-sm:h-4" />
                      <span>Classmates</span>
                    </div>
                  }
                ></Tab>
              </Tabs>
            </div>
          </div>
          <div>
            {selectedTab === "classroom" && (
              <div>
                <h1>{roomData[0]?.room_name || "Room"}</h1>
                <p>Difficulty: {roomData[0]?.room_difficulty}</p>
                <p>Room Code: {roomData[0]?.room_code}</p>
                <div className="flex gap-5 my-5">
                  <p>Teacher Username: {roomData[0]?.email}</p>
                  <p>Teacher First Name: {roomData[0]?.first_name}</p>
                  <p>Teacher Last Name: {roomData[0]?.last_name}</p>
                </div>
              </div>
            )}
            {selectedTab === "classworks" && (
              <div className="flex items-center gap-4 w-full">
                <div className="flex flex-col w-full">
                  <ClassWorkList room_code={room_code} games={games} />
                </div>
              </div>
            )}
            {selectedTab === "classmates" && (
              <div className="flex items-center gap-4 w-full">
                <StudentList room_code={room_code} />
              </div>
            )}

            <div className="mt-5"></div>
            {/* Add more details as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualRoom;
