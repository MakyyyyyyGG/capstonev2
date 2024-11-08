import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
} from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import { RotateCw, RotateCcw, VolumeX, Play, Pause } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";
import { Pagination, Navigation, EffectCreative } from "swiper/modules";

import "swiper/swiper-bundle.css";

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
    utterance.voice = selectedVoice;
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  }
};

const FlashcardsStudent = ({ flashcards }) => {
  const [showDescription, setShowDescription] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);
  const audioRefs = useRef({});
  const [currentFlashcards, setCurrentFlashcards] = useState([]);
  const [noAudio, setNoAudio] = useState(null);

  useEffect(() => {
    if (flashcards) {
      // Only randomize once when flashcards prop changes
      setCurrentFlashcards([...flashcards].sort(() => Math.random() - 0.5));
    }
  }, [flashcards]);

  const toggleCardBody = (id) => {
    // Reset audioPlaying state if the card is being flipped to the front
    if (showDescription[id]) {
      setAudioPlaying(null);
    }

    setShowDescription((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle case where flashcards is undefined
  if (!flashcards) {
    return (
      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
        <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
          <h1>Flashcards</h1>
        </div>
        <p>No flashcards available</p>
      </div>
    );
  }

  const handleAudioPlay = (flashcard_id) => {
    // Check if there's an audio currently playing that is different from the selected one
    if (
      audioPlaying &&
      audioPlaying !== flashcard_id &&
      audioRefs.current[audioPlaying]
    ) {
      audioRefs.current[audioPlaying].pause();
    }

    const currentAudio = audioRefs.current[flashcard_id];
    if (currentAudio) {
      if (currentAudio.paused) {
        currentAudio.play();
        setAudioPlaying(flashcard_id);
      } else {
        currentAudio.pause();
        setAudioPlaying(null);
      }
    } else {
      // Show no-audio indicator if no audio is found
      setNoAudio(flashcard_id);
      setTimeout(() => setNoAudio(null), 1500); // Hide after 1.5 seconds
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Flashcards</h1>
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
          {currentFlashcards.map((flashcard) => (
            <SwiperSlide key={flashcard.flashcard_id}>
              <motion.div
                animate={{
                  rotateY: showDescription[flashcard.flashcard_id] ? 180 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
                style={{ perspective: 1000 }}
              >
                <Card className="w-full h-[500px] rounded-md">
                  {!showDescription[flashcard.flashcard_id] && (
                    <CardBody className="flex flex-col justify-center items-center gap-4">
                      <div className="flex text-6xl font-extrabold">
                        <p>{flashcard.term}</p>
                      </div>
                    </CardBody>
                  )}
                  {showDescription[flashcard.flashcard_id] && (
                    <CardBody className="w-full flex px-8 justify-center items-center flex-row gap-4 scale-x-[-1] max-sm:flex-col max-sm:justify-center max-sm:py-4">
                      {flashcard.image && (
                        <div className="flex max-w-96 justify-center items-center rounded-md">
                          <img
                            src={flashcard.image}
                            alt={flashcard.term}
                            className={`w-full border-2 border-[#7469B6] rounded-md aspect-square object-cover cursor-pointer ${
                              flashcard.audio &&
                              audioPlaying === flashcard.flashcard_id
                                ? "opacity-80"
                                : "opacity-100"
                            }`}
                            onClick={() =>
                              handleAudioPlay(flashcard.flashcard_id)
                            }
                          />
                        </div>
                      )}
                      {flashcard.audio && (
                        <audio
                          ref={(el) =>
                            (audioRefs.current[flashcard.flashcard_id] = el)
                          }
                          src={flashcard.audio}
                          onEnded={() => setAudioPlaying(null)}
                        />
                      )}
                      {/* Audio Playing Animation */}
                      <AnimatePresence>
                        {audioPlaying === flashcard.flashcard_id && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-0 left-0 right-0 bg-[#9353D3] text-primary-foreground p-2 flex items-center justify-center"
                          >
                            <span className="mr-2">Audio playing</span>
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.8, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="w-2 h-2 bg-primary-foreground rounded-full"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* No Audio Indicator */}
                      <AnimatePresence>
                        {noAudio === flashcard.flashcard_id && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-0 left-0 right-0 bg-gray-500/90 text-white p-2 flex items-center justify-center"
                          >
                            <span className="mr-2">No audio available</span>
                            <VolumeX size={18} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardBody>
                  )}
                  <CardFooter
                    className={`flex justify-center items-center pt-1 ${
                      showDescription[flashcard.flashcard_id]
                        ? "scale-x-[-1]"
                        : ""
                    }`}
                  >
                    <Button
                      radius="sm"
                      color="secondary"
                      onClick={() => toggleCardBody(flashcard.flashcard_id)}
                    >
                      {showDescription[flashcard.flashcard_id] ? (
                        <RotateCcw size={20} />
                      ) : (
                        <RotateCw size={20} />
                      )}
                      Flip Card
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default FlashcardsStudent;
