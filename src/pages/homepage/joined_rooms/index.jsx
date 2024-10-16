import React, { useState } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardFooter,
  Chip,
} from "@nextui-org/react";
import { Trash2 } from "lucide-react";

const JoinedRoom = ({ rooms, onUnenroll }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = rooms.filter((room) =>
    room.room_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to dynamically set Chip color based on room difficulty
  const getChipColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "success";
      case "moderate":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

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
    <div className="w-full">
      <div>
        <Input
          clearable
          placeholder="Search by Room Name"
          radius="sm"
          size="lg"
          color="secondary"
          variant="faded"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <h1 className="text-4xl my-6 font-bold">Joined Rooms</h1>
        <div className="flex flex-wrap gap-5">
          {filteredRooms.map((room) => (
            <Card
              key={room.room_id}
              className="shrink w-[380px] h-[300px] bg-[#7469B6] grid grid-rows-7 hover:shadow-gray-400 shadow-lg"
            >
              <CardHeader
                href={`/homepage/joined_rooms/${room.room_code}`}
                as={Link}
                className="relative w-full p-5 row-span-5 items-center text-center"
              >
                <div className="absolute top-0 left-0 p-5">
                  <Chip
                    color={getChipColor(room.room_difficulty)}
                    radius="sm"
                    className="text-base text-white py-4"
                  >
                    {room.room_difficulty}
                  </Chip>
                </div>
                <div className="flex w-full justify-center items-center text-center">
                  <div className="text-2xl text-bold text-white">
                    <h1 className="hover:underline">{room.room_name}</h1>
                    <h2 className="text-lg text-bold text-white text-center content-center hover:underline">
                      {room.email}
                    </h2>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="row-span-2 grid grid-cols-2 justify-between bg-white">
                <div className="p-2 text-[#7469B6] flex items-center">
                  <p>Code: {room.room_code}</p>
                </div>
                <div className="p-2 text-white flex items-center justify-end">
                  <Button
                    isIconOnly
                    color="danger"
                    onClick={() => unEnroll(room.student_room_id)}
                  >
                    <Trash2 size={22} />
                  </Button>
                  {/* <Link href={`/teacher-dashboard/rooms/${room.room_code}`}>
                            <Button>View Room</Button>
                          </Link> */}
                </div>
              </CardFooter>
            </Card>
          ))}
          {/* <div
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
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default JoinedRoom;
