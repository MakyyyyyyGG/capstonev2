import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import Flashcards from "@/pages/components/Flashcards";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { Pencil } from "lucide-react";

const Index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const [flashcards, setFlashcards] = useState([]);
  const { room_code } = router.query;

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

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
      <Header
        isCollapsed={isCollapsedSidebar}
        toggleCollapse={toggleSidebarCollapseHandler}
      />
      <div className="flex border-2">
        <Sidebar
          isCollapsed={isCollapsedSidebar}
          toggleCollapse={toggleSidebarCollapseHandler}
        />
        <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
          <div>
            <Flashcards flashcards={flashcards} />
          </div>
          <div>
            <Button color="primary" startContent={<Pencil size={22} />}>
              <Link
                href={{
                  pathname: `/teacher-dashboard/rooms/${room_code}/flashcard/${game_id}/edit`,
                }}
              >
                Edit Flashcards
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
