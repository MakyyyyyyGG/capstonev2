import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
const CreateRoom = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [roomName, setRoomName] = useState("");
  const [difficulty, setDifficulty] = useState("");

  // Function to generate a unique 4-digit room code
  const generateRoomCode = async () => {
    let code;
    let unique = false;

    while (!unique) {
      code = Math.floor(1000 + Math.random() * 9000);

      const response = await fetch(
        `/api/accounts_teacher/room/check-room-code?code=${code}`
      );
      const result = await response.json();
      unique = !result.exists;
    }

    return code;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    if (!difficulty) {
      alert("Difficulty is required");
      return;
    }

    try {
      const generatedRoomCode = await generateRoomCode();
      const roomData = {
        account_id: session.user.id,
        room_name: roomName,
        difficulty,
        room_code: generatedRoomCode,
      };

      const response = await fetch("/api/accounts_teacher/room/create_room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/teacher-dashboard/rooms/${generatedRoomCode}`);
        console.log("Room created successfully", result);
      } else {
        console.error("Error creating room:", result.error);
      }
    } catch (error) {
      console.error("Error creating room:", error);
    }

    setRoomName("");
    setDifficulty("");
    onOpenChange(false);
  };

  const handleDifficultyChange = (key) => {
    setDifficulty(key);
  };

  // Function to dynamically set dropdown color based on room difficulty
  const getDropdownBtnColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "success";
      case "moderate":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

  return (
    <div>
      <Button
        isIconOnly
        onPress={onOpen}
        radius="sm"
        color="secondary"
        startContent={<Plus size={22} />}
      ></Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="3xl"
        radius="sm"
        classNames={{
          body: "pb-6 px-8 max-sm:p-4 max-sm:pb-4",
          header: "text-[#F3F3F3] text-3xl p-8 max-sm:p-4 max-sm:text-xl",
          footer: "px-8 pb-8 max-sm:px-4 max-sm:pb-4",
          base: "bg-[#7469B6] text-[#a8b0d3]",
          closeButton:
            "text-[#fff] text-lg hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 ">
                <div>
                  <h1>Create Room</h1>
                </div>
              </ModalHeader>

              <ModalBody>
                <form action="" className="grid grid-cols-4 grid-rows-2 gap-4">
                  <div className="col-span-4 row-span-1">
                    <Input
                      placeholder="Room Name"
                      radius="sm"
                      size="lg"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                  </div>
                  <div className="grid col-span-2 col-start-3 justify-items-end">
                    <Dropdown showArrow placement="left-start">
                      <DropdownTrigger>
                        {difficulty ? (
                          <Button
                            radius="sm"
                            color={getDropdownBtnColor(difficulty)}
                            size="lg"
                            variant="flat"
                            className="bg-white"
                          >
                            {difficulty}
                          </Button>
                        ) : (
                          <Button
                            radius="sm"
                            size="lg"
                            variant="flat"
                            className="bg-white"
                          >
                            Choose Difficulty
                          </Button>
                        )}
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Static Actions"
                        onAction={handleDifficultyChange}
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
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" radius="sm" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="success"
                  radius="sm"
                  onPress={onClose}
                  onClick={handleCreateRoom}
                  className="text-white"
                >
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CreateRoom;
