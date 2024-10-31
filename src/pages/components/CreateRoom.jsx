import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import {
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Select,
  SelectItem,
} from "@nextui-org/react";
import toast, { Toaster } from "react-hot-toast";
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
      toast.error("Difficulty are required");
      return;
    }

    const createRoomPromise = async () => {
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

      if (!response.ok) {
        throw new Error(result.error || "Failed to create room");
      }

      setRoomName("");
      setDifficulty("Easy");
      onOpenChange(false);
      router.push(`/teacher-dashboard/rooms/${generatedRoomCode}`);
      return result;
    };

    toast.promise(createRoomPromise(), {
      loading: "Creating room...",
      success: "Room created successfully!",
      error: (err) => `Error: ${err.message}`,
    });
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  return (
    <div>
      <Toaster />
      <Button
        onPress={onOpen}
        radius="sm"
        color="secondary"
        startContent={<Plus size={22} />}
      >
        Room
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="3xl"
        radius="sm"
        // classNames={{
        //   body: "pb-6 px-8 max-sm:p-4 max-sm:pb-4",
        //   header: "text-[#F3F3F3] text-3xl p-8 max-sm:p-4 max-sm:text-xl",
        //   footer: "px-8 pb-8 max-sm:px-4 max-sm:pb-4",
        //   base: " text-[#a8b0d3]",
        //   closeButton:
        //     "text-[#fff] text-lg hover:bg-white/5 active:bg-white/10",
        // }}
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
                  <div className="col-span-4 row-span-1 gap-2 flex flex-col">
                    <h1>Room Name</h1>
                    <Input
                      color="secondary"
                      placeholder="Enter room name"
                      radius="sm"
                      variant="bordered"
                      size="lg"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="difficulty" className="block mb-2">
                      Difficulty
                    </label>
                    <div className="w-full flex">
                      <Select
                        className="flex-grow w-full"
                        id="difficulty"
                        radius="sm"
                        size="lg"
                        variant="bordered"
                        value={difficulty}
                        onChange={handleDifficultyChange}
                      >
                        <SelectItem key="Easy" value="Easy">
                          Easy
                        </SelectItem>
                        <SelectItem key="Moderate" value="Moderate">
                          Moderate
                        </SelectItem>
                        <SelectItem key="Hard" value="Hard">
                          Hard
                        </SelectItem>
                      </Select>
                    </div>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  radius="sm"
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  color="secondary"
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
