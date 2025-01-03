import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardFooter,
  Chip,
  Select,
  SelectItem,
  Skeleton,
  Avatar,
  CardBody,
} from "@nextui-org/react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import DeleteRoom from "@/pages/components/DeleteRoom";
import { Search, Copy } from "lucide-react";
import Loader from "@/pages/components/Loader";

const Rooms = ({ rooms = [], onRoomDeleted }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Function to filter rooms based on the search query and difficulty
  const filteredRooms =
    rooms?.filter(
      (room) =>
        room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (difficultyFilter === "all" ||
          room.room_difficulty.toLowerCase() === difficultyFilter)
    ) || [];

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
        return "default";
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = (roomCode, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };

  return (
    <div className="m-auto">
      <Toaster />
      {isLoading ? (
        // Loader or loading text
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader />
        </div>
      ) : filteredRooms.length === 0 && rooms.length === 0 ? (
        // No rooms case
        <div className="flex flex-col items-center justify-center min-h-screen">
          <img
            src="/no-room.svg"
            alt="No rooms available"
            className="w-[40%] h-[40%] m-auto object-cover"
          />
        </div>
      ) : (
        // Render rooms
        <>
          {rooms.length > 0 && (
            <div className="flex gap-4 w-full">
              <Input
                classNames={{
                  label: "text-white",
                  inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                }}
                isClearable
                onClear={() => setSearchQuery("")}
                startContent={<Search size={22} color="#6B7280" />}
                type="text"
                placeholder="Search Room"
                radius="sm"
                size="lg"
                color="secondary"
                variant="bordered"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Room"
              />
              <div className="w-full max-w-[300px]">
                <Select
                  placeholder="Filter by Difficulty"
                  size="lg"
                  radius="sm"
                  classNames={{
                    label: "text-white",
                    mainWrapper:
                      "bg-[#ffffff] border-1 border-[#7469B6]  rounded-lg",
                  }}
                  color="secondary"
                  variant="bordered"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  aria-label="Filter by Difficulty"
                >
                  <SelectItem key="all" value="all">
                    All Difficulties
                  </SelectItem>
                  <SelectItem key="easy" value="easy">
                    Easy
                  </SelectItem>
                  <SelectItem key="moderate" value="moderate">
                    Moderate
                  </SelectItem>
                  <SelectItem key="hard" value="hard">
                    Hard
                  </SelectItem>
                </Select>
              </div>
            </div>
          )}
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <img
                src="/no-room.svg"
                alt="No rooms available"
                className="w-[40%] h-[40%] m-auto object-cover"
              />
            </div>
          ) : (
            <>
              <h1 className="text-4xl my-6 font-bold">Your Rooms</h1>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 rounded-lg mr-4 auto-cols-auto">
                {filteredRooms.map((room) => (
                  <li key={room.room_id}>
                    <div className="relative">
                      <div className="block w-full">
                        <Card
                          isPressable
                          className={`relative w-full h-[300px] flex flex-col justify-between hover:shadow-gray-400 shadow-lg rounded-lg cursor-pointer ${
                            room.room_difficulty?.toLowerCase() === "easy"
                              ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                              : room.room_difficulty?.toLowerCase() ===
                                "moderate"
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                              : room.room_difficulty?.toLowerCase() === "hard"
                              ? "bg-gradient-to-br from-red-400 to-red-600"
                              : "bg-gradient-to-br from-purple-400 to-purple-600"
                          }`}
                          onClick={() =>
                            router.push(
                              `/teacher-dashboard/rooms/${room.room_code}`
                            )
                          }
                        >
                          <CardHeader className="absolute w-full items-center text-center flex justify-between">
                            <Chip
                              radius="xl"
                              className={`text-base py-4 border-1 border-white/50 bg-white/20 backdrop-blur-sm text-white`}
                            >
                              {room.room_difficulty}
                            </Chip>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DeleteRoom
                                room={room}
                                onRoomDeleted={onRoomDeleted}
                              />
                            </div>
                          </CardHeader>
                          <CardBody className="flex h-2/4 flex-col justify-center items-center w-full">
                            <h1 className="text-2xl text-bold text-white font-bold">
                              {room.room_name}
                            </h1>
                          </CardBody>
                          <CardFooter className="rounded-b justify-between bg-white mt-auto flex-1">
                            <div className="p-2 text-[#7469B6] flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <div>
                                  <Button
                                    color="transparent"
                                    isIconOnly
                                    aria-label="Copy Room Code"
                                    onClick={(e) => {
                                      copyToClipboard(room.room_code, e);
                                    }}
                                  >
                                    <Copy size={22} />
                                  </Button>
                                </div>
                                <h1 className="font-bold">
                                  Code: {room.room_code}
                                </h1>
                              </div>
                              <Avatar
                                src={room.profile_image}
                                className="w-10 h-10"
                              />
                            </div>
                          </CardFooter>
                        </Card>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Rooms;
