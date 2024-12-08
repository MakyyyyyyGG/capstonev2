import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Chip } from "@nextui-org/react";
import FourPicsOneWord from "@/pages/components/FourPicsOneWord";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { Pencil, ChevronLeft } from "lucide-react";
import Loader from "@/pages/components/Loader";
const Index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchCards();
    }
  }, [game_id]);

  // Function to dynamically set Chip color based on room difficulty
  const getChipColor = (difficulty) => {
    switch (
      difficulty?.toLowerCase() // Add optional chaining
    ) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-4 max-w-[50rem] mx-auto">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ChevronLeft size={25} />
            <h1 className="text-2xl font-extrabold">{cards[0]?.title}</h1>
          </div>
          {cards && cards.length > 0 && (
            <div className="text-lg font-bold ">
              <Chip
                color={getChipColor(cards[0].difficulty)}
                variant="flat"
                radius="xl"
                className="px-1 py-1 capitalize"
              >
                {cards[0].difficulty}
              </Chip>
            </div>
          )}
        </div>

        <Link
          href={{
            pathname: `/teacher-dashboard/rooms/${room_code}/4pics1word/${game_id}/edit`,
          }}
        >
          <Button radius="sm" color="secondary">
            <Pencil size={20} /> Edit
          </Button>
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Loader />
        </div>
      ) : (
        <FourPicsOneWord cards={cards} />
      )}
    </div>
  );
};

export default Index;
