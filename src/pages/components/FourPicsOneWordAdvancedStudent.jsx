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
  const [shuffledCards, setShuffledCards] = useState([]);

  useEffect(() => {
    setShuffledCards(shuffleArray(cards));
  }, [cards]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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
    const correctAnswer = shuffledCards[cardIndex].correct_answer;
    if (correctAnswer == idx) {
      alert("Yey! Correct answer");
    } else {
      alert("Wrong answer");
    }
  };

  return (
    <div>
      <h1>4 Pics 1 Word Game</h1>
      <div className="flex flex-wrap gap-4">
        {shuffledCards.map((card, index) => (
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
                <div className="grid grid-cols-2 gap-2">
                  {[card.image1, card.image2, card.image3, card.image4].map(
                    (image, idx) => (
                      <div
                        key={idx}
                        className="hover:cursor-pointer hover:border-2 hover:border-purple-300 rounded-md"
                      >
                        <Image
                          radius="none"
                          isZoomed
                          onClick={() => handleImageClick(idx, index)}
                          src={`${image}`}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-auto object-cover aspect-square "
                        />
                      </div>
                    )
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
