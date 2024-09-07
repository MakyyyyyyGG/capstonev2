import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";

const ClassWorkList = ({ room_code }) => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetchGames();
    console.log(room_code);
  }, [room_code]);

  const fetchGames = async () => {
    const response = await fetch(
      `/api/games/fetch_games?room_code=${room_code}`
    );
    const data = await response.json();
    setGames(data);
  };
  return (
    <div>
      <ul>
        {games.map((game) => (
          <li key={game.game_id}>
            <div className="flex flex-col m-4">
              <Card
                onClick={() => {
                  router.push(`/games/${game.game_id}`);
                }}
              >
                <CardBody>
                  <div className="flex gap-4">
                    <p>{game.title}</p>
                    <p>{game.game_type}</p>
                    <p>{game.game_id}</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassWorkList;
