import React from "react";
import Link from "next/link";
import { Button } from "@nextui-org/react";

const JoinedRoom = ({ rooms }) => {
  return (
    <div className="">
      <div>
        <h1>Joined Rooms</h1>
        <div className="flex flex-wrap gap-5">
          {rooms.map((room) => (
            <div
              key={room.room_code}
              className="border-2 w-[30%] h-[300px] flex flex-col"
            >
              <h2 className="">Room Name: {room.room_name}</h2>
              <h2>Room Difficulty: {room.room_difficulty}</h2>
              <h2>Room Code: {room.room_code}</h2>
              <Link href={`/homepage/joined_rooms/${room.room_code}`}>
                <Button>View Room</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JoinedRoom;
