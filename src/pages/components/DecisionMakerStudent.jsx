import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Card,
  CardBody,
  Image,
  Progress,
} from "@nextui-org/react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  EffectCreative,
} from "swiper/modules";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";
import "swiper/css/effect-creative";
import Summary from "./Summary";
import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Check,
  X,
  ArrowLeftRight,
} from "lucide-react";
import GameHistory from "./GameHistory";

const DecisionMakerStudent = ({ cards = [] }) => {
  // Add default empty array
  const [firstCard, setFirstCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState({});
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState([]);
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const [gameCompleted, setGameCompleted] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  // Sound effect refs
  const correctSound = useRef(null);
  const incorrectSound = useRef(null);

  useEffect(() => {
    if (cards && cards.length > 0) {
      // Add null check
      setFirstCard(cards[0]);
      setShuffledCards(shuffleArray(cards));
      getStudentTries();
    }
  }, [cards]);

  useEffect(() => {
    if (isGameFinished) {
      handleResult();
    }
  }, [isGameFinished]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleVote = (card, vote) => {
    const isCorrect = card.correct_answer === vote;
    const newFeedback = { ...feedback };

    if (isCorrect) {
      newFeedback[card.decision_maker_id] = "Correct!";

      // Play correct sound
      correctSound.current.play();

      setScore((prevScore) => prevScore + 1);
    } else {
      newFeedback[card.decision_maker_id] = "Incorrect.";

      // Play incorrect sound
      incorrectSound.current.play();
    }

    setFeedback(newFeedback);
    setAnswer((prev) => prev + 1);

    setSelectedCards((prev) => ({
      ...prev,
      [card.decision_maker_id]: {
        ...card,
        isCorrect,
        feedback: newFeedback[card.decision_maker_id],
      },
    }));

    // Delay before moving to the next slide
    setTimeout(() => {
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    }, 2500); // 2.5-second delay

    const allAnswered = shuffledCards.every(
      (card) => newFeedback[card.decision_maker_id]
    );

    // Delay before finishing
    setTimeout(() => {
      if (allAnswered) {
        setIsGameFinished(true);
      }
    }, 2500); // 2.5-second delay
  };

  const buttonPairs = [
    {
      positive: <ThumbsUp size={20} />,
      negative: <ThumbsDown size={20} />,
    },
    {
      positive: <Smile size={20} />,
      negative: <Frown size={20} />,
    },
    {
      positive: <Check size={20} />,
      negative: <X size={20} />,
    },
  ];

  const changeIconPair = () => {
    setCurrentPairIndex((prevIndex) => (prevIndex + 1) % buttonPairs.length);
  };

  const endGame = async () => {
    if (gameCompleted) {
      await handleResult();
      alert("You have completed the game!");
    }
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
      account_id: session?.user?.id,
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
        await getStudentTries();
      } else {
        console.log(result);
        alert("Game finished!");
        await getStudentTries();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="relative flex flex-col justify-center">
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
          {gameRecord &&
            gameRecord.length > 0 &&
            cards && ( // Add null checks
              <Summary gameRecord={gameRecord} questions={cards.length} />
            )}
        </>
      ) : (
        <>
          <div className="flex w-full justify-center items-center">
            <div className="flex w-full max-w-[50rem] items-center justify-between items-center pt-2">
              <div>
                <h1 className="text-2xl font-bold">Decision Game</h1>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-4">
                  <p className="text-sm text-muted-foreground">
                    Score: {score} / {cards?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Attempts this month: {attemptsUsed} / 8
                  </p>
                </div>
                <Button
                  variant="flat"
                  color="secondary"
                  onPress={changeIconPair}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                  Change Icons
                </Button>
                {gameRecord &&
                  cards && ( // Add null check
                    <GameHistory gameRecord={gameRecord} cards={cards.length} />
                  )}
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
                value={(answer / (cards?.length || 1)) * 100}
                classNames={{
                  value: "text-foreground/60",
                  indicator: "bg-[#7469B6]",
                  track: "bg-purple-50",
                }}
              />
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl">
            <Swiper
              grabCursor={true}
              effect={"creative"}
              creativeEffect={{
                prev: {
                  shadow: true,
                  translate: [0, 0, -400],
                },
                next: {
                  translate: ["100%", 0, 0],
                },
              }}
              modules={[EffectCreative]}
              className="mySwiper w-full drop-shadow-lg rounded-md"
              onSwiper={(swiper) => setSwiperInstance(swiper)}
              onSlideChange={() => console.log("slide change")}
              onSwiperSlideChange={() => console.log("swiper slide change")}
            >
              {shuffledCards &&
                shuffledCards.map(
                  (
                    card // Add null check
                  ) => (
                    <SwiperSlide key={card.decision_maker_id}>
                      <motion.div
                        animate={{
                          borderColor:
                            feedback[card.decision_maker_id] === "Correct!"
                              ? "#22c55e"
                              : feedback[card.decision_maker_id]
                              ? "#ef4444"
                              : "#e5e7eb",
                        }}
                        transition={{ duration: 0.5 }}
                        className="border-4 rounded-lg"
                      >
                        <Card
                          key={card.decision_maker_id}
                          className="w-full rounded-md flex flex-col gap-4 max-w-[50rem] mx-auto"
                        >
                          <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
                            <h1 className="text-3xl font-extrabold my-5 capitalize">
                              {card.word}
                            </h1>
                            <div className="max-w-[15rem]">
                              <Image
                                src={card.image}
                                alt={card.title}
                                width="100%"
                                height="100%"
                              />
                            </div>
                            <div className="flex justify-center gap-4 pt-4">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  onPress={() => handleVote(card, "positive")}
                                  color="success"
                                  variant="flat"
                                  isDisabled={feedback[card.decision_maker_id]}
                                >
                                  {buttonPairs[currentPairIndex].positive}
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  onPress={() => handleVote(card, "negative")}
                                  color="danger"
                                  variant="flat"
                                  isDisabled={feedback[card.decision_maker_id]}
                                >
                                  {buttonPairs[currentPairIndex].negative}
                                </Button>
                              </motion.div>
                            </div>
                            <AnimatePresence>
                              {feedback[card.decision_maker_id] && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 20 }}
                                  className="flex w-full text-center justify-center rounded-md"
                                >
                                  <motion.div
                                    key={feedback[card.decision_maker_id]}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className={
                                      feedback[card.decision_maker_id] ===
                                      "Correct!"
                                        ? "text-white w-full bg-green-500 p-2 rounded-md"
                                        : "text-white w-full bg-red-500 p-2 rounded-md"
                                    }
                                  >
                                    {feedback[card.decision_maker_id]}
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardBody>
                        </Card>
                      </motion.div>
                    </SwiperSlide>
                  )
                )}
            </Swiper>
          </div>
        </>
      )}
    </div>
  );
};

export default DecisionMakerStudent;
