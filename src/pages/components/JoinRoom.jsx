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
} from "@nextui-org/react";

const JoinRoom = ({ onRoomJoin }) => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [roomCode, setRoomCode] = useState(""); // roomCode should be an empty string, not an array
  const [error, setError] = useState("");

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
        onRoomJoin();
        alert("Room joined successfully!");
      } else {
        setError(data.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
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
        classNames={{
          body: "pb-6 px-8 max-sm:p-4 max-sm:pb-4",
          header: "text-[#F3F3F3] text-3xl p-8 max-sm:p-4 max-sm:text-xl",
          footer: "px-8 pb-8 max-sm:px-4 max-sm:pb-4",
          base: "bg-[#7469B6] dark:bg-[#19172c] text-[#a8b0d3]",
          closeButton:
            "text-[#fff] text-lg hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Join Room
              </ModalHeader>
              <ModalBody>
                <Input
                  placeholder="Enter Room Code"
                  radius="sm"
                  size="lg"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  error={!!error} // Converts error string to boolean
                  helperText={error}
                />
                {error && (
                  <p className="text-red-500 duration-75 transition ease-in-out">
                    {error}
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" radius="sm" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="success"
                  radius="sm"
                  className="text-white"
                  onPress={handleJoinRoom}
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
