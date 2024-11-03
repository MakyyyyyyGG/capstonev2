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

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <SequenceGame sequenceGame={sequenceGame} isLoading={isLoading} />
      <div className="w-full flex justify-end">
        {/* <h1>4 Pics 1 Word Advanced</h1>
      <p>game_id: {game_id}</p>
      <p>room_code: {room_code}</p> */}
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/sequence_game/${game_id}/edit`,
          }}
        >
          <Button isIconOnly className="bg-[#7469B6] text-white border-0">
            <Pencil size={22} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default index;
