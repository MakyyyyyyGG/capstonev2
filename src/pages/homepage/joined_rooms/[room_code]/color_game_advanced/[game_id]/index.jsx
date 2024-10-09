import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ColorGamesAdvancedStudent from "@/pages/components/ColorGameAdvancedStudent";
const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);

  const fetchCards = async () => {
    try {
      const res = await fetch(
        `/api/color_game_advanced/color_game_advanced?game_id=${game_id}`,
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
    <div>
      <h1>Color Game Advanced</h1>
      <p>{game_id}</p>
      <ColorGamesAdvancedStudent cards={cards} />
    </div>
  );
};

export default index;
