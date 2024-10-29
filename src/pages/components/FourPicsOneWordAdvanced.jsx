import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Image, Checkbox } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const FourPicsOneWordAdvanced = ({ cards }) => {
  console.log(cards);
  const [selectedImages, setSelectedImages] = useState(
    Array(cards.length).fill([]) // Initialize with empty arrays for each card
  );
  const [feedback, setFeedback] = useState(Array(cards.length).fill(""));

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

  return (
    <div>
      <h1>4 Pics 1 Word Game</h1>

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
                    <div className="relative">
                      <img
                        src={`${card.image1}`}
                        alt="Image 1"
                        className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                        onClick={() => handleImageSelect(0, index)} // Add onClick to image
                      />
                      <Checkbox
                        isSelected={
                          selectedImages[index] &&
                          selectedImages[index].includes(0)
                        }
                        onChange={() => handleImageSelect(0, index)}
                        className="absolute top-2 left-2"
                      />
                    </div>
                  )}
                  {card.image2 && (
                    <div className="relative">
                      <img
                        src={`${card.image2}`}
                        alt="Image 2"
                        className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                        onClick={() => handleImageSelect(1, index)} // Add onClick to image
                      />
                      <Checkbox
                        isSelected={
                          selectedImages[index] &&
                          selectedImages[index].includes(1)
                        }
                        onChange={() => handleImageSelect(1, index)}
                        className="absolute top-2 left-2"
                      />
                    </div>
                  )}
                  {card.difficulty !== "easy" && card.image3 && (
                    <div className="relative">
                      <img
                        src={`${card.image3}`}
                        alt="Image 3"
                        className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                        onClick={() => handleImageSelect(2, index)} // Add onClick to image
                      />
                      <Checkbox
                        isSelected={
                          selectedImages[index] &&
                          selectedImages[index].includes(2)
                        }
                        onChange={() => handleImageSelect(2, index)}
                        className="absolute top-2 left-2"
                      />
                    </div>
                  )}
                  {card.difficulty === "hard" && card.image4 && (
                    <div className="relative">
                      <img
                        src={`${card.image4}`}
                        alt="Image 4"
                        className="w-full h-auto border-2 border-purple-300 rounded-md aspect-square hover:scale-125 transition-all"
                        onClick={() => handleImageSelect(3, index)} // Add onClick to image
                      />
                      <Checkbox
                        isSelected={
                          selectedImages[index] &&
                          selectedImages[index].includes(3)
                        }
                        onChange={() => handleImageSelect(3, index)}
                        className="absolute top-2 left-2"
                      />
                    </div>
                  )}
                </div>
                {feedback[index] && (
                  <p
                    className={
                      feedback[index].includes("Correct")
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {feedback[index]}
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <Button onClick={handleCheckAnswers} color="primary">
          Check Answers
        </Button>
      </div>
    </div>
  );
};

export default FourPicsOneWordAdvanced;
