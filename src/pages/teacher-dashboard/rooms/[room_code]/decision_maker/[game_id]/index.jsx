import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
import { Chip } from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { Pencil } from "lucide-react";
import DecisionMaker from "@/pages/components/DecisionMaker";
const index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const [cards, setCards] = useState([]);
  const { room_code } = router.query;
  const fetchCards = async () => {
    try {
      const res = await fetch(
        `/api/decision_maker/decision_maker?game_id=${game_id}`,
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
        // console.log("Flashcards fetched successfully");
        // console.log("data:", data);
      } else {
        console.error("Error fetching flashcards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
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
      case "moderate":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-4 max-w-[50rem] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <h1 className="text-2xl font-extrabold">Decision Maker</h1>
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
        <Button radius="sm" color="secondary">
          <Link
            href={{
              pathname: `/teacher-dashboard/rooms/${room_code}/decision_maker/${game_id}/edit`,
            }}
            className="flex"
          >
            <Pencil size={22} className="mr-2" /> Edit
          </Link>
        </Button>
      </div>

      <DecisionMaker cards={cards} />
      <div className="w-full flex justify-end">
        {/* <h1>4 Pics 1 Word Advanced</h1>
      <p>game_id: {game_id}</p>
      <p>room_code: {room_code}</p> */}
      </div>
    </div>
  );
};

export default index;
