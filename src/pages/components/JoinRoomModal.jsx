import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
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

const JoinRoomModal = ({ room_code, pageReload }) => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [roomCode, setRoomCode] = useState(room_code || "");
  const [error, setError] = useState("");
  const router = useRouter();
  const [message, setMessage] = useState("");

  // Open modal by default when component mounts
  useEffect(() => {
    onOpen();
  }, []);

  const handleJoinRoom = async () => {
    const codeToUse = roomCode || room_code;

    if (!codeToUse) {
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
          roomCode: codeToUse,
          studentId: session.user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Room joined successfully:", data);
        onOpenChange(false);
        setRoomCode("");
        toast.success("Room joined successfully!");
        pageReload(); // Call the pageReload function passed from parent
        // router.push(`/homepage/joined_rooms/${codeToUse}`);
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
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        size="xl"
        radius="sm"
        isDismissable={false}
        hideCloseButton={true}
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
                      value={roomCode || room_code}
                      onChange={(e) => setRoomCode(e.target.value)}
                      error={!!error}
                      helperText={error}
                    />
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
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

export default JoinRoomModal;
