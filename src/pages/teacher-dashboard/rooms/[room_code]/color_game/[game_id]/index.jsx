import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@nextui-org/react";
import { Pencil } from "lucide-react";
import ColorGames from "@/pages/components/ColorGames";
import Link from "next/link";
const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/color_game/color_game?game_id=${game_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setCards(data);
      if (res.ok) {
        console.log("Cards fetched successfully");
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
  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <ColorGames cards={cards} />
      <div className="w-full flex justify-end">
        {/* <h1>4 Pics 1 Word Advanced</h1>
      <p>game_id: {game_id}</p>
      <p>room_code: {room_code}</p> */}
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/color_game/${game_id}/edit`,
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
