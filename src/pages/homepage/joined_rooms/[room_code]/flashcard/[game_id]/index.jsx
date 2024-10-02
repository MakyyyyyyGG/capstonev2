import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
import { Button } from "@nextui-org/react";

const Index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const [flashcards, setFlashcards] = useState([]);
  const { room_code } = router.query;

  const fetchFlashcards = async () => {
    try {
      const res = await fetch(`/api/flashcard/flashcard?game_id=${game_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setFlashcards(data);
      if (res.ok) {
        console.log("Flashcards fetched successfully");
        console.log("data:", data);
      } else {
        console.error("Error fetching flashcards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchFlashcards();
    }
  }, [game_id]);

  return (
    <div>
      {/* <Button color="primary">
        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/flashcard/${game_id}/edit`,
          }}
        >
          Edit Flashcards
        </Link>
      </Button> */}

      <Flashcards flashcards={flashcards} />
    </div>
  );
};

export default Index;
