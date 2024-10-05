import React, { useState, useEffect } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const FourPicsOneWord = ({ cards }) => {
  const [userAnswers, setUserAnswers] = useState(Array(cards.length).fill(""));
  const [feedback, setFeedback] = useState(Array(cards.length).fill(""));

  useEffect(() => {
    setUserAnswers(Array(cards.length).fill(""));
    setFeedback(Array(cards.length).fill(""));
    console.log(cards);
  }, [cards]);

  const handleChange = (value, index) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const checkAnswer = (index) => {
    const userAnswer = userAnswers[index];
    const correctWord = cards[index].word;

    if (userAnswer.toLowerCase() === correctWord.toLowerCase()) {
      const newFeedback = [...feedback];
      newFeedback[index] = "Correct!";
      setFeedback(newFeedback);
    } else {
      const newFeedback = [...feedback];
      newFeedback[index] = "Incorrect. Try again!";
      setFeedback(newFeedback);
    }
  };

  return (
    <div>
      <h1>4 Pics 1 Word Game</h1>
      {cards.length > 0 && <h1>difficulty {cards[0].difficulty}</h1>}
      <div className="flex flex-wrap gap-4">
        {cards.map((card, index) => (
          <div key={index} className="w-[500px]">
            <Card className="w-full">
              <CardBody className="flex flex-col gap-4">
                <div
                  className={`grid ${
                    card.difficulty === "easy" ? "grid-cols-2" : "grid-cols-3"
                  } gap-2`}
                >
                  {card.image1 && (
                    <img
                      src={`${card.image1}`}
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square"
                    />
                  )}
                  {card.image2 && (
                    <img
                      src={`${card.image2}`}
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square"
                    />
                  )}
                  {card.difficulty !== "easy" && card.image3 && (
                    <img
                      src={`${card.image3}`}
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square"
                    />
                  )}
                  {card.difficulty !== "easy" && card.image4 && (
                    <img
                      src={`${card.image4}`}
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square"
                    />
                  )}
                </div>
                <div className="flex justify-center flex-col gap-2 items-center">
                  <h1>Answer:</h1>
                  <InputOTP
                    maxLength={card.word.length}
                    value={card.word}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
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
                  <InputOTP
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    maxLength={card.word.length}
                    value={userAnswers[index]}
                    onChange={(value) => handleChange(value, index)}
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
                  <Button onClick={() => checkAnswer(index)}>
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
        ))}
      </div>
    </div>
  );
};

export default FourPicsOneWord;
