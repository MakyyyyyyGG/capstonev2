import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Select,
  SelectItem,
  Input,
  Skeleton,
} from "@nextui-org/react";
import Link from "next/link";
import { Trash2, Edit, LayoutGrid, Grid2x2, Palette } from "lucide-react";
import { TbCards } from "react-icons/tb";
import { FaRegLightbulb } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
const ClassWorkList = ({ room_code, games = [] }) => {
  const [roleRedirect, setRoleRedirect] = useState("");
  const [filterByDifficulty, setFilterByDifficulty] = useState("");
  const [filterByGameType, setFilterByGameType] = useState("");
  const [filterByTitle, setFilterByTitle] = useState("");
  const [gameList, setGameList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setGameList(games);
      setLoading(false);
    }, 500); // 1 seconds delay
  }, [games]);

  const handleDeleteGame = async (game_id, game_type) => {
    const delWorkData = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ game_id: game_id }),
    };

    if (confirm(`Are you sure you want to delete this ${game_type} game?`)) {
      try {
        let res;
        if (game_type === "Flashcard") {
          res = await fetch(
            `/api/flashcard/flashcard?game_id=${game_id}`,
            delWorkData
          );
        } else if (game_type === "ThinkPic") {
          res = await fetch(
            `/api/4pics1word/4pics1word?game_id=${game_id}`,
            delWorkData
          );
        } else if (game_type === "ThinkPic +") {
          res = await fetch(
            `/api/4pics1word_advanced/4pics1word_advanced?game_id=${game_id}`,
            delWorkData
          );
        } else if (game_type === "Color Game") {
          res = await fetch(
            `/api/color_game/color_game?game_id=${game_id}`,
            delWorkData
          );
        } else if (game_type === "Color Game Advanced") {
          res = await fetch(
            `/api/color_game_advanced/color_game_advanced?game_id=${game_id}`,
            delWorkData
          );
        } else if (game_type === "Decision Maker") {
          res = await fetch(
            `/api/decision_maker/decision_maker?game_id=${game_id}`,
            delWorkData
          );
        } else if (game_type === "Sequence Game") {
          res = await fetch(
            `/api/sequence_game/sequence_game?game_id=${game_id}`,
            delWorkData
          );
        }

        const data = await res.json();
        console.log(data);
        setGameList(gameList.filter((game) => game.game_id !== game_id));
      } catch (error) {
        console.log("Error deleting game:", error);
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
    if (session) {
      isTeacher();
    } else {
      return;
    }
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
    } else if (game.game_type === "Sequence Game") {
      return `${roleRedirect}/${room_code}/sequence_game/${game.game_id}`;
    } else return "#";
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Flashcard":
        return "bg-[#7C3AED]/10 text-[#7C3AED]";
      case "Decision Maker":
        return "bg-[#7C3AED]/10 text-[#7C3AED]";
      case "ThinkPic":
        return "bg-[#7C3AED]/10  text-[#7C3AED]";
      case "Color Game Advanced":
        return "bg-[#7C3AED]/10 text-[#7C3AED]";
      default:
        return "bg-[#7C3AED]/10 text-[#7C3AED]"; // Default color
    }
  };

  const getGameTypeIcon = (game_type) => {
    const typeColor = getTypeColor(game_type);
    switch (game_type.toLowerCase()) {
      case "flashcard":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <TbCards className="text-4xl" />
          </div>
        );
      case "thinkpic":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <Grid2x2 className="w-7 h-7" />
          </div>
        );
      case "thinkpic +":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <LayoutGrid className="w-7 h-7" />
          </div>
        );
      case "color game":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <Palette className="w-8 h-8" />
          </div>
        );
      case "color game advanced":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <Palette className="w-8 h-8" />
          </div>
        );
      case "decision maker":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <FaRegLightbulb className="text-3xl -rotate-[15deg]" />
          </div>
        );
      case "sequence game":
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <TbCards className="text-4xl" />
          </div>
        );
      default:
        return (
          <div
            className={`flex items-center justify-center w-[60px] h-[60px] ${typeColor} rounded-xl`}
          >
            <TbCards className="text-4xl" />
          </div>
        ); // Default to flashcards if game type is unknown
    }
  };

  // Helper function to return the Chip color based on difficulty
  const getChipColor = (difficulty) => {
    if (!difficulty) return "default"; // Return a default color if difficulty is null or undefined

    switch (difficulty.toLowerCase()) {
      case "easy":
        return "success"; // Green for easy
      case "medium": // Assuming "medium" is equivalent to "moderate"
      case "moderate":
        return "warning"; // Yellow for medium/moderate
      case "hard":
        return "danger"; // Red for hard
      default:
        return "default"; // Fallback color
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

    return filteredGames.length ? (
      filteredGames.map((game) => (
        <li key={game.game_id} className="flex w-full items-center ">
          <div className="flex w-full items-center">
            <Card
              isPressable
              radius="sm"
              className=" flex flex-row items-center w-full py-4 px-6 hover:bg-gray-200   hover:border-purple-700 max-sm:px-4 max-sm:py-3"
            >
              <Link href={getRedirectUrl(game)} className="w-full">
                <div className="flex w-full h-[70px] items-center justify-between max-sm:scale-[95%]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-[60px] h-[60px]  rounded-xl">
                      {getGameTypeIcon(game.game_type)}
                    </div>
                    <div className="text-left ml-4">
                      <div className="text-lg font-bold flex items-center gap-2">
                        <h1>{game.title} </h1>
                        {game.difficulty && (
                          <Chip
                            color={getChipColor(game.difficulty)}
                            radius="xl"
                            className="text-sm text-white capitalize"
                          >
                            {game.difficulty}
                          </Chip>
                        )}
                      </div>
                      <div className="">
                        <p>{game.game_type}</p>

                        {/* {game.difficulty && (
                          <Chip
                            color={getChipColor(game.difficulty)}
                            radius="sm"
                            className="text-sm text-white capitalize"
                          >
                            {game.difficulty}
                          </Chip>
                        )} */}
                        {/* <p>ID {game.game_id}</p> */}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              <div>
                <Button
                  isIconOnly
                  color="transparent"
                  onPress={() => handleDeleteGame(game.game_id, game.game_type)}
                >
                  <Trash2 color="red" />
                </Button>
              </div>
            </Card>
          </div>
        </li>
      ))
    ) : (
      <div className="flex flex-col items-center justify-center w-full rounded-lg p-4  h-[700px] ">
        <img
          src="/no-game.svg"
          alt="empty-game"
          className="object-cover h-full"
        />
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between my-4 gap-4 max-sm:flex-col">
        <div className="w-1/2 z-0 max-sm:w-full">
          <Input
            startContent={<Search size={20} color="#6B7280" />}
            isClearable
            size="lg"
            onClear={() => setFilterByTitle("")}
            radius="sm"
            color="secondary"
            variant="bordered"
            placeholder="Search Game"
            value={filterByTitle}
            classNames={{
              label: "text-white",
              inputWrapper: "bg-[#ffffff] ",
            }}
            onChange={(e) => setFilterByTitle(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-1/2 max-sm:w-full">
          <Select
            radius="sm"
            size="lg"
            variant="bordered"
            color="secondary"
            className="flex-auto w-1/2 z-0"
            placeholder="Game Type"
            value={filterByGameType}
            classNames={{
              label: "text-white",
              mainWrapper: "bg-[#ffffff] rounded-lg border-purple-400",
            }}
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
            <SelectItem key="Sequence Game" value="sequence_game">
              Sequence Game
            </SelectItem>
          </Select>

          <Select
            classNames={{
              label: "text-white",
              mainWrapper: "  bg-[#ffffff] rounded-lg border-purple-400",
            }}
            radius="sm"
            size="lg"
            variant="bordered"
            color="secondary"
            className="flex-auto w-1/2 z-0"
            placeholder="Difficulty"
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
          {loading
            ? Array.from({ length: games.length }).map((_, index) => (
                <Skeleton key={index} className="w-full h-[100px] rounded-md" />
              ))
            : renderGames()}
        </ul>
      </div>
    </div>
  );
};

export default ClassWorkList;
