import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
} from "@nextui-org/react";
import { Chip } from "@nextui-org/react";
import SequenceGame from "@/pages/components/SequenceGame";
import Link from "next/link";
import { Pencil } from "lucide-react";

const index = () => {
  const router = useRouter();
  const { room_code, game_id } = router.query;
  const [sequenceGame, setSequenceGame] = useState([]);
  const [video, setVideo] = useState("");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSequenceGame = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/sequence_game/sequence_game?game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setSequenceGame(data);
      // setVideo(data[0].video);
      // setTitle(data[0].title);
      // setDifficulty(data[0].difficulty);
      if (res.ok) {
        console.log("Sequence game fetched successfully");
        setIsLoading(false);
        // console.log("data:", data);
      } else {
        console.error("Error fetching sequence game:", data.error);
      }
    } catch (error) {
      console.error("Error fetching sequence game:", error);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchSequenceGame();
    }
  }, [game_id]);

  // Function to dynamically set Chip color based on room difficulty
  const getChipColor = (difficulty) => {
    switch (
      difficulty?.toLowerCase() // Add optional chaining
    ) {
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
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-extrabold">Sequence Game</h1>
          {/* {cards && cards.length > 0 && (
            <div className="text-lg font-bold ">
              <Chip
                color={getChipColor(cards[0].difficulty)}
                radius="sm"
                className="rounded-md px-1 py-1 capitalize text-white"
              >
                {cards[0].difficulty}
              </Chip>
            </div>
          )} */}
        </div>
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/sequence_game/${game_id}/edit`,
          }}
        >
          <Button radius="sm" className="bg-[#7469B6] text-white border-0">
            <Pencil size={22} /> Edit
          </Button>
        </Link>
      </div>
      <SequenceGame sequenceGame={sequenceGame} isLoading={isLoading} />
    </div>
  );
};

export default index;
