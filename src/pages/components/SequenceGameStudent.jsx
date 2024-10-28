import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  CardHeader,
  Progress,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import BarChart from "./BarChart";
import GameHistory from "./GameHistory";
import Summary from "./Summary";
const SequenceGameStudent = ({ sequenceGame }) => {
  const [gameData, setGameData] = useState(sequenceGame);
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
  const [feedback, setFeedback] = useState(Array(gameData.length).fill(""));

  useEffect(() => {
    if (sequenceGame) {
      setGameData(sequenceGame);
      setFeedback(Array(gameData.length).fill(""));
      setAttempts(Array(gameData.length).fill(0)); // Reset attempts when cards change
      getStudentTries();
      console.log("game Data", gameData);
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
    if (attempts[index] >= 3) return; // If 3 attempts are used, do nothing
    const newAttempts = [...attempts];
    newAttempts[index]++;
    setAttempts(newAttempts);
    const isCorrect = selectedImages[index] === sequenceGame[index].image;

    const newFeedback = [...feedback];
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      newFeedback[index] = "Correct!";
      setAnswer((prevAnswer) => prevAnswer + 1);
    } else {
      if (newAttempts[index] >= 3) {
        newFeedback[index] = "Out of attempts. Moving to next question.";
        setAnswer((prevAnswer) => prevAnswer + 1);
      } else {
        newFeedback[index] = `Incorrect. ${
          3 - newAttempts[index]
        } attempts left.`;
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
    <div>
      {isGameFinished ? (
        <>
          {gameRecord.length > 0 && (
            // <BarChart gameRecord={gameRecord} questions={gameData.length} />
            <Summary gameRecord={gameRecord} questions={gameData.length} />
          )}
        </>
      ) : (
        <>
          {gameData && gameData.length > 0 && gameData[0].video && (
            <>
              <iframe
                src={gameData[0].video}
                frameBorder="0"
                width="100%"
                height="400"
                allowFullScreen
                title="Sequence Game Video"
              />
              <h1>{gameData[0].title}</h1>
            </>
          )}
          <h1>Score: {score}</h1>
          <h1>Attempts used this month: {attemptsUsed} / 8</h1>

          <GameHistory gameRecord={gameRecord} cards={gameData.length} />

          {attemptsUsed >= 8 && (
            <div className="w-1/2 bg-red-400 rounded-md p-4">
              <p className="text-white">
                You have used all your attempts for this month. Your score wont
                be recorded. Wait for next month.
              </p>
            </div>
          )}
          <Progress
            value={(answer / gameData.length) * 100}
            classNames={{
              // label: "tracking-wider",
              value: "text-foreground/60",
            }}
            label="Progress"
            showValueLabel={true}
            color="success"
          />
          <div className="grid grid-cols-2 w-full">
            <div className="border-2 border-gray-300 rounded-md p-4 relative h-[600px] w-[600px]">
              {sequenceGame.map(
                (item, index) =>
                  !selectedImages.includes(item.image) && (
                    <motion.div
                      key={index}
                      className="absolute"
                      style={randomPositions[index]}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleImageSelect(item.image, index)}
                    >
                      <img
                        src={item.image}
                        alt={`Image ${index + 1}`}
                        className="w-24 h-24 object-cover cursor-pointer"
                      />
                    </motion.div>
                  )
              )}
            </div>
            <div>
              <div className="border-2 p-4">
                {sequenceGame.map((item, index) => (
                  <Card key={index}>
                    <CardBody>
                      <p>Step {index + 1}</p>
                      {item.audio && <audio src={item.audio} controls />}
                      <p>{item.step}</p>
                      {/* display the available attems here */}
                      <div>
                        {selectedImages[index] ? (
                          <motion.img
                            src={selectedImages[index]}
                            alt={`Selected Image ${index + 1}`}
                            className="w-24 h-24 object-cover"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          />
                        ) : (
                          <div className="w-24 h-24 border-2 border-gray-300 flex items-center justify-center">
                            <p>Placeholder</p>
                          </div>
                        )}
                        {selectedImages[index] && (
                          <>
                            <Button
                              onClick={() => handleRemoveImage(index)}
                              isDisabled={
                                attempts[index] >= 3 ||
                                feedback[index] === "Correct!"
                              }
                            >
                              Remove
                            </Button>
                            <Button
                              onClick={() =>
                                attempts[index] < 3 &&
                                !feedback[index]?.includes("Correct")
                                  ? handleCheckStep(index, index)
                                  : null
                              }
                              // className={`w-full h-full object-cover ${
                              //   attempts[index] >= 3 ||
                              //   feedback[index]?.includes("Correct")
                              //     ? "opacity-50 cursor-not-allowed"
                              //     : ""
                              // }`}
                              //disbaled if its correct or attempts are over
                              isDisabled={
                                feedback[index] === "Correct!" ||
                                attempts[index] >= 3
                              }
                            >
                              Check
                            </Button>
                          </>
                        )}
                        {feedback[index] && (
                          <p
                            className={
                              feedback[index].includes("Correct")
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {feedback[index]}
                          </p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
                <Button onClick={handleReset}>Reset</Button>
                <p>Score: {score}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SequenceGameStudent;
