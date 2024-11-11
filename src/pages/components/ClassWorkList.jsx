import React, { useState, useEffect } from "react";
import { Card, CardBody, Chip, Button, Skeleton } from "@nextui-org/react";
import Link from "next/link";
import {
  Trash2,
  Edit,
  LayoutGrid,
  Grid2x2,
  Palette,
  Coins,
  Star,
} from "lucide-react";
import { TbCards } from "react-icons/tb";
import { FaRegLightbulb } from "react-icons/fa";
import { LiaListOlSolid } from "react-icons/lia";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ClassWorkList = ({ room_code, games = [] }) => {
  const [roleRedirect, setRoleRedirect] = useState("");
  const [filterByDifficulty, setFilterByDifficulty] = useState("all");
  const [filterByGameType, setFilterByGameType] = useState("all");
  const [filterByTitle, setFilterByTitle] = useState("");
  const [gameList, setGameList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setGameList(games);
      setLoading(false);
    }); // 1 seconds delay
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
      const deleteGamePromise = async () => {
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
        if (!res.ok) {
          throw new Error(data.error || "Failed to delete game");
        }

        setGameList(gameList.filter((game) => game.game_id !== game_id));
        return data;
      };

      toast.promise(deleteGamePromise(), {
        loading: "Deleting game...",
        success: "Game deleted successfully!",
        error: (err) => `Error: ${err.message}`,
      });
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
            <LiaListOlSolid className="text-3xl" />
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

  const getRewards = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return { coins: 10, exp: 10 };
      case "medium":
        return { coins: 20, exp: 20 };
      case "hard":
        return { coins: 40, exp: 40 };
      default:
        return { coins: 0, exp: 0 };
    }
  };

  const renderGames = () => {
    const filteredGames = gameList.filter((game) => {
      return (
        (filterByDifficulty === "all" ||
          game.difficulty === filterByDifficulty) &&
        (filterByGameType === "all" ||
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
              className=" shadow-none border-gray-300 border flex flex-row items-center w-full py-4 px-6 hover:bg-gray-200   hover:border-purple-700 max-sm:px-4 max-sm:py-3"
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
                            variant="flat"
                            size="sm"
                            color={getChipColor(game.difficulty)}
                            className=" capitalize"
                          >
                            {game.difficulty}
                          </Chip>
                        )}
                      </div>
                      <div className="">
                        <p>{game.game_type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center text-nowrap">
                    <div className="flex items-center mr-2 gap-4">
                      {/* <p className="text-sm font-semibold">Rewards:</p> */}
                      <div className="flex gap-4 text-sm text-gray-600 max-sm:flex-col max-sm:gap-1">
                        <div className="flex items-center gap-1.5">
                          <Coins className="h-5 w-5 text-yellow-500" />
                          <span className="text-lg font-bold">
                            {getRewards(game.difficulty).coins}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star
                            className="5-4 w-5 text-purple-500"
                            size={100}
                          />
                          <span className="text-lg font-bold">
                            {getRewards(game.difficulty).exp} EXP
                          </span>
                        </div>
                      </div>
                      <Chip
                        variant="bordered"
                        size="sm"
                        className="border border-purple-200 text-purple-600 z-0 text-[10px] h-5 font-black py-0"
                      >
                        <span className="text-xs">+ Bonus</span>
                      </Chip>
                    </div>
                  </div>
                </div>
              </Link>
              <div>
                {session.user.role === "teacher" && (
                  <Button
                    isIconOnly
                    color="transparent"
                    onPress={() =>
                      handleDeleteGame(game.game_id, game.game_type)
                    }
                  >
                    <Trash2 color="red" />
                  </Button>
                )}
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
      <Toaster />
      <div className="flex w-full items-center justify-between my-4 gap-4 max-sm:flex-col">
        <div className="w-1/2 z-0 max-sm:w-full">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mx-2" />
            <Input
              placeholder="Search Game"
              value={filterByTitle}
              onChange={(e) => setFilterByTitle(e.target.value)}
              className="pl-10 bg-white h-[50px] border-gray-300"
            />
          </div>
        </div>
        <div className="flex gap-4 w-1/2 max-sm:w-full">
          <Select
            value={filterByGameType}
            onValueChange={(value) => setFilterByGameType(value)}
            defaultValue="all"
          >
            <SelectTrigger className="w-full bg-white h-[50px] border-gray-300">
              <SelectValue placeholder="Game Type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="flashcard">Flashcard</SelectItem>
              <SelectItem value="thinkpic">ThinkPic</SelectItem>
              <SelectItem value="thinkpic +">ThinkPic +</SelectItem>
              <SelectItem value="color game">Color Game</SelectItem>

              <SelectItem value="decision maker">Decision Maker</SelectItem>
              <SelectItem value="sequence game">Sequence Game</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterByDifficulty}
            onValueChange={(value) => setFilterByDifficulty(value)}
            defaultValue="all"
          >
            <SelectTrigger className="w-full bg-white h-[50px] border-gray-300">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
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
