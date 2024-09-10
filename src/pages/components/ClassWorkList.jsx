import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import Link from "next/link";

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
    handleGameType(...data);
  };

  const handleGameType = (game) => {
    console.log(game.game_type);
    if (game.game_type === "flashcard") {
      setRedirectGameType(`/teacher-dashboard/rooms/${room_code}/flashcard`);
    }
    // setGameType(game.game_type);
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
          <li key={game.game_id}>
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassWorkList;
