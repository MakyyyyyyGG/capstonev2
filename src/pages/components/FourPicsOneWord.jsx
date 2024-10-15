import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Chip, Button } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";

// import required modules
import { Pagination, Navigation } from "swiper/modules";
import { EffectCreative } from "swiper/modules";

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

  // Function to dynamically set Chip color based on room difficulty
  const getChipColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "success";
      case "moderate":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>ThinkPic</h1>
        {cards.length > 0 && (
          <div className="text-lg font-bold ">
            Difficulty:
            <Chip
              color={getChipColor(cards[0].difficulty)}
              radius="sm"
              className="text-base text-white py-4 capitalize ml-2"
            >
              {cards[0].difficulty}
            </Chip>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <Swiper
          pagination={{
            type: "progressbar",
          }}
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
          navigation={true}
          modules={[Pagination, Navigation, EffectCreative]}
          className="mySwiper w-full drop-shadow-lg rounded-md items"
        >
          {cards.map((card, index) => (
            <SwiperSlide key={index} className="w-[500px]">
              <Card className="w-full">
                <CardBody className="flex flex-col gap-4 px-28 pt-14 items-center justify-center">
                  {feedback[index] && (
                    <div className="absolute flex justify-center flex-col gap-2 items-center top-0 p-4">
                      <p
                        className={
                          feedback[index].includes("Correct")
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {feedback[index]}
                      </p>
                    </div>
                  )}
                  <div
                    className={`grid ${
                      card.difficulty === "easy" ? "grid-cols-2" : "grid-cols-2"
                    } gap-2`}
                  >
                    {card.image1 && (
                      <img
                        src={`${card.image1}`}
                        className="w-full h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                    {card.image2 && (
                      <img
                        src={`${card.image2}`}
                        className="w-full h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                    {card.difficulty !== "easy" && card.image3 && (
                      <img
                        src={`${card.image3}`}
                        className="w-full h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                    {card.difficulty !== "easy" && card.image4 && (
                      <img
                        src={`${card.image4}`}
                        className="w-full h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                  </div>
                </CardBody>
                <CardFooter className="flex justify-center flex-col pb-6 gap-2 items-center">
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
                                className="text-2xl w-10 h-10 font-bold border border-[#7469B6]"
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
                                className="text-2xl w-10 h-10 font-bold border border-[#7469B6]"
                              />
                            </React.Fragment>
                          )
                        )}
                      </InputOTPGroup>
                    </InputOTP>
                    <Button
                      className="bg-[#7469B6] text-white border-0"
                      onClick={() => checkAnswer(index)}
                    >
                      Check Answer
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FourPicsOneWord;
