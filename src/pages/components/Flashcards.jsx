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
                        <div className="flex text-2xl">
                          <p>{flashcard.term}</p>
                        </div>
                      </CardBody>
                    )}
                    {showDescription[flashcard.flashcard_id] && (
                      <CardBody className="w-full flex px-8 justify-center items-center flex-row gap-4 max-sm:flex-col max-sm:justify-center max-sm:py-4">
                        {flashcard.image && (
                          <div className="flex w-1/2 justify-center items-center">
                            <img
                              src={flashcard.image}
                              alt={flashcard.term}
                              className="h-auto w-full max-sm:w-1/2"
                            />
                          </div>
                        )}

                        <div className="flex w-full justify-center items-center text-2xl max-h-[300px] overflow-y-auto max-sm:w-full max-sm:text-lg max-sm:max-h-[150px]">
                          <p>{flashcard.description}</p>
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
                        </div>
                      </CardBody>
                    )}
                    <CardFooter className="flex justify-center items-center pt-0 ">
                      <Button
                        isIconOnly
                        radius="full"
                        className="bg-[#7469B6] text-white border-0"
                        onClick={() => toggleCardBody(flashcard.flashcard_id)}
                      >
                        {showDescription[flashcard.flashcard_id] ? (
                          <RotateCcw size={20} />
                        ) : (
                          <RotateCw size={20} />
                        )}
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
