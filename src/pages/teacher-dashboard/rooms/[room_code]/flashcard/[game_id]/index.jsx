import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { Pencil, ArrowLeft } from "lucide-react";

const Index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { room_code } = router.query;

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/flashcard/flashcard?game_id=${game_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setFlashcards(data);
      setIsLoading(false);
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
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <div
        className="flex w-full max-w-[50rem] mx-auto justify-between items-center bg-white border-4 border-purple-300 rounded-md p-4"
        style={{
          filter: "drop-shadow(4px 4px 0px #7828C8",
        }}
      >
        <Link href={`/teacher-dashboard/rooms/${room_code}`}>
          <div className="flex items-center gap-2">
            <ArrowLeft size={24} className="text-purple-700" />
            <span className="text-2xl font-bold text-purple-700">
              {flashcards[0]?.title}
            </span>
          </div>
        </Link>

        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/flashcard/${game_id}/edit`,
          }}
        >
          <Button
            radius="sm"
            className="justify-center text-purple-700 bg-white border-4 border-purple-300"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <Pencil size={20} /> Edit
          </Button>
        </Link>
      </div>
      <Flashcards flashcards={flashcards} isLoading={isLoading} />
    </div>
  );
};

export default Index;
