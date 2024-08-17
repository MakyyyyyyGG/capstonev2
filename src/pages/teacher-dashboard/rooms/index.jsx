import React from "react";
import Link from "next/link";
import { Button } from "@nextui-org/react";
const Rooms = ({ rooms }) => {
  return (
    <div>
      <div>
        <h2>Your Rooms</h2>
        <ul className="flex flex-wrap gap-5">
          {rooms.map((room) => (
            <li
              key={room.room_id}
              className="border-2 w-[30%] h-[300px] flex flex-col"
            >
              <p>Room name: {room.room_name}</p>
              <p>Room Difficulty: {room.room_difficulty}</p>
              <p>Room Code: {room.room_code}</p>

              <Link href={`/teacher-dashboard/rooms/${room.room_code}`}>
                <Button>View Room</Button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Rooms;
