import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import DeleteRoom from "@/pages/components/DeleteRoom";
import { Settings } from "lucide-react";
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
  CardBody,
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
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session } = useSession();
  const [roomData, setRoomData] = useState(null);
  const [students, setStudents] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const router = useRouter();

  const { room_code } = router.query;

  useEffect(() => {
    if (room_code) {
      fetchRoomDetails(room_code, setRoomData);
      fetchStudents(room_code, setStudents);
    }
  }, [room_code]);

  if (!roomData) return <p>Loading...</p>;

  const updatedRoomName = (key) => {
    setRoomName(key);
  };
  const handleDifficultyChange = (key) => {
    console.log("Selected difficulty:", key); // Debugging line
    setDifficulty(key);
  };

  const handlUpdateRoom = (e) => {
    e.preventDefault();
    console.log(roomName, difficulty);
  };

  return (
    <div>
      <div className="header flex justify-between">
        <div>
          <Tabs
            aria-label="Options"
            size="lg"
            color="secondary"
            className="m-2"
          >
            <Tab key="classroom" title="Classroom">
              Classroom
            </Tab>
            <Tab key="classworks" title="Classworks">
              Classworks
            </Tab>
            <Tab key="students" title="Students">
              <StudentList room_code={room_code} />
            </Tab>
          </Tabs>
        </div>
        <div>
          <Button color="secondary" className="m-2" onPress={onOpen}>
            <Settings />

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full">
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <h1>Room settings</h1>
                        <Button
                          className="mr-4"
                          color="secondary"
                          size="lg"
                          onClick={handlUpdateRoom}
                        >
                          Update
                        </Button>
                      </div>
                      <Divider />
                    </ModalHeader>
                    <ModalBody>
                      <div className="flex justify-center w-[700px] mx-auto">
                        <Card className="w-full">
                          <CardBody>
                            <h1 className="my-4">Room Details</h1>
                            <Input
                              isRequired
                              placeholder={roomData[0]?.room_name}
                              label="Room Name"
                              onChange={(e) => updatedRoomName(e.target.value)}
                            />

                            <Autocomplete
                              className="mt-4"
                              isRequired
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

                            <Dropdown>
                              <DropdownTrigger className="m-4">
                                {roomData ? (
                                  <Button variant="bordered">
                                    {roomData[0].room_difficulty}
                                  </Button>
                                ) : (
                                  <Button variant="bordered">
                                    Choose Difficulty
                                  </Button>
                                )}
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Static Actions"
                                onAction={handleDifficultyChange}
                                // onAction={handleDifficultyChange}
                              >
                                <DropdownItem
                                  key="Easy"
                                  color="success"
                                  className="text-success"
                                >
                                  Easy
                                </DropdownItem>
                                <DropdownItem
                                  key="Moderate"
                                  color="warning"
                                  className="text-warning"
                                >
                                  Moderate
                                </DropdownItem>
                                <DropdownItem
                                  key="Hard"
                                  color="danger"
                                  className="text-danger"
                                >
                                  Hard
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </CardBody>
                        </Card>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button color="danger" variant="light" onPress={onClose}>
                        Close
                      </Button>
                      <Button color="primary" onPress={onClose}>
                        Action
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </Button>
        </div>
      </div>

      <DeleteRoom room={roomData[0]} onRoomDeleted={() => router.back()} />
      <h1>Room Name: {roomData[0]?.room_name || "Room"}</h1>
      <p>Difficulty: {roomData[0]?.room_difficulty}</p>
      <p>Room Code: {roomData[0]?.room_code}</p>
      <div className="flex gap-5 my-5">
        <p>Teacher Username: {roomData[0]?.email}</p>
        <p>Teacher First Name: {roomData[0]?.first_name}</p>
        <p>Teacher Last Name: {roomData[0]?.last_name}</p>
      </div>
      <div className="mt-5"></div>
      {/* Add more details as needed */}
    </div>
  );
};

export default IndividualRoom;
