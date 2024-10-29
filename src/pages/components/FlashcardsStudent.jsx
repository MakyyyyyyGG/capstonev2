import React, { useState, useEffect, useRef } from "react";
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
import { RotateCw, RotateCcw, Volume2, Play, Pause } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";
import { Pagination, Navigation, EffectCreative } from "swiper/modules";

import "swiper/swiper-bundle.css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
// import "swiper/css/scrollbar";
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
    // console.log("voices:", voices);
    setVoiceAndSpeak(voices[1]); // Set default voice
  }

  function setVoiceAndSpeak(selectedVoice) {
    // Choose a different voice if needed (e.g., second voice in the list)
    utterance.voice = selectedVoice; // Select your desired voice
    utterance.rate = 0.7;
    speechSynthesis.speak(utterance);
  }
};

const FlashcardsStudent = ({ flashcards }) => {
  const [showDescription, setShowDescription] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null); // Track the currently playing audio
  const audioRefs = useRef({}); // To store multiple audio refs

  const toggleCardBody = (id) => {
    setShowDescription((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Randomize the flashcards
  const randomizedFlashcards = flashcards.sort(() => Math.random() - 0.5);

  const handleAudioPlay = (flashcard_id, audio) => {
    if (audioPlaying && audioPlaying !== flashcard_id) {
      // Pause the previously playing audio if a new one is triggered
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
          {randomizedFlashcards.map((flashcard) => (
            <SwiperSlide key={flashcard.flashcard_id}>
              <Card className="w-full h-[500px] rounded-md">
                {!showDescription[flashcard.flashcard_id] && (
                  <CardBody className="flex flex-col justify-center items-center gap-4">
                    <div className="flex text-2xl">
                      <p>{flashcard.term}</p>
                    </div>

                    {/* <Button
                      onClick={() => handleTextToSpeech(flashcard.term)}
                      color="secondary"
                    >
                      <Volume2 />
                    </Button> */}
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
    </div>
  );
  // return (
  //   <div>
  //     <h1>Flashcard Type Game</h1>

  //     <Swiper
  //       className="mySwiper"
  //       effect={"cards"}
  //       grabCursor={true}
  //       modules={[EffectCards]}
  //       spaceBetween={50}
  //       slidesPerView={1}
  //       // navigation
  //       // pagination={{ clickable: true }}
  //       // scrollbar={{ draggable: true }}
  //       // onSwiper={(swiper) => console.log(swiper)}
  //       // onSlideChange={() => console.log("slide change")}
  //     >
  //       {randomizedFlashcards.map((flashcard) => (
  //         <SwiperSlide key={flashcard.flashcard_id}>
  //           <div className="w-[500px] m-auto">
  //             <Card className="w-full">
  //               <CardBody className="flex flex-col gap-4">
  //                 {flashcard.image && (
  //                   <img
  //                     src={flashcard.image}
  //                     alt={flashcard.term}
  //                     className="w-full h-auto"
  //                   />
  //                 )}
  //                 <p>Term: {flashcard.term}</p>
  //                 <Button
  //                   onClick={() => handleTextToSpeech(flashcard.term)}
  //                   color="secondary"
  //                 >
  //                   <Volume2 />
  //                 </Button>
  //                 <p>Description: {flashcard.description}</p>
  //                 {flashcard.audio && (
  //                   <audio src={flashcard.audio} controls className="w-full" />
  //                 )}
  //               </CardBody>
  //             </Card>
  //           </div>
  //         </SwiperSlide>
  //       ))}
  //     </Swiper>
  //   </div>
  // );
};

export default FlashcardsStudent;
