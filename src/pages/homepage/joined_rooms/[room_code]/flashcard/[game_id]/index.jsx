import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Flashcards from "@/pages/components/Flashcards";
import FlashcardsStudent from "@/pages/components/FlashcardsStudent";
import { useSession } from "next-auth/react";

const Index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const [flashcards, setFlashcards] = useState([]);
  const { data: session } = useSession();
  const fetchFlashcards = async () => {
    try {
      const res = await fetch(
        `/api/flashcard/flashcard?game_id=${game_id}&student_id=${session.user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
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
    <div className="w-full">
      <FlashcardsStudent flashcards={flashcards} />
    </div>
  );
};

export default Index;
