import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import FourPicsOneWord from "@/pages/components/FourPicsOneWord";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { Pencil } from "lucide-react";

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
    <div className="w-full flex flex-col gap-4 p-4 max-w-[50rem] mx-auto">
      <FourPicsOneWord cards={cards} />
      <div className="w-full flex justify-end">
        <Button isIconOnly className="bg-[#7469B6] text-white border-0">
          <Link
            href={{
              pathname: `/teacher-dashboard/rooms/${room_code}/4pics1word/${game_id}/edit`,
            }}
          >
            <Pencil size={22} />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
