import React, { useState, useEffect } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import Link from "next/link";
import { Trash, Edit } from "lucide-react";

const ClassWorkList = ({ room_code }) => {
  const [games, setGames] = useState([]);
  const [redirectGameType, setRedirectGameType] = useState("");
  const [gameType, setGameType] = useState("");

  useEffect(() => {
    fetchGames();
  }, [room_code]);

  const fetchGames = async () => {
    const response = await fetch(
      `/api/games/fetch_games?room_code=${room_code}`
    );
    const data = await response.json();
    setGames(data);
  };

  const handleDeleteGame = async (game_id, game_type) => {
    const delWorkData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ game_id: game_id }),
    };
    if (game_type === "flashcard") {
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
    } else if (game_type === "four_pics_one_word") {
      console.log("deleting four pics one word game", game_id);
      try {
        const res = await fetch(
          `/api/4pics1word/4pics1word?game_id=${game_id}`,
          delWorkData
        );
        const data = await res.json();
        console.log(data);
        fetchGames();
      } catch (error) {
        console.log("Error deleting game:", error);
      }
    } else if (game_type === "four_pics_one_word_advanced") {
      console.log("deleting four pics one word advanced game", game_id);
      try {
        const res = await fetch(
          `/api/4pics1word_advanced/4pics1word_advanced?game_id=${game_id}`,
          delWorkData
        );
        const data = await res.json();
        console.log(data);
        fetchGames();
      } catch (error) {
        console.log("Error deleting game:", error);
      }
    } else if (game_type === "color_game") {
      console.log("deleting color game", game_id);
      try {
        const res = await fetch(
          `/api/color_game/color_game?game_id=${game_id}`,
          delWorkData
        );
        const data = await res.json();
        console.log(data);
        fetchGames();
      } catch (error) {
        console.log("Error deleting game:", error);
      }
    }
  };

  useEffect(() => {
    games.forEach((game) => {
      console.log(game.game_type);
    });
  }, [games]);

  const getRedirectUrl = (game) => {
    if (game.game_type === "flashcard") {
      return `/teacher-dashboard/rooms/${room_code}/flashcard/${game.game_id}`;
    } else if (game.game_type === "four_pics_one_word") {
      return `/teacher-dashboard/rooms/${room_code}/4pics1word/${game.game_id}`;
    } else if (game.game_type === "four_pics_one_word_advanced") {
      return `/teacher-dashboard/rooms/${room_code}/4pics1word_advanced/${game.game_id}`;
    } else if (game.game_type === "color_game") {
      return `/teacher-dashboard/rooms/${room_code}/color_game/${game.game_id}`;
    }
    return "#";
  };

  return (
    <div>
      <ul>
        {games.map((game) => (
          <li key={game.game_id} className="flex items-center">
            <div className="flex flex-col m-4">
              <Link href={getRedirectUrl(game)}>
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
              onPress={() => handleDeleteGame(game.game_id, game.game_type)}
            >
              <Trash />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassWorkList;
