import React, { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { MoreVertical, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const DeleteRoom = ({ room, onRoomDeleted }) => {
  const [isOpen, setIsOpen] = useState(false);

  const deleteRoom = async (roomCode) => {
    const delRoomData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room_code: roomCode }),
    };

    try {
      const res = await fetch(
        "/api/accounts_teacher/room/create_room",
        delRoomData
      );
      const data = await res.json();
      console.log(data);
      onRoomDeleted(); // Callback to update the parent component after deletion
      toast.success("Room deleted successfully");
    } catch (error) {
      console.log("Error deleting room:", error);
    }
  };

  return (
    <div>
      <Toaster />
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <DropdownTrigger>
          <Button color="transparent" isIconOnly>
            <MoreVertical size={22} color="#ffffff" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem
            key="delete"
            startContent={<Trash2 size={22} color="red" />}
            description="Permanently delete this room"
            color="error"
            onClick={() => deleteRoom(room.room_code)}
          >
            Delete Room
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default DeleteRoom;
