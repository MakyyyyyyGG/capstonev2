import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
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
} from "@nextui-org/react";
import toast, { Toaster } from "react-hot-toast";
const JoinRoom = () => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [roomCode, setRoomCode] = useState(""); // roomCode should be an empty string, not an array
  const [error, setError] = useState("");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const handleJoinRoom = async () => {
    if (!roomCode) {
      setError("Please enter a room code.");
      return;
    }

    if (!session || !session.user.id) {
      setError("User session is not available. Please log in.");
      return;
    }

    try {
      const response = await fetch("/api/accounts_student/room/join_room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: roomCode,
          studentId: session.user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Room joined successfully:", data); // You can use this data as needed
        onOpenChange(false);
        setRoomCode("");
        toast.success("Room joined successfully!");
        router.push(`/homepage/joined_rooms/${roomCode}`); // Redirect to joined room
      } else {
        toast.error(data.error || "Failed to join room");
        setError(data.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <Toaster />
      <Button
        onPress={onOpen}
        radius="sm"
        color="secondary"
        startContent={<Plus size={20} />}
      >
        Join Room
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="xl"
        radius="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 ">
                <div>
                  <h1 className="text-2xl font-bold">Join Room</h1>
                </div>
              </ModalHeader>

              <ModalBody>
                <form action="">
                  <div className="col-span-4 row-span-1 gap-2 flex flex-col">
                    <Input
                      classNames={{
                        label: "text-white",
                        inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                      }}
                      color="secondary"
                      placeholder="Enter Room Code"
                      radius="sm"
                      variant="bordered"
                      size="lg"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      error={!!error} // Converts error string to boolean
                      helperText={error}
                    />
                    {/* {error && (
                      <p className="text-red-500 duration-75 transition ease-in-out">
                        {error}
                      </p>
                    )} */}
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
                  onClick={handleJoinRoom}
                  className="text-white"
                >
                  Enter
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default JoinRoom;
