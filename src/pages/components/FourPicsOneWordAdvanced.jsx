import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Image } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const FourPicsOneWordAdvanced = ({ cards }) => {
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
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageClick = (idx, cardIndex) => {
    const correctAnswer = cards[cardIndex].correct_answer.split(",");
    if (correctAnswer.includes(idx.toString())) {
      alert("Yey! Correct answer");
    } else {
      alert("Wrong answer");
    }
  };

  return (
    <div>
      <h1>4 Pics 1 Word Game</h1>

      {/* <h1>difficulty {cards[0].difficulty}</h1> */}
      <div className="flex flex-wrap gap-4">
        {cards.map((card, index) => (
          <div key={index} className="w-[500px]">
            <Card className="w-full">
              <CardBody className="flex flex-col gap-4">
                <div className="flex justify-center flex-col gap-2 items-center">
                  <h1>Word:</h1>
                  <InputOTP
                    maxLength={card.word.length}
                    value={card.word}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: card.word.length }).map(
                        (_, idx) => (
                          <React.Fragment key={idx}>
                            <InputOTPSlot
                              index={idx}
                              className="text-2xl w-10 h-10 font-bold border border-purple-300"
                            />
                          </React.Fragment>
                        )
                      )}
                    </InputOTPGroup>
                  </InputOTP>{" "}
                  {card.word && (
                    <Button
                      className="mb-4"
                      color="secondary"
                      onPress={() => handleTextToSpeech(card.word)}
                    >
                      <Volume2 />
                    </Button>
                  )}
                </div>
                <div
                  className={`grid ${
                    card.difficulty === "easy"
                      ? "grid-cols-2"
                      : card.difficulty === "medium"
                      ? "grid-cols-3"
                      : "grid-cols-2 grid-rows-2"
                  } gap-2 border`}
                >
                  {card.image1 && (
                    <img
                      onClick={() => handleImageClick(0, index)}
                      src={`${card.image1}`}
                      alt="Image 1"
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                    />
                  )}
                  {card.image2 && (
                    <img
                      onClick={() => handleImageClick(1, index)}
                      src={`${card.image2}`}
                      alt="Image 2"
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                    />
                  )}
                  {card.difficulty !== "easy" && card.image3 && (
                    <img
                      onClick={() => handleImageClick(2, index)}
                      src={`${card.image3}`}
                      alt="Image 3"
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                    />
                  )}
                  {card.difficulty === "hard" && card.image4 && (
                    <img
                      onClick={() => handleImageClick(3, index)}
                      src={`${card.image4}`}
                      alt="Image 4"
                      className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FourPicsOneWordAdvanced;
