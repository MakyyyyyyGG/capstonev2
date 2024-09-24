import React from "react";
import { Button } from "@nextui-org/react";

const DeleteRoom = ({ room, onRoomDeleted }) => {
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
      console.log("Room deleted successfully");
    } catch (error) {
      console.log("Error deleting room:", error);
    }
  };

  return (
    <div>
      <Button
        isIconOnly
        color="danger"
        onClick={() => deleteRoom(room.room_code)}
      >
        Del
      </Button>
    </div>
  );
};

export default DeleteRoom;
