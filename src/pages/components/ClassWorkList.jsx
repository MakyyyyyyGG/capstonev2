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
import { Trash, Edit, LayoutGrid, Grid2X2Plus, Palette } from "lucide-react";
import { TbCards } from "react-icons/tb";
import { useSession } from "next-auth/react";

const ClassWorkList = ({ room_code, games = [] }) => {
  const [roleRedirect, setRoleRedirect] = useState("");
  const [filterByDifficulty, setFilterByDifficulty] = useState("");
  const [filterByGameType, setFilterByGameType] = useState("");
  const [filterByTitle, setFilterByTitle] = useState("");
  const [gameList, setGameList] = useState([]);
  const { data: session } = useSession();

  useEffect(() => {
    setGameList(games);
  }, [games]);

  const handleDeleteGame = async (game_id, game_type) => {
    const delWorkData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ game_id: game_id }),
    };
    if (game_type === "Flashcard") {
      if (confirm("Are you sure you want to delete this flashcard game?")) {
        try {
          const res = await fetch(
            `/api/flashcard/flashcard?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
          setGameList(gameList.filter((game) => game.game_id !== game_id));
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "ThinkPic") {
      if (confirm("Are you sure you want to delete this ThinkPic game?")) {
        console.log("deleting thinkpic game", game_id);
        try {
          const res = await fetch(
            `/api/4pics1word/4pics1word?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
          setGameList(gameList.filter((game) => game.game_id !== game_id));
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "ThinkPic +") {
      if (confirm("Are you sure you want to delete this ThinkPic + game?")) {
        console.log("deleting four pics one word advanced game", game_id);
        try {
          const res = await fetch(
            `/api/4pics1word_advanced/4pics1word_advanced?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
          setGameList(gameList.filter((game) => game.game_id !== game_id));
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
          setGameList(gameList.filter((game) => game.game_id !== game_id));
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "Color Game Advanced") {
      if (
        confirm("Are you sure you want to delete this Color Game Advanced?")
      ) {
        console.log("deleting color game advanced", game_id);
        try {
          const res = await fetch(
            `/api/color_game_advanced/color_game_advanced?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
          setGameList(gameList.filter((game) => game.game_id !== game_id));
        } catch (error) {
          console.log("Error deleting game:", error);
        }
      }
    } else if (game_type === "Decision Maker") {
      if (confirm("Are you sure you want to delete this Decision Maker?")) {
        console.log("deleting decision maker", game_id);
        try {
          const res = await fetch(
            `/api/decision_maker/decision_maker?game_id=${game_id}`,
            delWorkData
          );
          const data = await res.json();
          console.log(data);
          setGameList(gameList.filter((game) => game.game_id !== game_id));
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
    } else if (game.game_type === "ThinkPic") {
      return `${roleRedirect}/${room_code}/4pics1word/${game.game_id}`;
    } else if (game.game_type === "ThinkPic +") {
      return `${roleRedirect}/${room_code}/4pics1word_advanced/${game.game_id}`;
    } else if (game.game_type === "Color Game") {
      return `${roleRedirect}/${room_code}/color_game/${game.game_id}`;
    } else if (game.game_type === "Color Game Advanced") {
      return `${roleRedirect}/${room_code}/color_game_advanced/${game.game_id}`;
    } else if (game.game_type === "Decision Maker") {
      return `${roleRedirect}/${room_code}/decision_maker/${game.game_id}`;
    } else return "#";
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
    const filteredGames = gameList.filter((game) => {
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
      <div className="flex w-full items-center justify-between my-4 gap-4 max-sm:flex-col">
        <div className="w-1/2 z-0 max-sm:w-full">
          <Input
            radius="sm"
            label="Search Title"
            value={filterByTitle}
            onChange={(e) => setFilterByTitle(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-1/2 max-sm:w-full">
          <Select
            radius="sm"
            className="flex-auto w-1/2 z-0"
            label="Game Type"
            value={filterByGameType}
            onChange={(e) => setFilterByGameType(e.target.value)}
          >
            <SelectItem key="flashcard" value="flashcard">
              Flashcard
            </SelectItem>
            <SelectItem key="ThinkPic" value="thinkpic">
              ThinkPic
            </SelectItem>
            <SelectItem key="ThinkPic +" value="thinkpic_plus">
              ThinkPic +
            </SelectItem>
            <SelectItem key="Color Game" value="color_game">
              Color Game
            </SelectItem>
            <SelectItem key="Color Game Advanced" value="color_game_advanced">
              Color Game Advanced
            </SelectItem>
            <SelectItem key="Decision Maker" value="decision_maker">
              Decision Maker
            </SelectItem>
          </Select>

          <Select
            radius="sm"
            className="flex-auto w-1/2 z-0"
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
        <ul className="w-full flex flex-col gap-4">
          {gameList.length > 0 ? renderGames() : <p>Loading games...</p>}
        </ul>
      </div>
    </div>
  );
};

export default ClassWorkList;
