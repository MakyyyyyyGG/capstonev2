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
import { Pencil, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";

const index = () => {
  const router = useRouter();
  const { room_code, game_id } = router.query;
  const [sequenceGame, setSequenceGame] = useState([]);
  const [video, setVideo] = useState("");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  const fetchSequenceGame = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/sequence_game/sequence_game?game_id=${game_id}&account_id=${session.user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (data.error === "Unauthorized access") {
        router.push("/unauthorized");
        return;
      }
      setSequenceGame(data);
      // setVideo(data[0].video);
      // setTitle(data[0].title);

      if (res.ok) {
        console.log("Sequence game fetched successfully");
        setIsLoading(false);
        // console.log("data:", data);
        setDifficulty(data[0]?.difficulty || ""); // Update difficulty state with game difficulty or empty string
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
      case "medium":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <div
        className="flex w-full max-w-[80rem] mx-auto justify-between items-center bg-white border-4 border-purple-300 rounded-md p-4"
        style={{
          filter: "drop-shadow(4px 4px 0px #7828C8",
        }}
      >
        <div className="flex gap-4 items-center">
          <div
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft size={24} className="text-purple-700" />
            <span className="text-2xl font-bold text-purple-700">
              {sequenceGame[0]?.title}
            </span>
          </div>
          {difficulty && (
            <div className="text-lg font-bold">
              <Chip
                color={getChipColor(difficulty)}
                variant="flat"
                radius="xl"
                className="px-1 py-1 capitalize"
              >
                {difficulty}
              </Chip>
            </div>
          )}
        </div>
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/sequence_game/${game_id}/edit`,
          }}
        >
          <Button
            radius="sm"
            className="justify-center text-purple-700 bg-white border-4 border-purple-300"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <Pencil size={20} /> Edit
          </Button>
        </Link>
      </div>
      <SequenceGame sequenceGame={sequenceGame} isLoading={isLoading} />
    </div>
  );
};

export default index;
