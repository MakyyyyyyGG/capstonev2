import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Image, Progress } from "@nextui-org/react";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Volume2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";

const FourPicsOneWordAdvancedStudent = ({ cards }) => {
  const [shuffledCards, setShuffledCards] = useState([]);
  const [feedback, setFeedback] = useState(Array(cards.length).fill(""));
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const [playedGames, setPlayedGames] = useState(1); // times played

  useEffect(() => {
    setShuffledCards(shuffleArray(cards));
    setFeedback(Array(cards.length).fill(""));
    getStudentTries();
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
      setScore(score + 1);
      const newFeedback = [...feedback];
      newFeedback[cardIndex] = "Correct!";
      setFeedback(newFeedback);
      setAnswer(answer + 1);
      console.log("answer", answer);

      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else {
      const newFeedback = [...feedback];
      newFeedback[cardIndex] = "Incorrect. Try again!";
      alert("Wrong answer");
      setAnswer(answer + 1);
      console.log("answer", answer);
      setFeedback(newFeedback);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    }
    if (answer + 1 === cards.length) {
      endGame();
    }
  };
  const endGame = async () => {
    await handleResult();
    alert("You have completed the game!");
  };

  const getStudentTries = async () => {
    const account_id = session?.user?.id;
    try {
      const response = await fetch(
        `/api/student_game_record/student_game_record?account_id=${account_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleResult = async () => {
    const data = {
      account_id: session.user.id,
      game_id: game_id,
      score: score,
    };

    try {
      const response = await fetch(
        "/api/student_game_record/student_game_record",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (response.status === 403) {
        alert(result.message); // Show the limit message
      } else {
        console.log(result);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div>
      <h1>Score: {score}</h1>
      <div className="w-1/2 m-auto my-4">
        <Progress
          value={(answer / cards.length) * 100}
          classNames={{
            // label: "tracking-wider",
            value: "text-foreground/60",
          }}
          label="Progress"
          showValueLabel={true}
          color="success"
        />
      </div>
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        navigation
        spaceBetween={50}
        slidesPerView={1}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        onSlideChange={() => console.log("slide change")}
      >
        {shuffledCards.map((card, index) => (
          <SwiperSlide key={index}>
            <div className="m-auto h-screen">
              <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
                <CardBody className="flex flex-col gap-4">
                  <div className="flex justify-center flex-col gap-2 items-center">
                    <h1>Word:</h1>
                    <h1>{card.word}</h1>

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
                      [
                        card.image1,
                        card.image2,
                        card.image3,
                        card.image4,
                      ].filter((image) => image !== null).length === 4
                        ? "grid-cols-2 grid-rows-2"
                        : [
                            card.image1,
                            card.image2,
                            card.image3,
                            card.image4,
                          ].filter((image) => image !== null).length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2"
                    } gap-2`}
                  >
                    {[card.image1, card.image2, card.image3, card.image4].map(
                      (image, idx) =>
                        image && (
                          <div
                            key={idx}
                            className="hover:cursor-pointer hover:border-2 hover:border-purple-300 rounded-md"
                          >
                            <img
                              aria-disabled={true}
                              radius="none"
                              onClick={() =>
                                feedback[index] === ""
                                  ? handleImageClick(idx, index)
                                  : null
                              }
                              src={`${image}`}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )
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
          </SwiperSlide>
        ))}
        <SwiperSlide>
          <h1>You have completed the game!</h1>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default FourPicsOneWordAdvancedStudent;
