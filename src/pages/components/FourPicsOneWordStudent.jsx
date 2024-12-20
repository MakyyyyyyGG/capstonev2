import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardFooter,
  CardBody,
  Button,
  Progress,
  Input,
} from "@nextui-org/react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCreative } from "swiper/modules";
import Summary from "./Summary";
import "swiper/swiper-bundle.css";
import "swiper/css/effect-creative";
import Loader from "./Loader";
import GameHistory from "./GameHistory";
import { ArrowLeft, CircleCheck } from "lucide-react";

const FourPicsOneWordStudent = ({ cards = [] }) => {
  const [shuffledCards, setShuffledCards] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const inputRefs = useRef([]);
  // Sound effect refs
  const correctSound = useRef(null);
  const incorrectSound = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [rewards, setRewards] = useState({ coins: 0, exp: 0 });
  const [hintsUsed, setHintsUsed] = useState(0);

  useEffect(() => {
    if (cards?.length > 0 && session) {
      const shuffled = shuffleArray(cards);
      setShuffledCards(shuffled);
      setUserAnswers(Array(shuffled.length).fill(""));
      setAttempts(Array(shuffled.length).fill(0));
      setFeedback(Array(shuffled.length).fill(""));
      getStudentTries();
    }
  }, [cards, session]);

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
      latestAttempts[month] = sortedAttempts.slice(0, 13);
    });

    // setLatestAttempts(latestAttempts);
    return latestAttempts;
  };

  const handleChange = (value, index) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[index] = value;
    setUserAnswers(newUserAnswers);
  };

  const checkAnswer = (index) => {
    const currentAttempts = attempts[index];
    if (currentAttempts >= 3) return;

    const userAnswer = userAnswers[index].toLowerCase();
    const correctAnswer = shuffledCards[index].word.toLowerCase();

    const newAttempts = [...attempts];
    newAttempts[index]++;
    setAttempts(newAttempts);
    console.log("in card index: ", index, "attemps: ", newAttempts);
    const newFeedback = [...feedback];
    if (userAnswer === correctAnswer) {
      newFeedback[index] = "Correct!";
      setScore((prevScore) => prevScore + 1);
      setAnsweredQuestions((prevAnswered) => prevAnswered + 1);

      // Show emoji briefly when the answer is correct
      setShowEmoji(true);
      setTimeout(() => setShowEmoji(false), 1400); // 1.4-second delay to hide emoji

      // Play correct sound
      correctSound.current.play();

      // Delay before moving to the next slide
      setTimeout(() => {
        if (swiperInstance) {
          swiperInstance.slideNext();
        }
      }, 2500); // 2.5-second delay
    } else if (newAttempts[index] >= 3) {
      newFeedback[index] =
        "Out of attempts. The correct answer was: " + correctAnswer;
      setAnsweredQuestions((prevAnswered) => prevAnswered + 1);

      // Play incorrect sound
      incorrectSound.current.play();

      // Delay before moving to the next slide
      setTimeout(() => {
        if (swiperInstance) {
          swiperInstance.slideNext();
        }
      }, 2500); // 2.5-second delay
    } else {
      newFeedback[index] = `Incorrect. ${
        3 - newAttempts[index]
      } attempts left.`;

      // Play incorrect sound
      incorrectSound.current.play();
    }
    setFeedback(newFeedback);

    // Check if all cards have been answered
    const allAnswered = newFeedback.every(
      (fb) => fb.includes("Correct") || fb.includes("Out of attempts")
    );

    // Delay before finishing
    setTimeout(() => {
      if (allAnswered) {
        setIsGameFinished(true);
        getRewards(shuffledCards[0].difficulty);
      }
    }, 2500); // 2.5-second delay
  };

  const handleResult = async () => {
    if (!session || !session.user) {
      console.error("Session or user is undefined");
      return;
    }
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
      if (response.status === 200) {
        // alert("Game Recorded Successfully");
        await getStudentTries();
      } else if (response.status === 403) {
        // alert(result.message); // Show the limit message
      } else {
        console.log(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleKeyDown = (e, cardIndex, inputIndex) => {
    if (e.key === "Backspace" && inputIndex > 0 && !e.target.value) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[cardIndex][inputIndex - 1].focus();
    } else if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
      // If a letter key is pressed
      e.preventDefault();
      const newAnswer = [...(userAnswers[cardIndex] || "")];
      newAnswer[inputIndex] = e.key.toLowerCase();
      handleChange(newAnswer.join(""), cardIndex);

      // Move to next input
      if (inputIndex < shuffledCards[cardIndex].word.length - 1) {
        inputRefs.current[cardIndex][inputIndex + 1].focus();
      }
    }
  };

  const calculateBonus = (score) => {
    return Math.round(score * 0.2); // 20% of score
  };

  const getRewards = (difficulty) => {
    if (difficulty === "easy") {
      setRewards({ coins: 10, exp: 10, bonus: calculateBonus(10) });
    } else if (difficulty === "medium") {
      setRewards({ coins: 20, exp: 20, bonus: calculateBonus(20) });
    } else {
      setRewards({ coins: 40, exp: 40, bonus: calculateBonus(40) });
    }
  };

  const useHint = (index) => {
    if (hintsUsed >= 3) return; // Limit to 3 hints per game
    const correctAnswer = shuffledCards[index].word.toLowerCase();
    const newAnswer = [...(userAnswers[index] || "")];
    for (let i = 0; i < correctAnswer.length; i++) {
      if (!newAnswer[i]) {
        newAnswer[i] = correctAnswer[i];
        break;
      }
    }
    setUserAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[index] = newAnswer.join("");
      return updatedAnswers;
    });
    setHintsUsed((prevHints) => prevHints + 1);
  };
  // Handle case where flashcards is undefined
  if (!cards || cards.length === 0) {
    return (
      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-center px-4 pt-4">
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
            <Summary
              gameRecord={gameRecord}
              questions={cards.length}
              rewards={rewards}
            />
          )}
        </>
      ) : (
        <>
          <div
            className="flex w-full max-w-[50rem] mx-auto justify-center items-center bg-white border-4 border-purple-300 rounded-md p-4"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <div className="flex w-full max-w-[50rem] justify-between items-center">
              <div>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => router.back()}
                >
                  <ArrowLeft size={24} className="text-purple-700" />
                  <span className="text-2xl font-bold text-purple-700">
                    {cards[0]?.title}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <CircleCheck className="w-6 h-6 text-white fill-green-500" />
                    <span className="text-lg font-bold text-purple-700">
                      {score}/{cards.length}
                    </span>
                  </div>
                  <div className="text-sm font-medium bg-purple-100 px-3 py-1 rounded-full text-purple-600">
                    Monthly Tries: {attemptsUsed}/13
                  </div>
                </div>
                {/* <Shop /> */}
                <GameHistory gameRecord={gameRecord} cards={cards.length} />
                {/* <h1>Questions Answered: {answeredQuestions}</h1>
              <h1>cards length: {cards.length}</h1> */}
              </div>
            </div>
          </div>
          {attemptsUsed >= 13 && (
            <div className="flex w-full justify-center items-center">
              <div className="w-full max-w-[50rem] bg-red-400 rounded-lg mt-3 p-3">
                <p className="text-sm text-white text-center">
                  You have used all your attempts for this month. Your score
                  wont be recorded. Wait for next month.
                </p>
              </div>
            </div>
          )}
          <div
            className="flex w-full max-w-[50rem] mx-auto justify-center items-center bg-white border-4 border-purple-300 rounded-full px-4 my-4"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <div className="w-full max-w-[50rem] my-3">
              <Progress
                value={(answeredQuestions / cards.length) * 100}
                classNames={{
                  value: "text-foreground/60",
                  indicator: "bg-purple-500",
                  track: "bg-slate-200",
                }}
              />
            </div>
          </div>

          <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl mb-4">
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
              style={{
                filter: "drop-shadow(4px 4px 0px #7828C8",
              }}
              onSwiper={(swiper) => setSwiperInstance(swiper)}
            >
              {shuffledCards.map((card, index) => (
                <SwiperSlide key={index}>
                  <motion.div
                    animate={{
                      borderColor: feedback[index]?.includes("Correct")
                        ? "#22c55e" // green for correct
                        : attempts[index] >= 3
                        ? "#f9a8d4" // pink for out of attempts, default for others
                        : "#d8b4fe",
                    }}
                    transition={{ duration: 0.5 }}
                    className="border-4 bg-white rounded-lg"
                  >
                    <Card className="w-full rounded-md shadow-xl flex flex-col gap-2 h-[40rem] aspect-square mx-auto p-4">
                      <CardBody className="flex gap-2 px-auto items-center justify-center py-0 ">
                        {/* <p>Attempts left: {3 - (attempts[index] || 0)}</p> */}
                        <div
                          className={`grid ${
                            [
                              card.image1,
                              card.image2,
                              card.image3,
                              card.image4,
                            ].filter(Boolean).length === 4
                              ? "grid-cols-2 max-w-[24rem]"
                              : [
                                  card.image1,
                                  card.image2,
                                  card.image3,
                                  card.image4,
                                ].filter(Boolean).length === 3
                              ? "grid-cols-3 max-sm:grid-cols-2 max-sm:max-w-[24rem]"
                              : "grid-cols-2"
                          } gap-4 justify-center px-4`}
                        >
                          {[
                            card.image1,
                            card.image2,
                            card.image3,
                            card.image4,
                          ].map(
                            (image, idx) =>
                              image && (
                                <img
                                  key={idx}
                                  src={`${image}`}
                                  alt={`Image ${idx + 1}`}
                                  className="w-full aspect-square border-4 border-purple-300 bg-white object-cover rounded-md"
                                  style={{
                                    filter: "drop-shadow(4px 4px 0px #7828C8",
                                  }}
                                />
                              )
                          )}
                        </div>
                      </CardBody>
                      <CardFooter className="flex flex-col items-center gap-2 w-full pt-0">
                        {/* <h1>Question: {card.question}</h1> */}

                        <div className="w-full text-center bg-white">
                          <header className="mb-4 mt-1">
                            <h1 className="text-xl font-bold text-purple-700 mb-1">
                              Enter Your Answer!
                            </h1>
                            {/* <p className="text-xs text-slate-500">
                              Enter the answer based on the images above.
                            </p> */}
                          </header>
                          <form id="otp-form">
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              {Array.from({
                                length: card.word?.length || 0,
                              }).map((_, idx) => (
                                <motion.input
                                  key={idx}
                                  type="text"
                                  className={`w-12 h-12 text-center text-purple-700 text-xl font-bold rounded-lg border-4 uppercase focus:outline-none ${
                                    feedback[index]?.includes("Correct") ||
                                    attempts[index] >= 3
                                      ? "border-purple-200 text-gray-500" // Disabled state
                                      : "border-purple-300 focus:border-purple-500" // Normal and focus state
                                  }`}
                                  style={{
                                    backgroundColor:
                                      feedback[index]?.includes("Correct") ||
                                      attempts[index] >= 3
                                        ? "#F3F4F6"
                                        : "white", // Slightly gray background when disabled
                                    filter:
                                      feedback[index]?.includes("Correct") ||
                                      attempts[index] >= 3
                                        ? "drop-shadow(4px 4px 0px #a78bfa)" // Softer shadow for disabled state
                                        : "drop-shadow(4px 4px 0px #7828C8)", // Normal shadow
                                    opacity: 1,
                                  }}
                                  whileFocus={{ scale: 1.1 }}
                                  maxLength="1"
                                  value={userAnswers[index]?.[idx] || ""}
                                  onChange={(e) => {
                                    const newAnswer = userAnswers[index]
                                      ? userAnswers[index].split("")
                                      : [];
                                    newAnswer[idx] = e.target.value;
                                    handleChange(newAnswer.join(""), index);
                                  }}
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, index, idx)
                                  }
                                  ref={(el) => {
                                    if (!inputRefs.current[index]) {
                                      inputRefs.current[index] = [];
                                    }
                                    inputRefs.current[index][idx] = el;
                                  }}
                                  disabled={
                                    feedback[index]?.includes("Correct") ||
                                    attempts[index] >= 3
                                  }
                                  aria-label={`Input ${idx + 1} of ${
                                    card.word?.length || 0
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="w-full mt-4 flex flex-col gap-4">
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
                                          ? "text-white w-full bg-green-500 p-2 rounded-lg"
                                          : "text-purple-900 w-full bg-pink-300 p-2 rounded-lg"
                                      }
                                    >
                                      {/* <motion.div
                                      key={feedback[index]}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 20 }}
                                      className={
                                        feedback[index].includes("Correct")
                                          ? "text-green-600 w-full border-4 border-green-300 bg-white p-2 rounded-lg"
                                          : "text-red-600 w-full border-4 border-red-300 bg-white p-2 rounded-lg"
                                      }
                                      style={{
                                        filter:
                                          "drop-shadow(4px 4px 0px #ef4444",
                                      }}
                                    > */}
                                      {feedback[index]}
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <div className="flex gap-6">
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-full"
                                >
                                  <Button
                                    radius="sm"
                                    size="lg"
                                    onClick={() => checkAnswer(index)}
                                    isDisabled={
                                      feedback[index]?.includes("Correct") ||
                                      attempts[index] >= 3 ||
                                      userAnswers[index]?.length !==
                                        card.word?.length
                                    }
                                    className="w-full h-16 justify-center text-purple-700 text-lg bg-white border-4 border-purple-300"
                                    // className="w-full h-16 justify-center text-white text-lg bg-gradient-to-b from-purple-500 to-purple-600"
                                    aria-label="Check Answer"
                                    style={{
                                      filter: "drop-shadow(4px 4px 0px #7828C8",
                                    }}
                                    // style={{
                                    //   filter: "drop-shadow(3px 3px 1px #9ca3af",
                                    // }}
                                  >
                                    Check Answer
                                  </Button>
                                </motion.div>{" "}
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="w-full"
                                >
                                  <Button
                                    radius="sm"
                                    size="lg"
                                    onClick={() => useHint(index)}
                                    isDisabled={
                                      feedback[index]?.includes("Correct") ||
                                      attempts[index] >= 3 ||
                                      hintsUsed >= 3
                                    }
                                    className="w-full h-16 justify-center text-blue-700 text-lg bg-white border-4 border-blue-300"
                                    // className="w-full h-16 justify-center text-white text-lg bg-gradient-to-b from-blue-500 to-blue-600"
                                    aria-label="Use Hint"
                                    style={{
                                      filter: "drop-shadow(4px 4px 0px #3b82f6",
                                    }}
                                    // style={{
                                    //   filter: "drop-shadow(3px 3px 1px #9ca3af",
                                    // }}
                                  >
                                    Use Hint ({3 - hintsUsed} left)
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </form>
                        </div>
                      </CardFooter>
                      <AnimatePresence>
                        {showEmoji && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0, rotate: -45 }}
                            animate={{
                              scale: [1.5, 1.8, 1.2, 1],
                              opacity: 1,
                              rotate: [0, 10, -10, 0],
                            }}
                            exit={{ scale: 0, opacity: 0, rotate: 45 }}
                            transition={{
                              duration: 1.2,
                              ease: [0.36, 1.2, 0.5, 1],
                            }}
                            className="absolute top-[40%] left-[39%] transform -translate-x-1/2 -translate-y-1/2 text-9xl"
                          >
                            😄
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </>
      )}
    </div>
  );
};

export default FourPicsOneWordStudent;
