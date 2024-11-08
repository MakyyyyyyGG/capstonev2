import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Image,
  Checkbox,
} from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
import { BiSolidSquareRounded } from "react-icons/bi";
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

const FourPicsOneWordAdvanced = ({ cards = [] }) => {
  // Add default empty array
  const [selectedImages, setSelectedImages] = useState(
    Array(cards?.length || 0).fill([]) // Add null check and default to 0
  );
  const [feedback, setFeedback] = useState(Array(cards?.length || 0).fill("")); // Add null check and default to 0
  const [imagesLoaded, setImagesLoaded] = useState(false);
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
    }
  }, [cards]);

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
              <Card className="w-full flex flex-col h-[40rem] aspect-square mx-auto">
                <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="text-4xl font-extrabold">
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
                        ? "grid-cols-3 justify-center max-sm:grid-cols-2 max-sm:max-w-[24rem]"
                        : "grid-cols-2 justify-center max-w-[24rem]"
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
                            ? "border-3 border-[#9353D3]"
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
                          className="w-full aspect-square object-cover rounded-md"
                        />
                        <Checkbox
                          icon={<BiSolidSquareRounded className="w-2 h-2" />}
                          color="secondary"
                          className="absolute top-2 right-1 text-[#9353D3] opacity-0"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(0)
                          }
                          onChange={() => handleImageSelect(0, index)}
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
                            ? "border-3 border-[#9353D3]"
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
                          className="w-full aspect-square object-cover rounded-md"
                        />
                        <Checkbox
                          icon={<BiSolidSquareRounded className="w-2 h-2" />}
                          color="secondary"
                          className="absolute top-2 right-1 text-[#9353D3] opacity-0"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(1)
                          }
                          onChange={() => handleImageSelect(1, index)}
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
                            ? "border-3 border-[#9353D3]"
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
                          className="w-full aspect-square object-cover rounded-md"
                        />
                        <Checkbox
                          icon={<BiSolidSquareRounded className="w-2 h-2" />}
                          color="secondary"
                          className="absolute top-2 right-1 text-[#9353D3] opacity-0"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(2)
                          }
                          onChange={() => handleImageSelect(2, index)}
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
                            ? "border-3 border-[#9353D3]"
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
                          className="w-full aspect-square object-cover rounded-md"
                        />
                        <Checkbox
                          icon={<BiSolidSquareRounded className="w-2 h-2" />}
                          color="secondary"
                          className="absolute top-2 right-1 text-[#9353D3] opacity-0"
                          isSelected={
                            selectedImages[index] &&
                            selectedImages[index].includes(3)
                          }
                          onChange={() => handleImageSelect(3, index)}
                        />
                      </motion.div>
                    )}
                  </div>
                </CardBody>
                <CardFooter className="w-full flex flex-col gap-2">
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
                              : "text-white w-full bg-red-500 p-2 rounded-lg"
                          }
                        >
                          {feedback[index]}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Button
                    radius="sm"
                    color="secondary"
                    onClick={handleCheckAnswers}
                    className="w-full h-16 justify-center text-lg"
                  >
                    Check Answer
                  </Button>
                </CardFooter>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FourPicsOneWordAdvanced;
