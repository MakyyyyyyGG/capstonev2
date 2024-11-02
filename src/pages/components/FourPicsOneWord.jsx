import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const inputRefs = useRef([]);

  useEffect(() => {
    setUserAnswers(Array(cards.length).fill(""));
    setFeedback(Array(cards.length).fill(""));
    console.log(cards);
  }, [cards]);

  // Function to handle change of each input
  const handleChange = (value, cardIndex, slotIndex) => {
    const newAnswers = [...userAnswers];
    const wordArray = newAnswers[cardIndex]
      ? newAnswers[cardIndex].split("")
      : [];
    wordArray[slotIndex] = value;
    newAnswers[cardIndex] = wordArray.join("");
    setUserAnswers(newAnswers);

    // Focus on the next input
    if (value && slotIndex < cards[cardIndex].word.length - 1) {
      inputRefs.current[cardIndex][slotIndex + 1].focus();
    }
  };

  // Function to handle key navigation
  const handleKeyDown = (e, cardIndex, slotIndex) => {
    if (e.key === "Backspace" && !e.target.value && slotIndex > 0) {
      inputRefs.current[cardIndex][slotIndex - 1].focus();
    }
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
      <div className="flex mb-5 justify-between items-center text-2xl font-extrabold">
        <h1>ThinkPic</h1>
        {cards.length > 0 && (
          <div className="text-lg font-bold ">
            <Chip
              color={getChipColor(cards[0].difficulty)}
              radius="sm"
              className="rounded-md px-1 py-1 capitalize"
            >
              {cards[0].difficulty}
            </Chip>
          </div>
        )}
      </div>

      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl">
        <Swiper
          // pagination={{
          //   type: "progressbar",
          // }}
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
        >
          {cards.map((card, index) => (
            <SwiperSlide key={index}>
              <Card className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
                <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
                  <div
                    className={`grid ${
                      card.difficulty === "easy" ? "grid-cols-2" : "grid-cols-4"
                    } gap-2`}
                  >
                    {card.image1 && (
                      <img
                        src={`${card.image1}`}
                        className="max-w-50 h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                    {card.image2 && (
                      <img
                        src={`${card.image2}`}
                        className="max-w-50 h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                    {card.difficulty !== "easy" && card.image3 && (
                      <img
                        src={`${card.image3}`}
                        className="max-w-50 h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                    {card.difficulty !== "easy" && card.image4 && (
                      <img
                        src={`${card.image4}`}
                        className="max-w-50 h-auto border-2 border-[#7469B6] rounded-md aspect-square"
                      />
                    )}
                  </div>
                </CardBody>
                <div className="flex justify-center flex-col gap-2 items-center">
                  <div className="flex justify-center flex-col gap-2 items-center">
                    <header>
                      <h1 className="text-xl font-bold mb-1">Answer</h1>
                    </header>
                    {/* <div className="flex items-center justify-center gap-3">
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
                    </div> */}
                    <form id="otp-form">
                      <div className="flex items-center justify-center gap-3">
                        <InputOTP
                          maxLength={card.word.length}
                          value={card.word}
                          pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                        >
                          <InputOTPGroup className="space-x-3">
                            {Array.from({ length: card.word.length }).map(
                              (_, idx) => (
                                <React.Fragment key={idx}>
                                  <InputOTPSlot
                                    index={idx}
                                    className="w-12 h-12 text-center text-xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                                  />
                                </React.Fragment>
                              )
                            )}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </form>
                  </div>
                  <CardFooter className="flex flex-col items-center text-center gap-2">
                    <header className="mb-4">
                      <h1 className="text-xl font-bold mb-1">
                        Enter Your Answer
                      </h1>
                      <p className="text-xs text-slate-500">
                        Enter the answer based on the images above.
                      </p>
                    </header>
                    <form id="otp-form">
                      <div className="flex items-center justify-center gap-3">
                        {Array.from({ length: card.word.length }).map(
                          (_, slotIndex) => (
                            <input
                              key={slotIndex}
                              ref={(el) => {
                                if (!inputRefs.current[index]) {
                                  inputRefs.current[index] = [];
                                }
                                inputRefs.current[index][slotIndex] = el;
                              }}
                              className="w-12 h-12 text-center text-xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                              maxLength="1"
                              value={userAnswers[index]?.[slotIndex] || ""}
                              onChange={(e) =>
                                handleChange(e.target.value, index, slotIndex)
                              }
                              onKeyDown={(e) =>
                                handleKeyDown(e, index, slotIndex)
                              }
                            />
                          )
                        )}
                      </div>
                    </form>
                    {/* <InputOTP
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                      maxLength={card.word.length}
                      value={userAnswers[index]}
                      onChange={(value) => handleChange(value, index)}
                    >
                      <InputOTPGroup className="w-full">
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
                    </InputOTP> */}
                    <div className="w-full mt-4">
                      <Button
                        className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-[#7469B6] px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 transition-colors duration-150"
                        onClick={() => checkAnswer(index)}
                      >
                        Check Answer
                      </Button>
                    </div>
                    <AnimatePresence>
                      {feedback[index] && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="flex w-full text-center justify-center rounded-md mt-2"
                        >
                          <p
                            className={
                              feedback[index].includes("Correct")
                                ? "text-white w-full bg-green-500 p-2 rounded-md"
                                : "text-white w-full bg-red-500 p-2 rounded-md"
                            }
                          >
                            {feedback[index]}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardFooter>
                </div>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FourPicsOneWord;
