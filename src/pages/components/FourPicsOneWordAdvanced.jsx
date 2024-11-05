import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, Button, Image, Checkbox } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
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

const FourPicsOneWordAdvanced = ({ cards = [] }) => {
  // Add default empty array
  const [selectedImages, setSelectedImages] = useState(
    Array(cards?.length || 0).fill([]) // Add null check and default to 0
  );
  const [feedback, setFeedback] = useState(Array(cards?.length || 0).fill("")); // Add null check and default to 0

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
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageSelect = (idx, cardIndex) => {
    const newSelectedImages = [...selectedImages];

    // Ensure the selectedImages array for the cardIndex is initialized
    if (!newSelectedImages[cardIndex]) {
      newSelectedImages[cardIndex] = [];
    }

    if (newSelectedImages[cardIndex].includes(idx)) {
      newSelectedImages[cardIndex] = newSelectedImages[cardIndex].filter(
        (imageIdx) => imageIdx !== idx
      );
    } else {
      newSelectedImages[cardIndex] = [...newSelectedImages[cardIndex], idx];
    }
    setSelectedImages(newSelectedImages);
  };

  const handleCheckAnswers = () => {
    const newFeedback = [...feedback];

    selectedImages.forEach((selectedIdxs, cardIndex) => {
      if (selectedIdxs.length > 0) {
        const correctAnswers = cards[cardIndex].correct_answer
          .split(",")
          .map(Number);
        const isCorrect =
          selectedIdxs.length === correctAnswers.length &&
          selectedIdxs.every((idx) => correctAnswers.includes(idx));

        if (isCorrect) {
          newFeedback[cardIndex] = "Correct!";
        } else {
          newFeedback[cardIndex] = "Incorrect. Try again.";
        }
      } else {
        newFeedback[cardIndex] = ""; // Reset feedback if no images are selected
      }
    });

    setFeedback(newFeedback);
  };

  if (!cards || !cards.length) {
    return <div>No cards available</div>; // Add loading/empty state
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      <div className="flex mb-5 justify-between items-center text-2xl font-extrabold">
        <div>
          <h1 className="text-2xl font-bold">ThinkPic+</h1>
        </div>
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
            <SwiperSlide key={index} className="w-[500px]">
              <Card className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
                <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
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
                      card.difficulty === "easy"
                        ? "grid-cols-2 justify-center"
                        : card.difficulty === "medium"
                        ? "grid-cols-3 max-sm:grid-cols-2 justify-center"
                        : "grid-cols-4 max-md:grid-cols-2 justify-center"
                    } gap-2`}
                  >
                    {card.image1 && (
                      <motion.div
                        key={0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative hover:cursor-pointer rounded-md ${
                          selectedImages[index] &&
                          selectedImages[index].includes(0)
                            ? "border-3 border-[#17C964]"
                            : "border-3 border-transparent"
                        }`}
                        style={{
                          transition:
                            "border-color 0.3s ease, transform 0.3s ease",
                        }}
                        onClick={() => handleImageSelect(0, index)}
                      >
                        <img
                          src={`${card.image1}`}
                          alt="Image 1"
                          className="w-44 h-44 rounded-md aspect-square"
                        />
                        <Checkbox
                          color="success"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(0)
                          }
                          onChange={() => handleImageSelect(0, index)}
                          className="absolute top-2 right-1"
                        />
                      </motion.div>
                    )}
                    {card.image2 && (
                      <motion.div
                        key={1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative hover:cursor-pointer rounded-md ${
                          selectedImages[index] &&
                          selectedImages[index].includes(1)
                            ? "border-3 border-[#17C964]"
                            : "border-3 border-transparent"
                        }`}
                        style={{
                          transition:
                            "border-color 0.3s ease, transform 0.3s ease",
                        }}
                        onClick={() => handleImageSelect(1, index)}
                      >
                        <img
                          src={`${card.image2}`}
                          alt="Image 2"
                          className="w-44 h-44 rounded-md aspect-square"
                        />
                        <Checkbox
                          color="success"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(1)
                          }
                          onChange={() => handleImageSelect(1, index)}
                          className="absolute top-2 right-1"
                        />
                      </motion.div>
                    )}
                    {card.difficulty !== "easy" && card.image3 && (
                      <motion.div
                        key={2}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative hover:cursor-pointer rounded-md ${
                          selectedImages[index] &&
                          selectedImages[index].includes(2)
                            ? "border-3 border-[#17C964]"
                            : "border-3 border-transparent"
                        }`}
                        style={{
                          transition:
                            "border-color 0.3s ease, transform 0.3s ease",
                        }}
                        onClick={() => handleImageSelect(2, index)}
                      >
                        <img
                          src={`${card.image3}`}
                          alt="Image 3"
                          className="w-44 h-44 rounded-md aspect-square"
                        />
                        <Checkbox
                          color="success"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(2)
                          }
                          onChange={() => handleImageSelect(2, index)}
                          className="absolute top-2 right-1"
                        />
                      </motion.div>
                    )}
                    {card.difficulty === "hard" && card.image4 && (
                      <motion.div
                        key={3}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative hover:cursor-pointer rounded-md ${
                          selectedImages[index] &&
                          selectedImages[index].includes(3)
                            ? "border-3 border-[#17C964]"
                            : "border-3 border-transparent"
                        }`}
                        style={{
                          transition:
                            "border-color 0.3s ease, transform 0.3s ease",
                        }}
                        onClick={() => handleImageSelect(3, index)}
                      >
                        <img
                          src={`${card.image4}`}
                          alt="Image 4"
                          className="w-44 h-44 rounded-md aspect-square"
                        />
                        <Checkbox
                          color="success"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(3)
                          }
                          onChange={() => handleImageSelect(3, index)}
                          className="absolute top-2 right-1"
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="w-full mt-9">
                    <Button
                      onClick={handleCheckAnswers}
                      className="w-full inline-flex justify-center whitespace-nowrap rounded-lg bg-[#7469B6] px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-950/10 hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-300 focus-visible:outline-none focus-visible:ring focus-visible:ring-indigo-300 transition-colors duration-150"
                    >
                      Check Answers
                    </Button>
                  </div>
                  <AnimatePresence>
                    {feedback[index] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex w-full text-center justify-center rounded-md"
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
                </CardBody>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FourPicsOneWordAdvanced;
