import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@nextui-org/react";
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

  return (
    <div>
      <h1>4 Pics 1 Word Advanced</h1>
      <p>game_id: {game_id}</p>
      <p>room_code: {room_code}</p>

      <Link
        href={{
          pathname: `/teacher-dashboard/rooms/${room_code}/4pics1word_advanced/${game_id}/edit`,
        }}
      >
        {" "}
        <Button color="primary">Edit 4 Pics 1 Word Advanced </Button>
      </Link>
      <FourPicsOneWordAdvanced cards={cards} />
    </div>
  );
};

export default index;
