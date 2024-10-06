import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Tab,
  Tabs,
  Select,
  SelectItem,
  Switch,
  Input,
} from "@nextui-org/react";
import Link from "next/link";
import { Trash, Edit, LayoutGrid, Grid2X2Plus, Palette } from "lucide-react";
import { TbCards } from "react-icons/tb";
import { useSession } from "next-auth/react";

const ClassWorkList = ({ room_code }) => {
  const [games, setGames] = useState([]);
  const [roleRedirect, setRoleRedirect] = useState("");
  const [redirectGameType, setRedirectGameType] = useState("");
  const [gameType, setGameType] = useState("");
  const [filterByDifficulty, setFilterByDifficulty] = useState("");
  const [filterByGameType, setFilterByGameType] = useState("");
  const [filterByTitle, setFilterByTitle] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    fetchGames();
    console.log(session);
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
    if (game.game_type === "flashcard") {
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

  const getGameTypeIcon = (game_type) => {
    switch (game_type.toLowerCase()) {
      case "flashcard":
        return <TbCards className="text-4xl text-white" />;
      case "4 pics 1 word":
        return <LayoutGrid className="w-7 h-7 text-white" />;
      case "4 pics 1 word advanced":
        return <LayoutGrid className="w-7 h-7 text-white" />;
      case "color game":
        return <Palette className="w-8 h-8 text-white" />;
      default:
        return <TbCards className="text-4xl text-white" />; // Default to flashcards if game type is unknown
    }
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
      <li key={game.game_id} className="relative flex w-full items-center">
        <div className="flex w-full items-center">
          <Link href={getRedirectUrl(game)} className="w-full">
            <Card
              radius="sm"
              className="flex items-center w-full py-4 px-6 hover:bg-gray-200"
            >
              <div className="flex w-full h-[70px] items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-[60px] h-[60px] bg-[#7469B6] rounded-full">
                    {getGameTypeIcon(game.game_type)}
                  </div>
                  <div className="text-left ml-4">
                    <div className="text-lg font-bold">
                      <h1>{game.title}</h1>
                    </div>
                    <div>
                      <p>
                        {game.game_type} ID {game.game_id}
                      </p>
                      <p>{game.difficulty}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
          <div className="absolute right-0 pr-6">
            <Button
              isIconOnly
              color="danger"
              onPress={() => handleDeleteGame(game.game_id, game.game_type)}
            >
              <Trash />
            </Button>
          </div>
        </div>
      </li>
    ));
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between my-4 gap-4">
        <div className="w-1/2">
          <Input
            radius="sm"
            label="Search Title"
            value={filterByTitle}
            onChange={(e) => setFilterByTitle(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-1/2 ">
          <Select
            radius="sm"
            className="flex-auto w-1/2"
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
            <SelectItem
              key="4 Pics 1 Word Advanced"
              value="4pics1word_advanced"
            >
              4 Pics 1 Word Advanced
            </SelectItem>
            <SelectItem key="Color Game" value="color_game">
              Color Game
            </SelectItem>
          </Select>

          <Select
            radius="sm"
            className="flex-auto w-1/2"
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
      </div>

      <div className="flex w-full">
        <ul className="w-full flex flex-col gap-4">{renderGames()}</ul>
      </div>
    </div>
  );
};

export default ClassWorkList;
