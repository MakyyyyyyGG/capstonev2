import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import DeleteRoom from "@/pages/components/DeleteRoom";
import { Settings, SquareLibrary, Shapes, GraduationCap } from "lucide-react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import CreateClassWork from "@/pages/components/CreateClassWork";
import ClassWorkList from "@/pages/components/ClassWorkList";
import {
  Autocomplete,
  AutocompleteItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import StudentList from "@/pages/components/StudentList";
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

const fetchStudents = async (room_code, setStudents) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/students_list?room_code=${room_code}`
    );
    const data = await res.json();
    setStudents(data.studentsData);
  } catch (error) {
    console.error("Error fetching students:", error);
  }
};

const IndividualRoom = () => {
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session } = useSession();
  const [roomData, setRoomData] = useState(null);
  const [games, setGames] = useState([]);
  const [students, setStudents] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedTab, setSelectedTab] = useState("classroom");
  const router = useRouter();

  const { room_code } = router.query;
  const fetchGames = async () => {
    const response = await fetch(
      `/api/games/fetch_games?room_code=${room_code}`
    );
    const data = await response.json();
    setGames(data);
    // console.log("data:", data);
  };

  useEffect(() => {
    fetchGames(); // Preload games data while on classroom tab
  }, [room_code]);

  useEffect(() => {
    if (room_code) {
      fetchRoomDetails(room_code, setRoomData);
      fetchStudents(room_code, setStudents);
    }
  }, [room_code]);

  useEffect(() => {
    if (roomData) {
      setRoomName(roomData[0]?.room_name || "");
      setDifficulty(roomData[0]?.room_difficulty || "");
    }
  }, [roomData]);

  if (!roomData) return <p>Loading...</p>;

  const updatedRoomName = (key) => {
    setRoomName(key);
  };
  const handleDifficultyChange = (key) => {
    console.log("Selected difficulty:", key); // Debugging line
    setDifficulty(key);
  };

  const handlUpdateRoom = async (e) => {
    e.preventDefault();
    if (difficulty === "" && roomName === "") {
      alert("Input at least one field");
      if (difficulty === "") {
        setDifficulty(roomData[0]?.room_difficulty);
      }
      if (roomName === "") {
        setRoomName(roomData[0]?.room_name);
      }
    }

    const updatedRoomData = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_name: roomName || roomData[0]?.room_name,
        room_difficulty: difficulty || roomData[0]?.room_difficulty,
      }),
    };

    try {
      const response = await fetch(
        `/api/accounts_teacher/room/create_room?room_code=${room_code}`,
        updatedRoomData
      );
      const result = await response.json();
      if (response.ok) {
        console.log("Room updated successfully", result);
      } else {
        console.error("Error updating room:", result.error);
      }
    } catch (error) {
      console.error("Error updating room:", error);
    }
    setDifficulty("");
    setRoomName("");
    onOpenChange(false);

    fetchRoomDetails(room_code, setRoomData);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <div className="">
        <div className="flex justify-between items-center">
          <div className="text-3xl font-extrabold mb-2">
            <h1>{roomData[0]?.room_name || "Room"}</h1>
          </div>
          <div className="flex gap-2">
            <CreateClassWork room_code={room_code} />
            <Button
              isIconOnly
              className="bg-[#7469B6] text-white border-0"
              onPress={onOpen}
            >
              <Settings />

              <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full">
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        <h1>Room settings</h1>

                        <Divider />
                      </ModalHeader>
                      <ModalBody>
                        <div className="flex justify-center w-full mx-auto">
                          <Card className="w-full max-w-[700px] p-4 max-sm:p-2">
                            <CardHeader>
                              <h1 className="text-2xl font-extrabold">
                                Room Details
                              </h1>
                            </CardHeader>
                            <CardBody>
                              <Input
                                placeholder={roomData[0]?.room_name}
                                label="Room Name"
                                onChange={(e) =>
                                  updatedRoomName(e.target.value)
                                }
                              />

                              <Autocomplete
                                className="mt-4"
                                label="Select a difficulty"
                                placeholder={roomData[0].room_difficulty}
                                onSelectionChange={handleDifficultyChange}
                              >
                                <AutocompleteItem
                                  key="Easy"
                                  value="Easy"
                                  color="success"
                                >
                                  Easy
                                </AutocompleteItem>
                                <AutocompleteItem
                                  key="Moderate"
                                  value="Moderate"
                                  color="warning"
                                >
                                  Moderate
                                </AutocompleteItem>
                                <AutocompleteItem
                                  key="Hard"
                                  value="Hard"
                                  color="danger"
                                >
                                  Hard
                                </AutocompleteItem>
                              </Autocomplete>
                            </CardBody>
                            <CardFooter className="flex justify-end gap-2">
                              <Button
                                className="bg-[#7469B6] text-white border-0"
                                size="md"
                                onClick={handlUpdateRoom}
                              >
                                Update
                              </Button>
                              <Button
                                color="danger"
                                size="md"
                                onPress={onClose}
                              >
                                Cancel
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      </ModalBody>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </Button>
            <DeleteRoom
              room={roomData[0]}
              onRoomDeleted={() => router.back()}
            />
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
            />
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
              key="students"
              title={
                <div className="flex items-center space-x-2">
                  <GraduationCap className="max-sm:w-4 max-sm:h-4" />
                  <span>Students</span>
                </div>
              }
            ></Tab>
          </Tabs>
        </div>
      </div>
      <div>
        {selectedTab === "classroom" && (
          <div>
            <h1>Room Name: {roomData[0]?.room_name || "Room"}</h1>
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
        {selectedTab === "students" && (
          <div className="flex items-center gap-4 w-full">
            <StudentList room_code={room_code} />
          </div>
        )}

        <div className="mt-5"></div>
        {/* Add more details as needed */}
      </div>
    </div>
  );
};

export default IndividualRoom;
