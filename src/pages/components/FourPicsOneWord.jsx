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
import Loader from "./Loader";

const FourPicsOneWord = ({ cards = [] }) => {
  // Add default empty array
  const [userAnswers, setUserAnswers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const inputRefs = useRef([]);
  const imageLoadingPromises = useRef([]);

  useEffect(() => {
    if (cards && cards.length > 0) {
      // Reset image loading state when cards change
      setImagesLoaded(false);
      imageLoadingPromises.current = [];

      // Create promises for each image load
      const promises = cards.flatMap((card) => {
        const images = [
          card.image1,
          card.image2,
          card.image3,
          card.image4,
        ].filter(Boolean);
        return images.map((image) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = image;
            img.onload = resolve;
            img.onerror = reject;
          });
        });
      });

      imageLoadingPromises.current = promises;

      // Wait for all images to load
      Promise.all(promises)
        .then(() => setImagesLoaded(true))
        .catch((err) => {
          console.error("Error loading images:", err);
          setImagesLoaded(true); // Set to true even on error to prevent infinite loading
        });

      setUserAnswers(Array(cards.length).fill(""));
      setFeedback(Array(cards.length).fill(""));
      console.log(cards);
    }
  }, [cards]);

  // Function to handle change of each input
  const handleChange = (value, cardIndex, slotIndex) => {
    if (!cards || !cards[cardIndex]) return; // Add null check

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
    if (!cards || !cards[index]) return; // Add null check

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
    switch (
      difficulty?.toLowerCase() // Add optional chaining
    ) {
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

  if (!imagesLoaded) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
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
          style={{
            filter: "drop-shadow(4px 4px 0px #7828C8",
          }}
        >
          {cards &&
            cards.map(
              (
                card,
                index // Add null check
              ) => (
                <SwiperSlide key={index}>
                  <Card className="w-full flex flex-col gap-2 max-w-[50rem] mx-auto border-4 border-purple-300 rounded-md p-4">
                    <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
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
                        } gap-4 justify-center`}
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
                    <div className="flex justify-center flex-col gap-2 items-center">
                      <div className="flex justify-center flex-col gap-2 items-center">
                        <header>
                          <h1 className="text-xl font-bold text-purple-700 mb-1">
                            Answer
                          </h1>
                        </header>
                        <form id="otp-form">
                          <div className="flex items-center justify-center gap-3">
                            <InputOTP
                              maxLength={card.word?.length || 0} // Add optional chaining
                              value={card.word}
                              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                            >
                              <InputOTPGroup className="px-3 flex-wrap gap-3 items-center justify-center">
                                {card.word &&
                                  Array.from({ length: card.word.length }).map(
                                    // Add null check
                                    (_, idx) => (
                                      <React.Fragment key={idx}>
                                        <InputOTPSlot
                                          index={idx}
                                          className="w-12 h-12 text-center text-purple-700 text-xl font-bold rounded-lg border-4 border-purple-300 uppercase bg-white"
                                          style={{
                                            filter:
                                              "drop-shadow(4px 4px 0px #7828C8)",
                                          }}
                                          maxLength="1"
                                          value={
                                            userAnswers[index]?.[idx] || ""
                                          }
                                          onChange={(e) => {
                                            const newAnswer = userAnswers[index]
                                              ? userAnswers[index].split("")
                                              : [];
                                            newAnswer[idx] = e.target.value;
                                            handleChange(
                                              newAnswer.join(""),
                                              index
                                            );
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
                        <header>
                          <h1 className="text-xl font-bold text-purple-700 mb-1">
                            Enter Your Answer!
                          </h1>
                        </header>
                        <form id="otp-form">
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            {card.word &&
                              Array.from({ length: card.word.length }).map(
                                // Add null check
                                (_, slotIndex) => (
                                  <input
                                    key={slotIndex}
                                    ref={(el) => {
                                      if (!inputRefs.current[index]) {
                                        inputRefs.current[index] = [];
                                      }
                                      inputRefs.current[index][slotIndex] = el;
                                    }}
                                    className="w-12 h-12 text-center text-xl text-purple-700 font-bold rounded-lg border-4 border-purple-300 uppercase bg-white"
                                    style={{
                                      filter:
                                        "drop-shadow(4px 4px 0px #7828C8)",
                                    }}
                                    maxLength="1"
                                    value={
                                      userAnswers[index]?.[slotIndex] || ""
                                    }
                                    onChange={(e) =>
                                      handleChange(
                                        e.target.value,
                                        index,
                                        slotIndex
                                      )
                                    }
                                    onKeyDown={(e) =>
                                      handleKeyDown(e, index, slotIndex)
                                    }
                                  />
                                )
                              )}
                          </div>
                        </form>
                        <div className="w-full mt-4 flex flex-col gap-2">
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
                                  {feedback[index]}
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <Button
                            radius="sm"
                            size="lg"
                            color="secondary"
                            className="w-full h-16 justify-center text-purple-700 text-lg bg-white border-4 border-purple-300"
                            style={{
                              filter: "drop-shadow(4px 4px 0px #7828C8",
                            }}
                            onClick={() => checkAnswer(index)}
                          >
                            Check Answer
                          </Button>
                        </div>
                      </CardFooter>
                    </div>
                  </Card>
                </SwiperSlide>
              )
            )}
        </Swiper>
      </div>
    </div>
  );
};

export default FourPicsOneWord;
