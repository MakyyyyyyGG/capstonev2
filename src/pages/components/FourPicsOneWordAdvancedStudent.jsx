import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Button,
  Image,
  Progress,
  Checkbox,
} from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  EffectCreative,
} from "swiper/modules";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";
import "swiper/css/effect-creative";
import Summary from "./Summary";
import BarChart from "./BarChart";
import GameHistory from "./GameHistory";

const FourPicsOneWordAdvancedStudent = ({ cards }) => {
  const [shuffledCards, setShuffledCards] = useState([]);
  const [feedback, setFeedback] = useState(Array(cards.length).fill(""));
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const [playedGames, setPlayedGames] = useState(1);
  const [attempts, setAttempts] = useState(Array(cards.length).fill(0));
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [selectedImages, setSelectedImages] = useState(
    Array(cards.length).fill([])
  );

  useEffect(() => {
    setShuffledCards(shuffleArray(cards));
    setFeedback(Array(cards.length).fill(""));
    setAttempts(Array(cards.length).fill(0));
    setSelectedImages(Array(cards.length).fill([]));
    getStudentTries();
    console.log(cards);
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

  const handleTextToSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const synth = window.speechSynthesis;

    let voices = synth.getVoices();

    if (!voices.length) {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices();
        setVoiceAndSpeak(voices[1]);
      };
    } else {
      setVoiceAndSpeak(voices[1]);
    }

    function setVoiceAndSpeak(selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageSelect = (idx, cardIndex) => {
    const newSelectedImages = [...selectedImages];
    if (newSelectedImages[cardIndex].includes(idx)) {
      newSelectedImages[cardIndex] = newSelectedImages[cardIndex].filter(
        (imageIdx) => imageIdx !== idx
      );
    } else {
      newSelectedImages[cardIndex] = [...newSelectedImages[cardIndex], idx];
    }
    setSelectedImages(newSelectedImages);

    const correctAnswers = shuffledCards[cardIndex].correct_answer
      .split(",")
      .map(Number);
    if (correctAnswers.includes(idx)) {
      console.log(
        `Selected image index: ${idx} for card index: ${cardIndex} is correct`
      );
    } else {
      console.log(
        `Selected image index: ${idx} for card index: ${cardIndex} is incorrect`
      );
    }
  };

  const handleCheckAnswers = () => {
    const newFeedback = [...feedback];
    let newScore = score;
    let newAnswer = answer;
    let newAttempts = [...attempts];

    selectedImages.forEach((selectedIdxs, cardIndex) => {
      if (selectedIdxs.length > 0) {
        const correctAnswers = shuffledCards[cardIndex].correct_answer
          .split(",")
          .map(Number);
        const isCorrect =
          selectedIdxs.length === correctAnswers.length &&
          selectedIdxs.every((idx) => correctAnswers.includes(idx));

        newAttempts[cardIndex]++;

        if (isCorrect) {
          newScore++;
          newFeedback[cardIndex] = "Correct!";
          newAnswer++;
          if (swiperInstance) {
            swiperInstance.slideNext();
          }
        } else if (newAttempts[cardIndex] >= 3) {
          newFeedback[cardIndex] = "Incorrect. Moving to next question.";
          newAnswer++;
          if (swiperInstance) {
            swiperInstance.slideNext();
          }
        } else {
          newFeedback[cardIndex] = "Incorrect. Try again.";
        }
      }
    });

    setScore(newScore);
    setAnswer(newAnswer);
    setFeedback(newFeedback);
    setAttempts(newAttempts);

    const allAnswered = newAnswer === cards.length;
    if (allAnswered) {
      setIsGameFinished(true);
    }

    setSelectedImages(Array(cards.length).fill([]));
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
    const attemptsByMonth = {};

    data.forEach((attempt) => {
      const date = new Date(attempt.created_at);
      const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!attemptsByMonth[yearMonth]) {
        attemptsByMonth[yearMonth] = [];
      }
      attemptsByMonth[yearMonth].push(attempt);
    });

    const latestAttempts = {};
    Object.keys(attemptsByMonth).forEach((month) => {
      const sortedAttempts = attemptsByMonth[month].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      latestAttempts[month] = sortedAttempts.slice(0, 8);
    });

    return latestAttempts;
  };

  const handleResult = async () => {
    console.log("game finished  ");
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
        alert(result.message);
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
    <div className="relative flex flex-col justify-center">
      {isGameFinished ? (
        <>
          {gameRecord.length > 0 && (
            <Summary gameRecord={gameRecord} questions={cards.length} />
          )}
        </>
      ) : (
        <>
          <div className="flex w-full justify-center items-center">
            <div className="flex w-full max-w-[50rem] items-center justify-between items-center pt-2">
              <div>
                <h1 className="text-2xl font-bold">ThinkPic+</h1>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-4">
                  <p className="text-sm text-muted-foreground">
                    Score: {score} / {cards.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Attempts this month: {attemptsUsed} / 8
                  </p>
                </div>
                <GameHistory gameRecord={gameRecord} cards={cards.length} />
                {attemptsUsed >= 8 && (
                  <div className="w-1/2 bg-red-400 rounded-md p-4">
                    <p className="text-white">
                      You have used all your attempts for this month. Your score
                      wont be recorded. Wait for next month.
                    </p>
                  </div>
                )}
                {/* <h1>Questions Answered: {answeredQuestions}</h1>
              <h1>cards length: {cards.length}</h1> */}
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center items-center ">
            <div className="w-full max-w-[50rem] my-4">
              <Progress
                value={(answer / cards.length) * 100}
                classNames={{
                  value: "text-foreground/60",
                  indicator: "bg-[#7469B6]",
                  track: "bg-purple-50",
                }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">
            Choose the correct image(s)
          </h1>
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
            >
              {shuffledCards.map((card, index) => (
                <SwiperSlide key={index}>
                  <Card className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
                    <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
                      {/* <p>Attempts left: {3 - (attempts[index] || 0)}</p> */}
                      <div className="flex justify-center items-center gap-2">
                        <div className="text-3xl font-extrabold my-5">
                          <h1>{card.word}</h1>
                        </div>
                        <div className="flex justify-center items-center">
                          {card.word && (
                            <Button
                              isIconOnly
                              className="text-[#7469B6]"
                              variant="light"
                              onPress={() => handleTextToSpeech(card.word)}
                            >
                              <Volume2 />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div
                        className={`grid ${
                          [
                            card.image1,
                            card.image2,
                            card.image3,
                            card.image4,
                          ].filter((image) => image !== null).length === 4
                            ? "grid-cols-4"
                            : [
                                card.image1,
                                card.image2,
                                card.image3,
                                card.image4,
                              ].filter((image) => image !== null).length === 3
                            ? "grid-cols-3"
                            : "grid-cols-2"
                        } gap-2`}
                      >
                        {[
                          card.image1,
                          card.image2,
                          card.image3,
                          card.image4,
                        ].map(
                          (image, idx) =>
                            image && (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative hover:cursor-pointer rounded-md ${
                                  selectedImages[index].includes(idx)
                                    ? "border-3 border-[#17C964]"
                                    : ""
                                }`}
                                style={{
                                  transition:
                                    "border-color 0.3s ease, transform 0.3s ease",
                                }}
                              >
                                <img
                                  aria-disabled={
                                    attempts[index] >= 3 ||
                                    feedback[index]?.includes("Correct")
                                  }
                                  radius="none"
                                  onClick={() =>
                                    attempts[index] < 3 &&
                                    !feedback[index]?.includes("Correct")
                                      ? handleImageSelect(idx, index)
                                      : null
                                  }
                                  src={`${image}`}
                                  alt={`Image ${idx + 1}`}
                                  className={`max-w-50 h-auto object-cover rounded-md ${
                                    attempts[index] >= 3 ||
                                    feedback[index]?.includes("Correct")
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                />
                                <Checkbox
                                  color="success"
                                  className="absolute top-2 right-1 text-white"
                                  isSelected={selectedImages[index].includes(
                                    idx
                                  )}
                                  onChange={() => handleImageSelect(idx, index)}
                                  isDisabled={
                                    attempts[index] >= 3 ||
                                    feedback[index]?.includes("Correct")
                                  }
                                />
                              </motion.div>
                            )
                        )}
                      </div>
                      <div className="w-full mt-8">
                        <Button
                          radius="sm"
                          onClick={handleCheckAnswers}
                          className="w-full justify-center text-white bg-[#7469B6]"
                        >
                          Check Answers
                        </Button>
                      </div>
                      {feedback[index] && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.1 }}
                          className="flex w-full justify-center rounded-md"
                        >
                          <div className="w-full text-center rounded-md">
                            <p
                              className={
                                feedback[index].includes("Correct")
                                  ? "text-white bg-green-500 p-2 rounded-md"
                                  : "text-white bg-red-500 p-2 rounded-md"
                              }
                            >
                              {feedback[index]}
                            </p>
                          </div>
                        </motion.div>
                      )}
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

export default FourPicsOneWordAdvancedStudent;
