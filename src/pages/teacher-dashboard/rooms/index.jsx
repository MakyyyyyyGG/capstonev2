import React, { useState } from "react";
import Link from "next/link";
import { Button, Input, Card, Chip } from "@nextui-org/react";
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
        type="text"
        placeholder="Search Room"
        radius="sm"
        size="lg"
        color="secondary"
        variant="faded"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <h2 className="text-4xl my-6 font-bold">Your Rooms</h2>
      <ul className="flex flex-wrap gap-5">
        {filteredRooms.map((room) => (
          <Card
            key={room.room_id}
            className="border-1 min-w-[380px] h-[300px] bg-[#7469B6] grid grid-rows-3"
          >
            <div className="p-5 row-span-2 grid content-center">
              <div className="absolute">
                <Chip
                  color={getChipColor(room.room_difficulty)}
                  radius="sm"
                  className="text-base text-white py-4"
                >
                  {room.room_difficulty}
                </Chip>
              </div>
              <div className="content-center">
                <h1 className="text-2xl text-bold text-white text-center content-center">
                  {room.room_name}
                </h1>
              </div>
            </div>
            <div className="row-span-1 grid grid-cols-2 justify-between border-t border-white">
              <div className="p-5 text-white flex items-center">
                <p>Code: {room.room_code}</p>
              </div>
              <div className="flex justify-center gap-1 items-center">
                <DeleteRoom room={room} onRoomDeleted={onRoomDeleted} />
                <Link href={`/teacher-dashboard/rooms/${room.room_code}`}>
                  <Button>View Room</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
