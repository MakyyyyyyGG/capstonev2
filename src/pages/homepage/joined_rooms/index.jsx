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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import Loader from "@/pages/components/Loader";
import { useRouter } from "next/router";
import { MoreVertical, Trash2, Search, Copy } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Stickers from "@/pages/components/Stickers";
import { useSession } from "next-auth/react";
const JoinedRoom = ({ rooms = [], onUnenroll }) => {
  const { data: session } = useSession();
  // Add default empty array for rooms prop
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [ownedStickers, setOwnedStickers] = useState([]);
  const [stickers, setStickers] = useState([]);
  // Function to filter rooms based on the search query and difficulty
  const filteredRooms = (rooms || []).filter(
    // Add null check with empty array fallback
    (room) =>
      room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (difficultyFilter === "all" ||
        room.room_difficulty.toLowerCase() === difficultyFilter)
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

  useEffect(() => {
    // Simulate loading
    fetchStickers();
    fetchOwnedStickers();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  async function unEnroll(joined_room_id) {
    const unEnrollData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    };

    toast.promise(
      fetch(
        `/api/accounts_student/room/join_room?student_room_id=${joined_room_id}`,
        unEnrollData
      )
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          onUnenroll();
          console.log("Room unenrolled successfully");
        }),
      {
        loading: "Unenrolling...",
        success: "Room unenrolled successfully",
        error: "Error unenrolling room",
      }
    );
  }

  // Function to copy room code to clipboard
  const copyToClipboard = (roomCode) => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };

  //fetchs stickers
  const fetchStickers = async () => {
    try {
      const response = await fetch(`/api/stickers/stickers`, {
        method: "GET",
      });
      const data = await response.json();
      // console.log("stickers:", data);
      setStickers(data);
    } catch (error) {
      console.error("Error fetching stickers:", error);
    }
  };

  // Function to fetch owned stickers
  const fetchOwnedStickers = async () => {
    console.log("fetching owned stickers");
    try {
      const response = await fetch(
        `/api/stickers/owned_sticker?account_id=${session?.user?.id}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOwnedStickers(data);
      // console.log("sticker data from joined rooms:", data);
      return data;
    } catch (error) {
      console.error("Error fetching stickers:", error);
    }
  };

  return (
    <div className=" m-auto">
      <Toaster />
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
          aria-label="Search Room" // Add aria-label
        />
        <div className="w-full max-w-[300px]">
          <Select
            placeholder="Filter by Difficulty"
            size="lg"
            radius="sm"
            classNames={{
              label: "text-white",
              mainWrapper: "bg-[#ffffff] border-1 border-[#7469B6]  rounded-lg",
            }}
            color="secondary"
            variant="bordered"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            aria-label="Filter by Difficulty" // Add aria-label
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
      <div className="flex items-center gap-4">
        <h1 className="text-4xl my-6 font-bold">Joined Rooms</h1>
        <Stickers
          stickers={stickers}
          ownedStickers={ownedStickers}
          onRefetch={fetchOwnedStickers}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full rounded-lg p-4">
          <img
            src="/no-game.svg"
            alt="empty-room"
            className="w-[40%] h-[40%] m-auto object-cover"
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 rounded-lg auto-cols-fr">
          {filteredRooms.map((room) => (
            <li key={room.room_id} className="flex">
              {isLoading ? (
                <Skeleton className="h-[300px] rounded-lg w-full" />
              ) : (
                <div className="relative w-full">
                  <Card
                    isPressable
                    className={`relative w-full h-[300px] flex flex-col justify-between hover:shadow-gray-400 shadow-lg rounded-lg cursor-pointer ${
                      room.room_difficulty?.toLowerCase() === "easy"
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                        : room.room_difficulty?.toLowerCase() === "moderate"
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                        : room.room_difficulty?.toLowerCase() === "hard"
                        ? "bg-gradient-to-br from-red-400 to-red-600"
                        : "bg-gradient-to-br from-purple-400 to-purple-600"
                    }`}
                    onClick={() =>
                      router.push(`/homepage/joined_rooms/${room.room_code}`)
                    }
                  >
                    <CardHeader className="absolute w-full items-center text-center flex justify-between">
                      <Chip
                        radius="xl"
                        className={`text-base py-4 border-1 border-white/50 bg-white/20 backdrop-blur-sm text-white`}
                      >
                        {room.room_difficulty}
                      </Chip>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            color="transparent"
                            isIconOnly
                            aria-label="More options"
                          >
                            <MoreVertical size={22} color="#ffffff" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="unenroll"
                            startContent={<Trash2 size={22} color="red" />}
                            description="Unenroll from this room"
                            color="error"
                            onClick={() => unEnroll(room.student_room_id)}
                          >
                            Unenroll
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </CardHeader>

                    <CardBody className="flex h-2/4 flex-col justify-center items-center w-full">
                      <h1 className="text-2xl text-bold text-white font-bold">
                        {room.room_name}
                      </h1>
                    </CardBody>

                    <CardFooter className="rounded-b justify-between bg-white mt-auto flex-1">
                      <div className="p-2 text-[#7469B6] flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <h1 className="font-bold">Code: {room.room_code}</h1>
                        </div>
                        <div className="flex items-center gap-6">
                          <h1>{room.email}</h1>
                          <Avatar
                            src={room.profile_image}
                            className="w-10 h-10"
                            alt="Teacher profile"
                          />
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JoinedRoom;
