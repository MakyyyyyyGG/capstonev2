import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@nextui-org/react";

const Rooms = ({ rooms, onRoomDeleted }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Function to filter rooms based on the search query
  const filteredRooms = rooms.filter((room) =>
    room.room_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function deleteRoom(roomCode) {
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
      onRoomDeleted();
      console.log("Room deleted successfully");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <div>
        <h2>Your Rooms</h2>
        <input
          type="text"
          placeholder="Search by room name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 mb-4 w-full"
        />
        <ul className="flex flex-wrap gap-5">
          {filteredRooms.map((room) => (
            <li
              key={room.room_id}
              className="border-2 min-w-[30%] h-[300px] flex flex-col"
            >
              <p>Room name: {room.room_name}</p>
              <p>Room Difficulty: {room.room_difficulty}</p>
              <p>Room Code: {room.room_code}</p>

              <Link href={`/teacher-dashboard/rooms/${room.room_code}`}>
                <Button>View Room</Button>
              </Link>
              <Button color="danger" onClick={() => deleteRoom(room.room_code)}>
                Delete Room
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Rooms;
