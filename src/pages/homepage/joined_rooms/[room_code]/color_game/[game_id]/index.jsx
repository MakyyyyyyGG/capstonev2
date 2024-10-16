import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@nextui-org/react";
import ColorGameStudent from "@/pages/components/ColorGameStudent";
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
    <div className="w-full">
      {/* <h1>Color Game</h1>
      <p>{game_id}</p> */}

      <ColorGameStudent cards={cards} />
    </div>
  );
};

export default index;
