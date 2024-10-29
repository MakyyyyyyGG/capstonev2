import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
import { Button } from "@nextui-org/react";
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
    <div>
      <h1>Decision Maker Page</h1>
      <h1>game id: {game_id}</h1>

      <Link
        href={{
          pathname: `/teacher-dashboard/rooms/${room_code}/decision_maker/${game_id}/edit`,
        }}
      >
        <Button color="primary">Edit Decision Maker</Button>
      </Link>

      <DecisionMaker cards={cards} />
    </div>
  );
};

export default index;
