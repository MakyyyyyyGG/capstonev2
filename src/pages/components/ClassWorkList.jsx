import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";
import Link from "next/link";
import { Trash } from "lucide-react";
import { useSession } from "next-auth/react";

const ClassWorkList = ({ room_code, games = [] }) => {
  const [roleRedirect, setRoleRedirect] = useState("");
  const [filterByDifficulty, setFilterByDifficulty] = useState("");
  const [filterByGameType, setFilterByGameType] = useState("");
  const [filterByTitle, setFilterByTitle] = useState("");
  const { data: session } = useSession();

  const handleDeleteGame = async (game_id, game_type) => {
    const delWorkData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ game_id: game_id }),
    };
    if (game_type === "flashcard") {
      if (confirm("Are you sure you want to delete this flashcard game?")) {
        try {
          const res = await fetch(
            `/api/flashcard/flashcard?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "4 Pics 1 Word") {
      if (confirm("Are you sure you want to delete this 4 Pics 1 Word game?")) {
        console.log("deleting four pics one word game", game_id);
        try {
          const res = await fetch(
            `/api/4pics1word/4pics1word?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "4 Pics 1 Word Advanced") {
      if (
        confirm(
          "Are you sure you want to delete this 4 Pics 1 Word Advanced game?"
        )
      ) {
        console.log("deleting four pics one word advanced game", game_id);
        try {
          const res = await fetch(
            `/api/4pics1word_advanced/4pics1word_advanced?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "Color Game") {
      if (confirm("Are you sure you want to delete this Color Game?")) {
        console.log("deleting color game", game_id);
        try {
          const res = await fetch(
            `/api/color_game/color_game?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    }
  };

  const isTeacher = () => {
    if (session.user.role === "teacher") {
      setRoleRedirect("/teacher-dashboard/rooms");
    } else if (session.user.role === "student") {
      setRoleRedirect("/homepage/joined_rooms");
    }
  };

  useEffect(() => {
    isTeacher();
  }, [session]);

  const getRedirectUrl = (game) => {
    if (game.game_type === "Flashcard") {
      return `${roleRedirect}/${room_code}/flashcard/${game.game_id}`;
    } else if (game.game_type === "4 Pics 1 Word") {
      return `${roleRedirect}/${room_code}/4pics1word/${game.game_id}`;
    } else if (game.game_type === "4 Pics 1 Word Advanced") {
      return `${roleRedirect}/${room_code}/4pics1word_advanced/${game.game_id}`;
    } else if (game.game_type === "Color Game") {
      return `${roleRedirect}/${room_code}/color_game/${game.game_id}`;
    }
    return "#";
  };

  const renderGames = () => {
    const filteredGames = games.filter((game) => {
      return (
        (!filterByDifficulty || game.difficulty === filterByDifficulty) &&
        (!filterByGameType ||
          game.game_type.toLowerCase() === filterByGameType.toLowerCase()) &&
        (!filterByTitle ||
          game.title.toLowerCase().includes(filterByTitle.toLowerCase()))
      );
    });

    return filteredGames.map((game) => (
      <li key={game.game_id} className="flex items-center">
        <div className="flex flex-col my-4 mr-4">
          <Link href={getRedirectUrl(game)}>
            <Card className="py-4 hover:bg-gray-200" isPressable>
              <CardBody>
                <div className="flex gap-4">
                  <p className="border-r-2 pr-4">{game.game_type}</p>
                  <p>{game.title}</p>
                  <p>{game.game_type}</p>
                  <p>{game.game_id}</p>
                  <p>{game.difficulty}</p>
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
    ));
  };

  return (
    <div>
      <div className="flex items-center my-4 gap-4">
        <Input
          className="flex-2 max-w-[400px]"
          label="Search Title"
          value={filterByTitle}
          onChange={(e) => setFilterByTitle(e.target.value)}
        />
        <Select
          className="flex-1"
          label="Game Type"
          value={filterByGameType}
          onChange={(e) => setFilterByGameType(e.target.value)}
        >
          <SelectItem key="flashcard" value="flashcard">
            Flashcard
          </SelectItem>
          <SelectItem key="4 Pics 1 Word" value="4pics1word">
            4 Pics 1 Word
          </SelectItem>
          <SelectItem key="4 Pics 1 Word Advanced" value="4pics1word_advanced">
            4 Pics 1 Word Advanced
          </SelectItem>
          <SelectItem key="Color Game" value="color_game">
            Color Game
          </SelectItem>
        </Select>

        <Select
          className="flex-1"
          label="Difficulty"
          value={filterByDifficulty}
          onChange={(e) => setFilterByDifficulty(e.target.value)}
        >
          <SelectItem key="easy" value="easy">
            Easy
          </SelectItem>
          <SelectItem key="medium" value="medium">
            Medium
          </SelectItem>
          <SelectItem key="hard" value="hard">
            Hard
          </SelectItem>
        </Select>
      </div>

      <ul>{renderGames()}</ul>
    </div>
  );
};

export default ClassWorkList;
