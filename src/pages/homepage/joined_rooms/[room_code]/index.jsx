import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Tabs, Tab } from "@nextui-org/react";
import { SquareLibrary, Trophy } from "lucide-react";
import StudentList from "@/pages/components/StudentList";
import ClassWorkList from "@/pages/components/ClassWorkList";
import SidebarStudent from "@/pages/components/SidebarStudent";
import Header from "@/pages/components/Header";
import Scores from "@/pages/components/Scores";
import ScoresIndiv from "@/pages/components/ScoresIndiv";
import Loader from "@/pages/components/Loader";
const fetchRoomDetails = async (room_code, setRoomData, setLoading) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/room_details?room_code=${room_code}`
    );
    const data = await res.json();
    setRoomData(data.roomsData);
    console.log(data);
  } catch (error) {
    console.error("Error fetching room details:", error);
  } finally {
    setLoading(false);
  }
};

const IndividualRoom = () => {
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [loading, setLoading] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const { data: session, status } = useSession();
  // console.log(session);
  const [roomData, setRoomData] = useState(null);
  const router = useRouter();
  const { room_code } = router.query;
  const [games, setGames] = useState([]);
  const accountId = session?.user?.id;
  const [studentRecords, setStudentRecords] = useState([]);
  const fetchGames = async () => {
    const response = await fetch(
      `/api/games/fetch_games?room_code=${room_code}`
    );
    const data = await response.json();
    setGames(data);
    // console.log("data:", data);
  };
  const [selectedTab, setSelectedTab] = useState("classworks");

  useEffect(() => {
    if (room_code) {
      setLoading(true); // Ensure loading state is set to true when room_code changes
      fetchRoomDetails(room_code, setRoomData, setLoading);
      fetchGames();
      fetchStudentRecord();
    }
  }, [room_code]);

  // useEffect(() => {
  //   if (roomData) {
  //     setRoomName(roomData[0]?.room_name || "");
  //     setDifficulty(roomData[0]?.room_difficulty || "");
  //   }
  // }, [roomData]);

  const fetchStudentRecord = async () => {
    if (session) {
      try {
        const response = await fetch(
          `/api/student_game_record/individual_student_game_records?account_id=${accountId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        console.log("records", data);
        setStudentRecords(data);
      } catch (error) {
        console.error("Error fetching student record:", error);
      }
    }
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-screen opacity-50">
          <Loader />
        </div>
      ) : (
        <div className="flex">
          <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
            <div className="">
              <div className="flex justify-between items-center">
                <div className="text-3xl font-extrabold mb-2">
                  <h1>{roomData[0]?.room_name || "Room"}</h1>
                </div>
              </div>
              <div className="w-full">
                <Tabs
                  color="secondary"
                  radius="sm"
                  size="lg"
                  aria-label="Options"
                  fullWidth
                  classNames={{
                    tabList: "mt-4  border-gray-300 border bg-white",
                  }}
                  selectedKey={selectedTab}
                  onSelectionChange={setSelectedTab}
                >
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
                    key="scores"
                    title={
                      <div className="flex items-center space-x-2">
                        <Trophy className="max-sm:w-4 max-sm:h-4" />
                        <span>Scores</span>
                      </div>
                    }
                  ></Tab>
                </Tabs>
              </div>
            </div>
            <div>
              {selectedTab === "classworks" && (
                <div className="flex items-center gap-4 w-full">
                  <div className="flex flex-col w-full">
                    <ClassWorkList room_code={room_code} games={games} />
                  </div>
                </div>
              )}
              {selectedTab === "scores" && (
                <div className="flex items-center gap-4 w-full">
                  <ScoresIndiv studentRecords={studentRecords} />
                </div>
              )}

              <div className="mt-5"></div>
              {/* Add more details as needed */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualRoom;
