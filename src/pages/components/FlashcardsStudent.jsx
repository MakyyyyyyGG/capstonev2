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

      <div className="flex flex-wrap gap-4">
        {randomizedFlashcards.map((flashcard) => (
          <div key={flashcard.flashcard_id} className="w-[500px]">
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
        ))}
      </div>
    </div>
  );
};

export default FlashcardsStudent;
