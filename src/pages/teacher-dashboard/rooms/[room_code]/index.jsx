import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import DeleteRoom from "@/pages/components/DeleteRoom";
import {
  Settings,
  SquareLibrary,
  Shapes,
  GraduationCap,
  Trophy,
  Copy,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import CreateClassWork from "@/pages/components/CreateClassWork";
import ClassWorkList from "@/pages/components/ClassWorkList";
import Scores from "@/pages/components/Scores";
import {
  Autocomplete,
  AutocompleteItem,
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
  Button,
  useDisclosure,
  Spinner,
  Chip,
} from "@nextui-org/react";
import StudentList from "@/pages/components/StudentList";
import Loader from "@/pages/components/Loader";

const fetchRoomDetails = async (room_code, setRoomData) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/room_details?room_code=${room_code}`
    );
    const data = await res.json();
    setRoomData(data.roomsData);
  } catch (error) {
    console.error("Error fetching room details:", error);
  }
};

const fetchStudentRecords = async (room_code, setStudentRecords) => {
  try {
    const res = await fetch(`/api/reports/game_records?room_code=${room_code}`);
    const data = await res.json();
    setStudentRecords(data.gameRecords);
  } catch (error) {
    console.error("Error fetching student records:", error);
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session } = useSession();
  const [roomData, setRoomData] = useState(null);
  const [games, setGames] = useState([]);
  const [students, setStudents] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  const [studentRecords, setStudentRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { room_code } = router.query;

  const fetchGames = async () => {
    try {
      const response = await fetch(
        `/api/games/fetch_games?room_code=${room_code}`
      );
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (room_code) {
        setIsLoading(true);
        try {
          await Promise.all([
            fetchGames(),
            fetchRoomDetails(room_code, setRoomData),
            fetchStudents(room_code, setStudents),
            fetchStudentRecords(room_code, setStudentRecords),
          ]);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAllData();
  }, [room_code]);

  useEffect(() => {
    if (roomData) {
      setRoomName(roomData[0]?.room_name || "");
      setDifficulty(roomData[0]?.room_difficulty || "");
    }
  }, [roomData]);

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!difficulty && !roomName) {
      alert("Input at least one field");
      setDifficulty(roomData[0]?.room_difficulty);
      setRoomName(roomData[0]?.room_name);
      return;
    }

    const updatedRoomData = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_name: roomName || roomData[0]?.room_name,
        room_difficulty: difficulty || roomData[0]?.room_difficulty,
      }),
    };

    toast.promise(
      (async () => {
        const response = await fetch(
          `/api/accounts_teacher/room/create_room?room_code=${room_code}`,
          updatedRoomData
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to update room");
        }
        await fetchRoomDetails(room_code, setRoomData);
        return result;
      })(),
      {
        loading: "Updating room...",
        success: "Room updated successfully!",
        error: (err) => `Update failed: ${err.message}`,
      }
    );

    setDifficulty("");
    setRoomName("");
    onOpenChange(false);
  };

  return (
    <div className="w-full">
      <Toaster />
      {isLoading ? (
        <div className="flex justify-center items-center h-screen opacity-50">
          <Loader />
        </div>
      ) : (
        <>
          <div className="flex">
            <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem]  mx-auto">
              <div className="">
                <div className="flex justify-between items-center">
                  <div className="text-3xl font-extrabold">
                    <h1>{roomData[0]?.room_name || "Room"}</h1>
                  </div>
                  <div className="flex gap-2">
                    <CreateClassWork room_code={room_code} />
                    <Button
                      isIconOnly
                      radius="sm"
                      color="secondary"
                      onPress={onOpen}
                    >
                      <Settings />
                    </Button>
                  </div>
                </div>
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
                    key="classroom"
                    title={
                      <div className="flex items-center space-x-2">
                        <Shapes className="max-sm:w-4 max-sm:h-4" size={20} />
                        <span>Classroom</span>
                      </div>
                    }
                  />
                  <Tab
                    key="classworks"
                    title={
                      <div className="flex items-center space-x-2">
                        <SquareLibrary
                          className="max-sm:w-4 max-sm:h-4"
                          size={20}
                        />
                        <span>Classworks</span>
                      </div>
                    }
                  />
                  <Tab
                    key="students"
                    title={
                      <div className="flex items-center space-x-2">
                        <Users className="max-sm:w-4 max-sm:h-4" size={20} />
                        <span>Students</span>
                      </div>
                    }
                  />
                  <Tab
                    key="scores"
                    title={
                      <div className="flex items-center space-x-2">
                        <Trophy className="max-sm:w-4 max-sm:h-4" size={20} />
                        <span>Scores</span>
                      </div>
                    }
                  />
                </Tabs>
              </div>
              <div>
                {selectedTab === "classroom" && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-300  p-6 rounded-lg hover:border-gray-400">
                        <div className="flex gap-2 items-center">
                          <h1 className="text-2xl font-bold">
                            {roomData[0]?.room_name || "Room"}
                          </h1>
                          <Chip
                            variant="flat"
                            color={
                              roomData[0]?.room_difficulty === "Easy"
                                ? "success"
                                : roomData[0]?.room_difficulty === "Medium"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {roomData[0]?.room_difficulty}
                          </Chip>
                        </div>
                        <div className=" flex gap-2 items-center mt-4">
                          <h1 className=" text-2xl font-bold">
                            {roomData[0]?.room_code}
                          </h1>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                roomData[0]?.room_code
                              );
                              toast.success("Copied to clipboard");
                            }}
                          >
                            <Copy size={18} />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-white border p-6 rounded-lg border-gray-300 hover:border-gray-400">
                        <div className="flex items-center justify-between gap-2">
                          <h1 className="text-lg font-semibold">Students</h1>
                          <Users size={20} />
                        </div>
                        <h1 className="text-2xl font-bold mt-2">
                          {students.length}
                        </h1>
                      </div>
                      <div className="bg-white border p-6 rounded-lg border-gray-300 hover:border-gray-400">
                        <div className="flex items-center justify-between gap-2">
                          <h1 className="text-lg font-semibold">Classworks</h1>
                          <SquareLibrary size={20} />
                        </div>
                        <h1 className="text-2xl font-bold mt-2">
                          {games.length}
                        </h1>
                      </div>
                      <div className="col-span-1 md:col-span-3">
                        <Scores
                          studentRecords={studentRecords}
                          students={students}
                        />
                      </div>
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
                    <StudentList students={students} />
                  </div>
                )}
                {selectedTab === "scores" && (
                  <div className="flex items-center gap-4 w-full">
                    <Scores
                      studentRecords={studentRecords}
                      students={students}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
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
                            onChange={(e) => setRoomName(e.target.value)}
                          />
                          <Autocomplete
                            className="mt-4"
                            label="Select a difficulty"
                            placeholder={roomData[0].room_difficulty}
                            onSelectionChange={setDifficulty}
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
                            color="danger"
                            size="md"
                            variant="flat"
                            radius="sm"
                            onPress={onClose}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-purple-700 text-white border-0"
                            size="md"
                            radius="sm"
                            onClick={handleUpdateRoom}
                          >
                            Update
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </ModalBody>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      )}
    </div>
  );
};

export default IndividualRoom;
