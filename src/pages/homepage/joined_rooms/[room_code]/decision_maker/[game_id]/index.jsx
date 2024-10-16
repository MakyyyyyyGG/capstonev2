import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import DecisionMakerStudent from "@/pages/components/DecisionMakerStudent";
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
    <div className="w-full">
      <DecisionMakerStudent cards={cards} />
    </div>
  );
};

export default index;
