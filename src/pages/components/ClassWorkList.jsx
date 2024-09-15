import React, { useState, useEffect } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import Link from "next/link";
import { Trash, Edit } from "lucide-react";

const ClassWorkList = ({ room_code }) => {
  const [games, setGames] = useState([]);
  // const [gameType, setGameType] = useState("");
  const [redirectGameType, setRedirectGameType] = useState("");
  useEffect(() => {
    fetchGames();
  }, [room_code]);

  const fetchGames = async () => {
    const response = await fetch(
      `/api/games/fetch_games?room_code=${room_code}`
    );
    const data = await response.json();
    setGames(data);
    if (data.length > 0) {
      handleGameType(...data);
    }
  };

  const handleGameType = (game) => {
    console.log(game.game_type);
    if (game.game_type === "flashcard") {
      setRedirectGameType(`/teacher-dashboard/rooms/${room_code}/flashcard`);
    }
  };

  const handleDeleteGame = async (game_id) => {
    console.log(game_id);
    const delWorkData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ game_id: game_id }),
    };
    try {
      const res = await fetch(
        `/api/flashcard/flashcard?game_id=${game_id}`,
        delWorkData
      );
      const data = await res.json();
      console.log(data);
      fetchGames();
    } catch (error) {
      console.log("Error deleting game:", error);
    }
  };

  useEffect(() => {
    games.forEach((game) => {
      console.log(game.game_type);
    });
  }, [games]);

  return (
    <div>
      <ul>
        {games.map((game) => (
          <li key={game.game_id} className="flex items-center">
            <div className="flex flex-col m-4">
              <Link href={`${redirectGameType}/${game.game_id}`}>
                <Card className="py-4 hover:bg-gray-200" isPressable>
                  <CardBody>
                    <div className="flex gap-4">
                      <p className="border-r-2 pr-4">{game.game_type}</p>
                      <p>{game.title}</p>
                      <p>{game.game_type}</p>
                      <p>{game.game_id}</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </div>
            <Button
              color="danger"
              className="mr-4"
              onPress={() => handleDeleteGame(game.game_id)}
            >
              <Trash />
            </Button>
            <Button color="warning">
              <Edit />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassWorkList;
