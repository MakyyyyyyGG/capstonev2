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
import SequenceGameStudent from "@/pages/components/SequenceGameStudent";
const index = () => {
  const router = useRouter();
  const { room_code, game_id } = router.query;
  const [sequenceGame, setSequenceGame] = useState([]);
  const [video, setVideo] = useState("");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const fetchSequenceGame = async () => {
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
        console.log("data:", data);
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
    <div className="w-full">
      <SequenceGameStudent sequenceGame={sequenceGame} />
    </div>
  );
};

export default index;
