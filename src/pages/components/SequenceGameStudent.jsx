import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Progress,
} from "@nextui-org/react";
import { X, Check, RefreshCw, Pause, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import GameHistory from "./GameHistory";
import Summary from "./Summary";

const SequenceGameStudent = ({ sequenceGame }) => {
  const [gameData, setGameData] = useState([]); // Initialize as empty array
  const [selectedImages, setSelectedImages] = useState([]);
  const [answer, setAnswer] = useState(0);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [removedIndex, setRemovedIndex] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [score, setScore] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [feedback, setFeedback] = useState([]);

  const [isPlaying, setIsPlaying] = useState([]);
  const audioRefs = useRef([]);

  // Sound effect refs
  const correctSound = useRef(null);
  const incorrectSound = useRef(null);

  const handleAudioToggle = (index) => {
    if (audioRefs.current[index]) {
      if (isPlaying[index]) {
        audioRefs.current[index].pause();
      } else {
        audioRefs.current[index].play();
      }
      setIsPlaying((prev) => {
        const newPlayingState = [...prev];
        newPlayingState[index] = !newPlayingState[index];
        return newPlayingState;
      });
    }
  };

  useEffect(() => {
    if (sequenceGame) {
      setGameData(sequenceGame);
      setFeedback(Array(sequenceGame.length).fill(""));
      setAttempts(Array(sequenceGame.length).fill(0));
      setIsPlaying(Array(sequenceGame.length).fill(false));
      getStudentTries();
    }
  }, [sequenceGame]);

  useEffect(() => {
    if (isGameFinished) {
      handleResult();
    }
  }, [isGameFinished]);

  const getRandomPosition = (index, totalImages) => {
    const gridSize = Math.ceil(Math.sqrt(totalImages));
    const cellSize = 100 / gridSize;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    return {
      top: `${row * cellSize + Math.random() * (cellSize / 2)}%`,
      left: `${col * cellSize + Math.random() * (cellSize / 2)}%`,
    };
  };

  const randomPositions = useMemo(() => {
    if (!gameData || !gameData.length) return [];
    return gameData.map((_, index) =>
      getRandomPosition(index, gameData.length)
    );
  }, [gameData]);

  const handleImageSelect = (image, index) => {
    const imageIndex = selectedImages.indexOf(image);
    if (imageIndex !== -1) {
      handleRemoveImage(imageIndex);
    } else if (removedIndex !== null) {
      setSelectedImages((prev) => {
        const newImages = [...prev];
        newImages[removedIndex] = image;
        return newImages;
      });
      setRemovedIndex(null);
    } else {
      setSelectedImages((prev) => {
        const availableIndex = prev.findIndex((img) => img === null);
        if (availableIndex !== -1) {
          const newImages = [...prev];
          newImages[availableIndex] = image;
          return newImages;
        } else {
          return [...prev, image];
        }
      });
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
    setRemovedIndex(index);
  };

  const handleCheckStep = (idx, index) => {
    if (!sequenceGame || attempts[index] >= 3) return;

    const newAttempts = [...attempts];
    newAttempts[index]++;
    setAttempts(newAttempts);
    const isCorrect = selectedImages[index] === sequenceGame[index].image;

    const newFeedback = [...feedback];
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      newFeedback[index] = "Correct!";

      // Play correct sound
      correctSound.current.play();

      setAnswer((prevAnswer) => prevAnswer + 1);
    } else {
      if (newAttempts[index] >= 3) {
        newFeedback[index] = "Out of attempts. Moving to next question.";

        // Play incorrect sound
        incorrectSound.current.play();

        setAnswer((prevAnswer) => prevAnswer + 1);
      } else {
        newFeedback[index] = `Incorrect. ${
          3 - newAttempts[index]
        } attempts left.`;

        // Play incorrect sound
        incorrectSound.current.play();
      }
    }
    setFeedback(newFeedback);

    // Check if all cards have been answered or are out of attempts
    const allAnswered = newFeedback.every(
      (fb) => fb.includes("Correct") || fb.includes("Out of attempts")
    );
    if (allAnswered) {
      setIsGameFinished(true);
    }
  };

  const handleReset = () => {
    setSelectedImages([]);
    setRemovedIndex(null);
    setAttempts([]);
    setScore(0);
    setAnswer(0);
  };
  const getStudentTries = async () => {
    const account_id = session?.user?.id;
    try {
      const response = await fetch(
        `/api/student_game_record/student_game_record?account_id=${account_id}&game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setGameRecord(data.data);
        const latestAttempts = getLatestAttempts(data.data);
        console.log("latest attempts", latestAttempts);

        // Calculate attempts used
        const currentDate = new Date();
        const currentYearMonth = `${currentDate.getFullYear()}-${
          currentDate.getMonth() + 1
        }`;
        const currentMonthAttempts = latestAttempts[currentYearMonth] || [];
        setAttemptsUsed(currentMonthAttempts.length);
      }
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const getLatestAttempts = (data) => {
    // Group by month and year
    const attemptsByMonth = {};

    data.forEach((attempt) => {
      // Get year and month from created_at
      const date = new Date(attempt.created_at);
      const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`; // Format as "YYYY-MM"

      // Add attempt to the correct month
      if (!attemptsByMonth[yearMonth]) {
        attemptsByMonth[yearMonth] = [];
      }
      attemptsByMonth[yearMonth].push(attempt);
    });

    // Get the latest 8 attempts for each month
    const latestAttempts = {};
    Object.keys(attemptsByMonth).forEach((month) => {
      // Sort by created_at (newest first)
      const sortedAttempts = attemptsByMonth[month].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Keep only the latest 8 attempts
      latestAttempts[month] = sortedAttempts.slice(0, 8);
    });

    // setLatestAttempts(latestAttempts);
    return latestAttempts;
  };

  const handleResult = async () => {
    const data = {
      account_id: session.user.id,
      game_id: game_id,
      score: score,
    };

    try {
      const response = await fetch(
        "/api/student_game_record/student_game_record",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.status === 403) {
        alert(result.message); // Show the limit message
      } else {
        console.log(result);
        await getStudentTries();

        alert("Game finished! Your score: " + score);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div div className="relative flex flex-col justify-center">
      {/* Audio elements */}
      <audio
        ref={correctSound}
        src="/soundfx/audio/correct.mp3"
        preload="auto"
      />
      <audio
        ref={incorrectSound}
        src="/soundfx/audio/incorrect.mp3"
        preload="auto"
      />
      {isGameFinished ? (
        <>
          {gameRecord.length > 0 && (
            <Summary gameRecord={gameRecord} questions={gameData.length} />
          )}
        </>
      ) : (
        <>
          {gameData && gameData.length > 0 && gameData[0].video && (
            <>
              <div className="flex w-full justify-center pt-2">
                <div className="aspect-video w-full max-w-[50rem] max-h-[300px] rounded-lg overflow-hidden 'bg-black'">
                  <iframe
                    src={gameData[0].video}
                    frameBorder="0"
                    allowFullScreen
                    title="Sequence Game Video"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* <h1 className="text-2xl font-bold">{gameData[0].title}</h1> */}
            </>
          )}
          <div className="flex w-full justify-center items-center">
            <div className="flex w-full max-w-[50rem] items-center justify-between items-center pt-2">
              <div>
                <h1 className="text-2xl font-bold">Sequence Game</h1>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-4">
                  <p className="text-sm text-muted-foreground">
                    Score: {score} / {gameData.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Attempts used this month: {attemptsUsed} / 8
                  </p>
                </div>
                <GameHistory gameRecord={gameRecord} cards={gameData.length} />
              </div>
            </div>
          </div>
          {attemptsUsed >= 8 && (
            <div className="flex w-full justify-center items-center">
              <div className="w-full max-w-[50rem] bg-red-400 rounded-lg mt-3 p-3">
                <p className="text-sm text-white text-center">
                  You have used all your attempts for this month. Your score
                  wont be recorded. Wait for next month.
                </p>
              </div>
            </div>
          )}
          <div className="flex w-full justify-center items-center ">
            <div className="w-full max-w-[50rem] my-4">
              <Progress
                value={(answer / gameData.length) * 100}
                classNames={{
                  value: "text-foreground/60",
                  indicator: "bg-[#7469B6]",
                  track: "bg-purple-50",
                }}
              />
            </div>
          </div>
          <div className="flex justify-center items-center">
            <div className="w-full max-w-[50rem] grid md:grid-cols-2 gap-3">
              <Card className="p-4">
                <CardHeader>
                  <h1 className="text-xl font-bold">Available Steps</h1>
                </CardHeader>
                <CardBody className="relative border rounded-lg shadow-inner">
                  {sequenceGame &&
                    sequenceGame.map(
                      (item, index) =>
                        !selectedImages.includes(item.image) && (
                          <motion.div
                            key={index}
                            style={randomPositions[index]}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleImageSelect(item.image, index)}
                            className="absolute w-24 h-24 m-4 aspect-square rounded-lg overflow-hidden border"
                          >
                            <img
                              src={item.image}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer"
                            />
                          </motion.div>
                        )
                    )}
                </CardBody>
              </Card>
              <Card className="p-4">
                <CardHeader>
                  <h1 className="text-xl font-bold">Arrange the Sequence</h1>
                </CardHeader>
                <CardBody className="flex flex-col gap-3">
                  {sequenceGame &&
                    sequenceGame.map((item, index) => (
                      <motion.div
                        animate={{
                          borderColor: feedback[index]
                            ? feedback[index].includes("Correct")
                              ? "#22c55e" // green for correct
                              : attempts[index] >= 3
                              ? "#ef4444" // red for out of attempts
                              : "transparent" // keep transparent if no feedback or attempts
                            : "transparent", // no border if feedback is empty
                        }}
                        transition={{ duration: 0.5 }}
                        className={`border-2 rounded-lg ${
                          feedback[index] ? "" : "border-transparent"
                        }`} // no border class initially
                        style={{
                          transition: "border-color 0.5s ease", // Smooth transition for border
                        }}
                      >
                        <Card
                          key={index}
                          className="flex flex-col items-center gap-4 p-4 bg-white rounded-md border shadow-sm"
                        >
                          {/* display the available attems here */}
                          <div className="flex w-full gap-4 justify-between items-center">
                            <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                              {selectedImages[index] ? (
                                <motion.img
                                  src={selectedImages[index]}
                                  alt={`Selected Image ${index + 1}`}
                                  className="w-24 h-24 object-cover"
                                  initial={{ opacity: 0, y: 50 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25 }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  Step {index + 1}
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-medium">Step {index + 1}</h3>
                              <p className="text-sm text-muted-foreground">
                                {item.step}
                              </p>
                            </div>

                            {item.audio && (
                              <>
                                <div className="absolute top-1 right-1">
                                  <Button
                                    isIconOnly
                                    radius="sm"
                                    onClick={() => handleAudioToggle(index)}
                                    className="p-2 bg-transparent text-purple-500 hover:text-purple-700"
                                  >
                                    {isPlaying[index] ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Volume2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <audio
                                    ref={(el) =>
                                      (audioRefs.current[index] = el)
                                    }
                                    src={item.audio}
                                    onEnded={() =>
                                      setIsPlaying((prev) => {
                                        const newPlayingState = [...prev];
                                        newPlayingState[index] = false;
                                        return newPlayingState;
                                      })
                                    }
                                  />
                                </div>
                              </>
                            )}

                            {selectedImages[index] && (
                              <>
                                <div className="flex gap-1">
                                  <Button
                                    isIconOnly
                                    radius="sm"
                                    variant="flat"
                                    onClick={() => handleRemoveImage(index)}
                                    isDisabled={
                                      attempts[index] >= 3 ||
                                      feedback[index] === "Correct!"
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    radius="sm"
                                    variant="flat"
                                    color="success"
                                    onClick={() =>
                                      attempts[index] < 3 &&
                                      !feedback[index]?.includes("Correct")
                                        ? handleCheckStep(index, index)
                                        : null
                                    }
                                    isDisabled={
                                      feedback[index] === "Correct!" ||
                                      attempts[index] >= 3
                                    }
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          <AnimatePresence>
                            {feedback[index] && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="flex w-full text-center justify-center rounded-md"
                              >
                                <motion.div
                                  key={feedback[index]}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 20 }}
                                  className={
                                    feedback[index].includes("Correct")
                                      ? "text-white w-full bg-green-500 p-2 rounded-md"
                                      : "text-white w-full bg-red-500 p-2 rounded-md"
                                  }
                                >
                                  {feedback[index]}
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                </CardBody>
                <CardFooter className="flex justify-between items-center py-4">
                  <Button onClick={handleReset} variant="bordered" radius="sm">
                    <RefreshCw className="h-4 w-4 mr-2" /> Reset
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SequenceGameStudent;
