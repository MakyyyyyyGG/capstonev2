import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, CardFooter, Button, Switch } from "@nextui-org/react";
import {
  RotateCw,
  RotateCcw,
  VolumeX,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";
import {
  Pagination,
  Navigation,
  EffectCreative,
  ChevronLeft,
} from "swiper/modules";
import Loader from "./Loader";

const Flashcards = ({ flashcards, isLoading }) => {
  const [showDescription, setShowDescription] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const audioRefs = useRef({});
  const [noAudio, setNoAudio] = useState(null);

  useEffect(() => {
    if (flashcards && flashcards.length > 0) {
      const imagePromises = flashcards.map((flashcard) => {
        return new Promise((resolve) => {
          if (flashcard.image) {
            const img = new Image();
            img.src = flashcard.image;
            img.onload = resolve;
            img.onerror = resolve;
          } else {
            resolve();
          }
        });
      });

      Promise.all(imagePromises).then(() => {
        setImagesLoaded(true);
      });
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

  if (!flashcards) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      {isLoading || !imagesLoaded ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Loader />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
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
              navigation={true}
              modules={[Pagination, Navigation, EffectCreative]}
              className="mySwiper w-full drop-shadow-lg rounded-md"
              style={{
                filter: "drop-shadow(4px 4px 0px #7828C8",
              }}
            >
              {flashcards.map((flashcard) => (
                <SwiperSlide key={flashcard.flashcard_id}>
                  <motion.div
                    animate={{
                      rotateY: showDescription[flashcard.flashcard_id]
                        ? 180
                        : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full"
                    style={{ perspective: 1000 }}
                  >
                    <Card className="w-full h-[500px] border-4 border-purple-300 rounded-md">
                      {!showDescription[flashcard.flashcard_id] && (
                        <CardBody className="flex flex-col justify-center items-center gap-4">
                          <div className="flex text-6xl text-purple-700 font-extrabold">
                            <p>{flashcard.term}</p>
                          </div>
                        </CardBody>
                      )}

                      {showDescription[flashcard.flashcard_id] && (
                        <CardBody className="w-full flex px-8 justify-center items-center flex-row gap-4 scale-x-[-1] max-sm:flex-col max-sm:justify-center max-sm:py-4">
                          {flashcard.image && (
                            <div className="flex flex-col max-w-96 justify-center items-center rounded-md relative">
                              {flashcard.audio && (
                                <div
                                  className="absolute top-4 left-4 z-10 bg-purple-600 p-2 rounded-full"
                                  onClick={() =>
                                    handleAudioPlay(flashcard.flashcard_id)
                                  }
                                >
                                  <Volume2 className="h-5 w-5 text-white" />
                                </div>
                              )}
                              <img
                                src={flashcard.image}
                                alt={flashcard.term}
                                className={`w-full border-4 border-purple-300 bg-white rounded-md aspect-square object-cover cursor-pointer ${
                                  flashcard.audio &&
                                  audioPlaying === flashcard.flashcard_id
                                    ? "opacity-80"
                                    : "opacity-100"
                                }`}
                                style={{
                                  filter: "drop-shadow(4px 4px 0px #7828C8)",
                                }}
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
                          onClick={() => toggleCardBody(flashcard.flashcard_id)}
                          className="justify-center text-purple-700 bg-white border-4 border-purple-300 mb-2"
                          style={{
                            filter: "drop-shadow(4px 4px 0px #7828C8",
                          }}
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
        </>
      )}
    </div>
  );
};

export default Flashcards;
