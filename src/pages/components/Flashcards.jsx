import React, { useState, useEffect, useRef } from "react";
import { Card, CardBody, CardFooter, Button, Switch } from "@nextui-org/react";
import { RotateCw, RotateCcw, Volume2, Play, Pause } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";
import { Pagination, Navigation, EffectCreative } from "swiper/modules";
import Loader from "./Loader";

const Flashcards = ({ flashcards, isLoading }) => {
  const [showDescription, setShowDescription] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);
  const audioRefs = useRef({});

  const toggleCardBody = (id) => {
    setShowDescription((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAudioPlay = (flashcard_id, audio) => {
    if (audioPlaying && audioPlaying !== flashcard_id) {
      audioRefs.current[audioPlaying].pause();
    }
    if (audioRefs.current[flashcard_id].paused) {
      audioRefs.current[flashcard_id].play();
      setAudioPlaying(flashcard_id);
    } else {
      audioRefs.current[flashcard_id].pause();
      setAudioPlaying(null);
    }
  };

  if (!flashcards) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Loader />
        </div>
      ) : (
        <>
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
              {flashcards.map((flashcard) => (
                <SwiperSlide key={flashcard.flashcard_id}>
                  <Card className="w-full h-[500px] rounded-md">
                    {!showDescription[flashcard.flashcard_id] && (
                      <CardBody className="flex flex-col justify-center items-center gap-4">
                        <div className="flex text-6xl font-extrabold">
                          <p>{flashcard.term}</p>
                        </div>
                      </CardBody>
                    )}
                    {showDescription[flashcard.flashcard_id] && (
                      <CardBody className="w-full flex px-8 justify-center items-center flex-row gap-4 max-sm:flex-col max-sm:justify-center max-sm:py-4">
                        {flashcard.image && (
                          <div className="flex max-w-80 justify-center items-center rounded-md">
                            <img
                              src={flashcard.image}
                              alt={flashcard.term}
                              className="border-2 border-[#7469B6] rounded-md aspect-square object-cover"
                            />
                          </div>
                        )}

                        {flashcard.audio && (
                          <div className="absolute top-0 right-0 p-4 flex items-center">
                            <Button
                              isIconOnly
                              variant="light"
                              onClick={() =>
                                handleAudioPlay(
                                  flashcard.flashcard_id,
                                  flashcard.audio
                                )
                              }
                              className="ml-4 text-[#7469B6]"
                            >
                              {audioPlaying === flashcard.flashcard_id ? (
                                <Pause size={22} />
                              ) : (
                                <Volume2 size={22} />
                              )}
                            </Button>
                          </div>
                        )}
                        <audio
                          ref={(el) =>
                            (audioRefs.current[flashcard.flashcard_id] = el)
                          }
                          src={flashcard.audio}
                        />
                      </CardBody>
                    )}
                    {/* {showDescription[flashcard.flashcard_id] && (
                      <CardBody className="w-full flex px-8 justify-center items-center flex-row gap-4 max-sm:flex-col max-sm:justify-center max-sm:py-4">
                        {flashcard.image && (
                          <div className="flex max-w-80 justify-center items-center rounded-md">
                            <img
                              src={flashcard.image}
                              alt={flashcard.term}
                              className={`border-2 border-[#7469B6] rounded-md aspect-square object-cover cursor-pointer ${
                                audioPlaying === flashcard.flashcard_id
                                  ? "opacity-80 border-4"
                                  : "opacity-100"
                              }`}
                              onClick={() =>
                                handleAudioPlay(flashcard.flashcard_id)
                              }
                            />
                          </div>
                        )}

                        <audio
                          ref={(el) =>
                            (audioRefs.current[flashcard.flashcard_id] = el)
                          }
                          src={flashcard.audio}
                        />
                      </CardBody>
                    )} */}
                    <CardFooter className="flex justify-center items-center pt-1">
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
