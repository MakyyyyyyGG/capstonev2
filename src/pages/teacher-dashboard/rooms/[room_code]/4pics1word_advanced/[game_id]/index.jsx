import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Chip } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { Pencil, ArrowLeft } from "lucide-react";
import FourPicsOneWordAdvanced from "@/pages/components/FourPicsOneWordAdvanced";

const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);

  const fetchCards = async () => {
    try {
      const res = await fetch(
        `/api/4pics1word_advanced/4pics1word_advanced?game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setCards(data);
      if (res.ok) {
        console.log("Cards fetched successfully ");
      } else {
        console.error("Error fetching cards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchCards();
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
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <div
        className="flex w-full max-w-[50rem] mx-auto justify-between items-center bg-white border-4 border-purple-300 rounded-md p-4"
        style={{
          filter: "drop-shadow(4px 4px 0px #7828C8",
        }}
      >
        <div className="flex w-full gap-4 items-center">
          <div
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft size={24} className="text-purple-700" />
            <span className="text-2xl font-bold text-purple-700">
              {cards[0]?.title}
            </span>
          </div>
          {cards && cards.length > 0 && (
            <div className="text-lg font-bold ">
              <Chip
                color={getChipColor(cards[0].difficulty)}
                variant="flat"
                radius="xl"
                className="px-1 py-1 capitalize"
              >
                {cards[0].difficulty}
              </Chip>
            </div>
          )}
        </div>
        {/* <h1>4 Pics 1 Word Advanced</h1>
        <p>game_id: {game_id}</p>
        <p>room_code: {room_code}</p> */}
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/4pics1word_advanced/${game_id}/edit`,
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

      <FourPicsOneWordAdvanced cards={cards} />
    </div>
  );
};

export default index;
