import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import DeleteRoom from "@/pages/components/DeleteRoom";

const Rooms = ({ rooms, onRoomDeleted }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Function to filter rooms based on the search query
  const filteredRooms = rooms.filter((room) =>
    room.room_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
            <DeleteRoom room={room} onRoomDeleted={onRoomDeleted} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
