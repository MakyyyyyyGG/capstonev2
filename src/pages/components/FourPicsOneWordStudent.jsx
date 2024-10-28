import React, { useState, useEffect, useRef } from "react";
import { Card, CardBody, Button, Progress, Input } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import Summary from "./Summary";
import "swiper/swiper-bundle.css";
import BarChart from "./BarChart";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import GameHistory from "./GameHistory";

const FourPicsOneWordStudent = ({ cards }) => {
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

  useEffect(() => {
    if (cards) {
      console.log(session);
      const shuffled = shuffleArray(cards);
      setShuffledCards(shuffled);
      setUserAnswers(Array(shuffled.length).fill(""));
      setAttempts(Array(shuffled.length).fill(0));
      setFeedback(Array(shuffled.length).fill(""));
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
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else if (newAttempts[index] >= 3) {
      newFeedback[index] =
        "Out of attempts. The correct answer was: " + correctAnswer;
      setAnsweredQuestions((prevAnswered) => prevAnswered + 1);

      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else {
      newFeedback[index] = `Incorrect. ${
        3 - newAttempts[index]
      } attempts left.`;
    }
    setFeedback(newFeedback);

    // Check if all cards have been answered
    const allAnswered = newFeedback.every(
      (fb) => fb.includes("Correct") || fb.includes("Out of attempts")
    );
    if (allAnswered) {
      setIsGameFinished(true);
    }
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
        alert("Game Recorded Successfully");
        await getStudentTries();
      } else if (response.status === 403) {
        alert(result.message); // Show the limit message
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

  return (
    <div>
      {isGameFinished ? (
        <>
          {gameRecord.length > 0 && (
            // <BarChart gameRecord={gameRecord} questions={cards.length} />
            <Summary gameRecord={gameRecord} questions={cards.length} />
          )}
        </>
      ) : (
        <>
          <div className="relative">
            <div className="absolute top-0 left-0">
              <h1>
                Score: {score} / {cards.length}
              </h1>
              <h1>Attempts used this month: {attemptsUsed} / 8</h1>
              <GameHistory gameRecord={gameRecord} cards={cards.length} />
              {attemptsUsed >= 8 && (
                <div className="w-1/2 bg-red-400 rounded-md p-4">
                  <p className="text-white">
                    You have used all your attempts for this month. Your score
                    wont be recorded. Wait for next month.
                  </p>
                </div>
              )}
              <h1>Questions Answered: {answeredQuestions}</h1>
              <h1>cards length: {cards.length}</h1>
            </div>
          </div>

          <div className="flex justify-center items-center max-w-[50rem] m-auto my-4">
            <Progress
              value={(answeredQuestions / cards.length) * 100}
              classNames={{
                value: "text-foreground/60",
              }}
              label="Progress"
              showValueLabel={true}
              color="success"
            />
          </div>
          <div>
            <Swiper
              modules={[Navigation, Pagination, Scrollbar, A11y]}
              navigation
              spaceBetween={50}
              slidesPerView={1}
              onSwiper={(swiper) => setSwiperInstance(swiper)}
            >
              {shuffledCards.map((card, index) => (
                <SwiperSlide key={index}>
                  <Card className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
                    <CardBody className="flex flex-col gap-4 px-28 pt-7 items-center justify-center">
                      <p>Attempts left: {3 - (attempts[index] || 0)}</p>

                      <div className={`grid grid-cols-2 grid-rows-2 gap-2`}>
                        {[
                          card.image1 || "",
                          card.image2 || "",
                          card.image3 || "",
                          card.image4 || "",
                        ].map(
                          (image, idx) =>
                            image && (
                              <img
                                key={idx}
                                src={`${image}`}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                              />
                            )
                        )}
                      </div>
                      <div className="w-full flex flex-col items-center gap-2 rounded-xl shadow">
                        {/* <h1>Question: {card.question}</h1> */}

                        <div className="max-w-md mx-auto text-center bg-white px-4 sm:px-8 py-10">
                          <header className="mb-8">
                            <h1 className="text-2xl font-bold mb-1">
                              Enter Your Answer
                            </h1>
                            <p className="text-[15px] text-slate-500">
                              Enter the answer based on the images above.
                            </p>
                          </header>
                          <form id="otp-form">
                            <div className="flex items-center justify-center gap-3">
                              {Array.from({ length: card.word.length }).map(
                                (_, idx) => (
                                  <input
                                    key={idx}
                                    type="text"
                                    className="w-14 h-14 text-center text-2xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                                  />
                                )
                              )}
                            </div>
                            <div className="max-w-[260px] mx-auto mt-4">
                              <Button
                                color="secondary"
                                onClick={() => checkAnswer(index)}
                                isDisabled={
                                  feedback[index]?.includes("Correct") ||
                                  attempts[index] >= 3 ||
                                  userAnswers[index]?.length !==
                                    card.word.length
                                }
                                className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 transition-colors duration-150"
                              >
                                Check Answer
                              </Button>
                            </div>
                          </form>
                        </div>

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
