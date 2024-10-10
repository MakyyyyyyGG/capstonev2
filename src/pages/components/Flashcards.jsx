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
import { Volume2, RotateCw, RotateCcw } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

const Flashcards = ({ flashcards }) => {
  const [showDescription, setShowDescription] = useState({});

  const toggleCardBody = (id) => {
    setShowDescription((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Flashcards</h1>
      </div>
      <div className="flex flex-wrap gap-4">
        <Carousel className="w-full drop-shadow-lg rounded-md">
          <CarouselContent>
            {flashcards.map((flashcard) => (
              <CarouselItem key={flashcard.flashcard_id}>
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
                          <audio
                            src={flashcard.audio}
                            controls
                            className="w-full"
                          />
                        )}
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
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-[#7469B6] text-white border-0" />
          <CarouselNext className="bg-[#7469B6] text-white border-0" />
        </Carousel>
      </div>
    </div>
  );
};

export default Flashcards;
