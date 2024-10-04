import React, { useState, useEffect } from "react";
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
import { Volume2 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import "swiper/css/effect-cards";

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
    console.log("voices:", voices);
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
  // Randomize the flashcards
  const randomizedFlashcards = flashcards.sort(() => Math.random() - 0.5);

  return (
    <div>
      <h1>Flashcard Type Game</h1>

      <Swiper
        className="mySwiper"
        effect={"cards"}
        grabCursor={true}
        modules={[EffectCards]}
        spaceBetween={50}
        slidesPerView={1}
        // navigation
        // pagination={{ clickable: true }}
        // scrollbar={{ draggable: true }}
        onSwiper={(swiper) => console.log(swiper)}
        onSlideChange={() => console.log("slide change")}
      >
        {randomizedFlashcards.map((flashcard) => (
          <SwiperSlide key={flashcard.flashcard_id}>
            <div className="w-[500px] m-auto">
              <Card className="w-full">
                <CardBody className="flex flex-col gap-4">
                  {flashcard.image && (
                    <img
                      src={flashcard.image}
                      alt={flashcard.term}
                      className="w-full h-auto"
                    />
                  )}
                  <p>Term: {flashcard.term}</p>
                  <Button
                    onClick={() => handleTextToSpeech(flashcard.term)}
                    color="secondary"
                  >
                    <Volume2 />
                  </Button>
                  <p>Description: {flashcard.description}</p>
                  {flashcard.audio && (
                    <audio src={flashcard.audio} controls className="w-full" />
                  )}
                </CardBody>
              </Card>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default FlashcardsStudent;
