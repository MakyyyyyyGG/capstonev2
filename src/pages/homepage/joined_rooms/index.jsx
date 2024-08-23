import React, { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@nextui-org/react";

const JoinedRoom = ({ rooms, onUnenroll }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = rooms.filter((room) =>
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function unEnroll(joined_room_id) {
    const unEnrollData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const res = await fetch(
        `/api/accounts_student/room/join_room?student_room_id=${joined_room_id}`,
        unEnrollData
      );
      const data = await res.json();
      console.log(data);
      onUnenroll();
      console.log("Room unenrolled successfully");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <div>
        <h1>Joined Rooms</h1>
        <input
          clearable
          placeholder="Search by room name"
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 w-full p-2"
        />
        <div className="flex flex-wrap gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.room_code}
              className="border-2 w-[30%] h-[300px] flex flex-col"
            >
              <h2>Student Room ID: {room.student_room_id}</h2>
              <h2>Room Name: {room.room_name}</h2>
              <h2>Room Difficulty: {room.room_difficulty}</h2>
              <h2>Room Code: {room.room_code}</h2>
              <h2>Teacher: {room.email}</h2>
              <Link href={`/homepage/joined_rooms/${room.room_code}`}>
                <Button>View Room</Button>
              </Link>
              <Button
                color="danger"
                onClick={() => unEnroll(room.student_room_id)}
              >
                Leave Room
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JoinedRoom;
