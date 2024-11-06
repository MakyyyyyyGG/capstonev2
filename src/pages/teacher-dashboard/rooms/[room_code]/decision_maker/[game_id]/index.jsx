import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
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
  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Decision Maker</h1>
        <Button isIconOnly className="bg-[#7469B6] text-white border-0">
          <Link
            href={{
              pathname: `/teacher-dashboard/rooms/${room_code}/decision_maker/${game_id}/edit`,
            }}
          >
            <Pencil size={22} />
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
