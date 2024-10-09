import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Progress } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { Input } from "@nextui-org/react";
import { AlertTriangle } from "lucide-react";

const FourPicsOneWordStudent = ({ cards }) => {
  const { data: session } = useSession();
  const route = useRouter();
  const game_id = route.query.game_id;
  const [userAnswers, setUserAnswers] = useState(Array(cards.length).fill(""));
  const [feedback, setFeedback] = useState(Array(cards.length).fill(""));
  const [shuffledCards, setShuffledCards] = useState([]);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [answer, setAnswer] = useState(0);
  const [playedGames, setPlayedGames] = useState(1); // times played

  useEffect(() => {
    setUserAnswers(Array(cards.length).fill(""));
    setFeedback(Array(cards.length).fill(""));
    setShuffledCards(shuffleArray(cards));
    getStudentTries();
  }, [cards]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleChange = (value, index) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const checkAnswer = (index) => {
    const userAnswer = userAnswers[index];
    const correctWord = shuffledCards[index].word;
    console.log(userAnswer.length);
    if (userAnswer.toLowerCase() === correctWord.toLowerCase()) {
      const newFeedback = [...feedback];
      newFeedback[index] = "Correct!";
      alert("Correct!");
      setFeedback(newFeedback);
      setScore(score + 1);
      setAnswer(answer + 1);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else {
      const newFeedback = [...feedback];
      newFeedback[index] = "Incorrect. Try again!";
      alert("Incorrect!");
      setAnswer(answer + 1);
      setFeedback(newFeedback);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    }
    if (answer + 1 === cards.length) {
      endGame();
    }
  };

  const endGame = async () => {
    await handleResult();
    alert("You have completed the game!");
  };
  useEffect(() => {
    if (session) {
      console.log(session);
    }
  }, [session]);

  const getStudentTries = async () => {
    const account_id = session?.user?.id;
    try {
      const response = await fetch(
        `/api/student_game_record/student_game_record?account_id=${account_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
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
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      {playedGames === 2 ? (
        <>
          <h1>Attempts reached come back next month</h1>
          <Button onClick={() => route.back()}>Go Back</Button>
        </>
      ) : (
        <>
          <h1>
            Score: {score} / {cards.length}
          </h1>
          <h1>Question Answered: {answer}</h1>
          <div className="flex justify-center items-center w-1/2 m-auto my-4">
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
            {/* <span className="ml-2">
              {((answer / cards.length) * 100).toFixed(2)}%
            </span> */}
          </div>
          <Swiper
            modules={[Navigation, Pagination, Scrollbar, A11y]}
            navigation
            // pagination={{ clickable: true }}
            // scrollbar={{ draggable: true }}
            spaceBetween={50}
            slidesPerView={1}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            // onSlideChange={(swiper) => {
            //   if (swiper.isEnd) {
            //     endGame();
            //   }
            // }}
          >
            {shuffledCards.map((card, index) => (
              <SwiperSlide key={index}>
                <div className="m-auto h-screen">
                  <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
                    <CardBody className="flex flex-col gap-4">
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
                              <img
                                key={idx}
                                src={`${image}`}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square"
                              />
                            )
                        )}
                      </div>
                      <div className="flex justify-center flex-col gap-2 items-center">
                        <h1>Answer:</h1>
                        <InputOTP
                          maxLength={card.word.length}
                          value={card.word}
                          pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                          disabled={true}
                        >
                          <InputOTPGroup>
                            {Array.from({ length: card.word.length }).map(
                              (_, idx) => (
                                <React.Fragment key={idx}>
                                  <InputOTPSlot
                                    index={idx}
                                    className="text-2xl w-10 h-10 font-bold border border-purple-300"
                                  />
                                </React.Fragment>
                              )
                            )}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <h1>Your Answer:</h1>
                        <Input
                          value={userAnswers[index]}
                          onChange={(e) => handleChange(e.target.value, index)}
                          disabled={feedback[index] !== ""}
                          label="Enter your answer here"
                        />
                        <InputOTP
                          pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                          maxLength={card.word.length}
                          value={userAnswers[index]}
                          onChange={(value) => handleChange(value, index)}
                          disabled={feedback[index] !== ""}
                        >
                          <InputOTPGroup>
                            {Array.from({ length: card.word.length }).map(
                              (_, idx) => (
                                <React.Fragment key={idx}>
                                  <InputOTPSlot
                                    index={idx}
                                    className="text-2xl w-10 h-10 font-bold border border-purple-300"
                                  />
                                </React.Fragment>
                              )
                            )}
                          </InputOTPGroup>
                        </InputOTP>
                        <Button
                          color="secondary"
                          onClick={() => checkAnswer(index)}
                          disabled={feedback[index] !== ""}
                        >
                          Check Answer
                        </Button>
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
                </div>
              </SwiperSlide>
            ))}
            {/* <SwiperSlide>
              <h1>You have completed the game!</h1>
            </SwiperSlide> */}
          </Swiper>
        </>
      )}
    </div>
  );
};

export default FourPicsOneWordStudent;
