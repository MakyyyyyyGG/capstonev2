import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Image, Progress } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";
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
  const [playedGames, setPlayedGames] = useState(1); // times played
  const [attempts, setAttempts] = useState(Array(cards.length).fill(0)); // New state for attempts
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  useEffect(() => {
    setShuffledCards(shuffleArray(cards));
    setFeedback(Array(cards.length).fill(""));
    setAttempts(Array(cards.length).fill(0)); // Reset attempts when cards change
    getStudentTries();
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

    // Get available voices
    let voices = synth.getVoices();

    // Ensure voices are loaded, this may run before voices are loaded, so handle this event
    if (!voices.length) {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices();
        setVoiceAndSpeak(voices[1]); // Set default voice
      };
    } else {
      setVoiceAndSpeak(voices[1]); // Set default voice
    }

    function setVoiceAndSpeak(selectedVoice) {
      // Choose a different voice if needed (e.g., second voice in the list)
      utterance.voice = selectedVoice; // Select your desired voice
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageClick = (idx, cardIndex) => {
    if (attempts[cardIndex] >= 3) return; // If 3 attempts are used, do nothing

    const newAttempts = [...attempts];
    newAttempts[cardIndex]++;
    setAttempts(newAttempts);

    const correctAnswer = shuffledCards[cardIndex].correct_answer;
    const newFeedback = [...feedback];
    if (correctAnswer == idx) {
      setScore((prevScore) => prevScore + 1);
      newFeedback[cardIndex] = "Correct!";
      setAnswer((prevAnswer) => prevAnswer + 1);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else {
      if (newAttempts[cardIndex] >= 3) {
        newFeedback[cardIndex] = "Out of attempts. Moving to next question.";
        setAnswer((prevAnswer) => prevAnswer + 1);
        if (swiperInstance) {
          swiperInstance.slideNext();
        }
      } else {
        newFeedback[cardIndex] = `Incorrect. ${
          3 - newAttempts[cardIndex]
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
            <BarChart gameRecord={gameRecord} questions={cards.length} />
          )}
        </>
      ) : (
        <>
          <h1>Score: {score}</h1>
          <h1>Attempts used this month: {attemptsUsed} / 8</h1>
          <GameHistory gameRecord={gameRecord} cards={cards.length} />
          {attemptsUsed >= 8 && (
            <div className="w-1/2 bg-red-400 rounded-md p-4">
              <p className="text-white">
                You have used all your attempts for this month. Your score wont
                be recorded. Wait for next month.
              </p>
            </div>
          )}
          <div className="w-1/2 m-auto my-4">
            <Progress
              value={(answer / cards.length) * 100}
              classNames={{
                // label: "tracking-wider",
                value: "text-foreground/60",
              }}
              label="Progress"
              showValueLabel={true}
              color="success"
            />
          </div>
          <h1 className="text-2xl font-bold text-center my-4">
            Choose the correct image
          </h1>
          <Swiper
            modules={[Navigation, Pagination, Scrollbar, A11y]}
            navigation
            spaceBetween={50}
            slidesPerView={1}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            onSlideChange={() => console.log("slide change")}
          >
            {shuffledCards.map((card, index) => (
              <SwiperSlide key={index}>
                <div className="m-auto h-screen">
                  <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
                    <CardBody className="flex flex-col gap-4">
                      <div className="flex justify-center flex-col gap-2 items-center">
                        <h1>Word:</h1>
                        <p>Attempts left: {3 - (attempts[index] || 0)}</p>

                        <h1>{card.word}</h1>

                        {card.word && (
                          <Button
                            className="mb-4"
                            color="secondary"
                            onPress={() => handleTextToSpeech(card.word)}
                          >
                            <Volume2 />
                          </Button>
                        )}
                      </div>
                      <div
                        className={`grid ${
                          [
                            card.image1,
                            card.image2,
                            card.image3,
                            card.image4,
                          ].filter((image) => image !== null).length === 4
                            ? "grid-cols-2 grid-rows-2"
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
                              <div
                                key={idx}
                                className="hover:cursor-pointer hover:border-2 hover:border-purple-300 rounded-md"
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
                                      ? handleImageClick(idx, index)
                                      : null
                                  }
                                  src={`${image}`}
                                  alt={`Image ${idx + 1}`}
                                  className={`w-full h-full object-cover ${
                                    attempts[index] >= 3 ||
                                    feedback[index]?.includes("Correct")
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                />
                              </div>
                            )
                        )}
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
                    </CardBody>
                  </Card>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </>
      )}
    </div>
  );
};

export default FourPicsOneWordAdvancedStudent;
