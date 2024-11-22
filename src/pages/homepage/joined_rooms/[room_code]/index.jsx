import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Tabs, Tab } from "@nextui-org/react";
import { SquareLibrary, Trophy, NotebookPen } from "lucide-react";
import ClassWorkList from "@/pages/components/ClassWorkList";
import AssignmentList from "@/pages/components/AssignmentList";
import ScoresIndiv from "@/pages/components/ScoresIndiv";
import Loader from "@/pages/components/Loader";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
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
  const [assignments, setAssignments] = useState([]);
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
      fetchAssignments();
      fetchStudentRecord();
    }
  }, [room_code]);

  useEffect(() => {
    const isFirstRoomJoin = !localStorage.getItem("roomJoined");
    if (isFirstRoomJoin) {
      const timer = setTimeout(() => {
        const driverObj = driver({
          steps: [
            {
              element: "#classworks",
              popover: {
                title: "Classworks",
                description:
                  "Access your teacher's uploaded classwork materials and assignments",
                side: "left",
              },
            },
            {
              element: "#scores",
              popover: {
                title: "Scores",
                description:
                  "View your performance and scores from completed classworks and games",
                side: "left",
              },
            },
          ],
        });
        driverObj.drive();
      }, 500);
      localStorage.setItem("roomJoined", "true");
    }
  }, []);

  const fetchStudentRecord = async () => {
    if (session) {
      try {
        const response = await fetch(
          `/api/student_game_record/individual_student_game_records?account_id=${accountId}&room_code=${room_code}`,
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

  //fetch assignments

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        `/api/assignment/assignment?room_code=${room_code}`
      );
      const data = await response.json();
      setAssignments(data);
      return data;
    } catch (error) {
      console.error("Error fetching assignments:", error);
      throw error;
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
                    tabList:
                      " mt-4  border-gray-300 border bg-white rounded-lg",
                  }}
                  selectedKey={selectedTab}
                  onSelectionChange={setSelectedTab}
                >
                  <Tab
                    id="classworks"
                    key="classworks"
                    title={
                      <div className="flex items-center space-x-2">
                        <SquareLibrary className="max-sm:w-4 max-sm:h-4" />
                        <span>Classworks</span>
                      </div>
                    }
                  ></Tab>
                  <Tab
                    id="scores"
                    key="scores"
                    title={
                      <div className="flex items-center space-x-2">
                        <Trophy className="max-sm:w-4 max-sm:h-4" />
                        <span>Scores</span>
                      </div>
                    }
                  ></Tab>
                  <Tab
                    id="assigment"
                    key="assigment"
                    title={
                      <div className="flex items-center space-x-2">
                        <NotebookPen className="max-sm:w-4 max-sm:h-4" />
                        <span>Assignments</span>
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
              {selectedTab === "assigment" && (
                <div className="flex items-center gap-4 w-full">
                  <AssignmentList assignments={assignments} />
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
