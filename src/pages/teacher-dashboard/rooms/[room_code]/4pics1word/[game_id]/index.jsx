import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import FourPicsOneWord from "@/pages/components/FourPicsOneWord";
import Link from "next/link";
import { Button } from "@nextui-org/react";

const Index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/4pics1word/4pics1word?game_id=${game_id}`, {
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
    <div>
      <Button color="primary">
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/4pics1word/${game_id}/edit`,
          }}
        >
          Edit 4 Pics 1 Word
        </Link>
      </Button>
      <FourPicsOneWord cards={cards} />
    </div>
  );
};

export default Index;