import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Progress, Input } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import "swiper/swiper-bundle.css";

const FourPicsOneWordStudent = ({ cards }) => {
  const [shuffledCards, setShuffledCards] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;

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
      } else if (response.status === 403) {
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
      <h1>
        Score: {score} / {cards.length}
      </h1>
      <h1>Remaining Attemps for this month: {10 - attempts}</h1>
      <h1>Questions Answered: {answeredQuestions}</h1>
      <h1>cards length: {cards.length}</h1>
      <div className="flex justify-center items-center w-1/2 m-auto my-4">
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
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        navigation
        spaceBetween={50}
        slidesPerView={1}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
      >
        {shuffledCards.map((card, index) => (
          <SwiperSlide key={index}>
            <div className="m-auto h-screen">
              <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
                <CardBody className="flex flex-col gap-4">
                  <p>Attempts left: {3 - (attempts[index] || 0)}</p>

                  <div className={`grid grid-cols-2 grid-rows-2 gap-2`}>
                    {[card.image1, card.image2, card.image3, card.image4].map(
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
                  <div className="flex flex-col items-center gap-2">
                    <h1>Question: {card.question}</h1>
                    <Input
                      value={userAnswers[index] || ""}
                      onChange={(e) => handleChange(e.target.value, index)}
                      disabled={
                        feedback[index]?.includes("Correct") ||
                        attempts[index] >= 3
                      }
                      label="Enter your answer here"
                    />
                    <Button
                      color="secondary"
                      onClick={() => checkAnswer(index)}
                      disabled={
                        feedback[index]?.includes("Correct") ||
                        attempts[index] >= 3
                      }
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
      </Swiper>
      {isGameFinished && (
        <div className="m-auto h-screen">
          <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
            <CardBody className="flex flex-col gap-4">
              <h1>Game Over!</h1>
              <h1>Your score is: {score}</h1>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FourPicsOneWordStudent;
