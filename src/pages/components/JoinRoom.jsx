import React, { useState } from "react";
import { useSession } from "next-auth/react";
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
      <Button onPress={onOpen}>Join Room</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Join Room
              </ModalHeader>
              <ModalBody>
                <Input
                  placeholder="Enter Room Code"
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
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={handleJoinRoom}>
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
