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
import DeleteRoom from "@/pages/components/DeleteRoom";

const Rooms = ({ rooms, onRoomDeleted }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Function to filter rooms based on the search query
  const filteredRooms = rooms.filter((room) =>
    room.room_name.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div>
      <Input
        clearable
        type="text"
        placeholder="Search Room"
        radius="sm"
        size="lg"
        color="secondary"
        variant="faded"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <h1 className="text-4xl my-6 font-bold">Your Rooms</h1>
      <ul className="flex flex-wrap gap-5">
        {filteredRooms.map((room) => (
          <Card
            key={room.room_id}
            className="shrink w-[380px] h-[300px] bg-[#7469B6] grid grid-rows-7 hover:shadow-gray-400 shadow-lg"
          >
            <CardHeader
              href={`/teacher-dashboard/rooms/${room.room_code}`}
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
                <h1 className="text-2xl text-bold text-white hover:underline">
                  {room.room_name}
                </h1>
              </div>
            </CardHeader>
            <CardFooter className="row-span-2 row-start-6 row-end-8 grid grid-cols-2 justify-between bg-white">
              <div className="p-2 text-[#7469B6] flex items-center">
                <p>Code: {room.room_code}</p>
              </div>
              <div className="p-2 text-white flex items-center justify-end">
                <DeleteRoom room={room} onRoomDeleted={onRoomDeleted} />
                {/* <Link href={`/teacher-dashboard/rooms/${room.room_code}`}>
                  <Button>View Room</Button>
                </Link> */}
              </div>
            </CardFooter>
          </Card>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
