import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  CardFooter,
  Image,
  Input,
  Checkbox,
  Button,
  Progress,
} from "@nextui-org/react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  EffectCreative,
} from "swiper/modules";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Summary from "./Summary";
import "swiper/swiper-bundle.css";
import "swiper/css/effect-creative";
import GameHistory from "./GameHistory";
import Shop from "./Shop";
import { ArrowLeft, CircleCheck } from "lucide-react";
import Loader from "./Loader";
const ColorGames = ({ cards = [] }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [correctSelections, setCorrectSelections] = useState({});
  const [submissionResults, setSubmissionResults] = useState({});
  const [shuffledCards, setShuffledCards] = useState([]);
  const [feedback, setFeedback] = useState(Array(cards?.length || 0).fill(""));
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const [attempts, setAttempts] = useState({});
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [rewards, setRewards] = useState({ coins: 0, exp: 0 });

  // Sound effect refs
  const correctSound = useRef(null);
  const incorrectSound = useRef(null);

  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    if (!cards) return;

    const shuffled = shuffleArray(cards);
    setShuffledCards(shuffled);
    setFeedback(Array(shuffled.length).fill(""));
    setAttempts(Array(shuffled.length).fill(0));

    getStudentTries();
  }, [cards]);

  useEffect(() => {
    if (isGameFinished) {
      handleResult();
    }
  }, [isGameFinished]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getColorFromImageUrl = (url) => {
    if (!url) {
      console.error("URL is null or undefined");
      return "";
    }
    console.log("url", url);
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split("-")[0];
  };

  const handleImageSelect = async (cardId, imageIndex, imageUrl) => {
    if (imageUrl === "") {
      alert("No image selected");
      return;
    }
    setSelectedImages((prev) => {
      const newSelection = prev[cardId] ? [...prev[cardId]] : [];
      if (newSelection.includes(imageIndex)) {
        return {
          ...prev,
          [cardId]: newSelection.filter((id) => id !== imageIndex),
        };
      } else if (newSelection.length < 4) {
        return { ...prev, [cardId]: [...newSelection, imageIndex] };
      }
      return prev;
    });
  };

  useEffect(() => {
    const newCorrectSelections = {};
    shuffledCards.forEach((card) => {
      const cardImages = [card.image1, card.image2, card.image3, card.image4];
      const selectedCardImages = selectedImages[card.color_game_id] || [];
      const allSelectedImagesCorrect = selectedCardImages.every(
        (index) => getColorFromImageUrl(cardImages[index]) === card.color
      );
      const allCorrectImagesSelected = cardImages.every(
        (image, index) =>
          getColorFromImageUrl(image) !== card.color ||
          selectedCardImages.includes(index)
      );
      newCorrectSelections[card.color_game_id] =
        allSelectedImagesCorrect &&
        allCorrectImagesSelected &&
        selectedCardImages.length ===
          cardImages.filter(
            (image) => getColorFromImageUrl(image) === card.color
          ).length;
    });
    setCorrectSelections(newCorrectSelections);
  }, [selectedImages, shuffledCards]);

  const handleSubmit = (index) => {
    const card = shuffledCards[index];
    const selectedCardImages = selectedImages[card.color_game_id] || [];

    // Check if no image is selected
    if (selectedCardImages.length === 0) {
      alert("Please select at least one image before submitting.");
      return;
    }

    const currentAttempts = attempts[index];
    if (currentAttempts >= 3) return;

    const newAttempts = [...attempts];
    newAttempts[index]++;
    setAttempts(newAttempts);

    const correctImageCount = [
      card.image1,
      card.image2,
      card.image3,
      card.image4,
    ].filter((image) => getColorFromImageUrl(image) === card.color).length;
    const correctSelectionsCount = selectedCardImages.filter(
      (index) =>
        getColorFromImageUrl(
          [card.image1, card.image2, card.image3, card.image4][index]
        ) === card.color
    ).length;

    let newFeedback = "";
    if (
      correctSelectionsCount === correctImageCount &&
      selectedCardImages.length === correctImageCount
    ) {
      newFeedback = "Correct!";
      setScore((prevScore) => prevScore + 1);
      setAnswer((prevAnswer) => prevAnswer + 1);

      // Show emoji briefly when the answer is correct
      setShowEmoji(true);
      setTimeout(() => setShowEmoji(false), 1400); // 1.4-second delay to hide emoji

      // Play correct sound
      correctSound.current.play();

      // Delay before moving to the next slide
      setTimeout(() => {
        if (swiperInstance) {
          swiperInstance.slideNext();
        }
      }, 2500); // 2.5-second delay
    } else if (newAttempts[index] >= 3) {
      newFeedback = "Out of attempts. Moving to next question.";
      setAnswer((prevAnswer) => prevAnswer + 1);

      // Play incorrect sound
      incorrectSound.current.play();

      // Delay before moving to the next slide
      setTimeout(() => {
        if (swiperInstance) {
          swiperInstance.slideNext();
        }
      }, 2500); // 2.5-second delay
    } else {
      newFeedback = `Incorrect. ${3 - newAttempts[index]} attempts left.`;

      // Play incorrect sound
      incorrectSound.current.play();
    }

    const newFeedbackArray = [...feedback];
    newFeedbackArray[index] = newFeedback;
    setFeedback(newFeedbackArray);

    // Check if all cards have been answered or are out of attempts
    const allAnswered = newFeedbackArray.every(
      (fb) => fb.includes("Correct") || fb.includes("Out of attempts")
    );
    // Delay before finishing
    setTimeout(() => {
      if (allAnswered) {
        setIsGameFinished(true);
        getRewards(shuffledCards[0].difficulty);
      }
    }, 2500); // 2.5-second delay

    setSubmissionResults((prev) => ({
      ...prev,
      [card.color_game_id]: newFeedback,
    }));
  };

  const getLatestAttempts = (data) => {
    // Group by month and year
    const attemptsByMonth = {};

    data.forEach((attempt) => {
      // Get year and month from created_at
      const date = new Date(attempt.created_at);
      const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`; // Format as "YYYY-MM"

      // Add attempt to the correct month
      if (!attemptsByMonth[yearMonth]) {
        attemptsByMonth[yearMonth] = [];
      }
      attemptsByMonth[yearMonth].push(attempt);
    });

    // Get the latest 8 attempts for each month
    const latestAttempts = {};
    Object.keys(attemptsByMonth).forEach((month) => {
      // Sort by created_at (newest first)
      const sortedAttempts = attemptsByMonth[month].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Keep only the latest 8 attempts
      latestAttempts[month] = sortedAttempts.slice(0, 13);
    });

    return latestAttempts;
  };

  const getStudentTries = async () => {
    const account_id = session?.user?.id;
    console.log(account_id, game_id);
    try {
      const response = await fetch(
        `/api/student_game_record/student_game_record?account_id=${account_id}&game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setGameRecord(data.data);
        const latestAttempts = getLatestAttempts(data.data);
        console.log("latest attempts", latestAttempts);

        // Calculate attempts used
        const currentDate = new Date();
        const currentYearMonth = `${currentDate.getFullYear()}-${
          currentDate.getMonth() + 1
        }`;
        const currentMonthAttempts = latestAttempts[currentYearMonth] || [];
        setAttemptsUsed(currentMonthAttempts.length);
      }
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleResult = async () => {
    console.log("Game finished. Final score:", score);
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
      if (response.status === 200) {
        // alert("Game record created successfully");
        // Update gameRecord after finishing the game
        await getStudentTries();
      }
      if (response.status === 403) {
        // alert(result.message); // Show the limit message
      } else {
        console.log(result);
        // alert(`Game finished! Your score: ${score}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const calculateBonus = (score) => {
    return Math.round(score * 0.2); // 20% of score
  };

  const getRewards = (difficulty) => {
    if (difficulty === "easy") {
      setRewards({ coins: 10, exp: 10, bonus: calculateBonus(10) });
    } else if (difficulty === "medium") {
      setRewards({ coins: 20, exp: 20, bonus: calculateBonus(20) });
    } else {
      setRewards({ coins: 40, exp: 40, bonus: calculateBonus(40) });
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }
  return (
    <div className="relative flex flex-col justify-center px-4 pt-4">
      {/* Audio elements */}
      <audio
        ref={correctSound}
        src="/soundfx/audio/correct.mp3"
        preload="auto"
        aria-label="Correct answer sound effect"
      />
      <audio
        ref={incorrectSound}
        src="/soundfx/audio/incorrect.mp3"
        preload="auto"
        aria-label="Incorrect answer sound effect"
      />
      {isGameFinished ? (
        <>
          {gameRecord.length > 0 && (
            <Summary
              gameRecord={gameRecord}
              questions={cards?.length}
              rewards={rewards}
            />
          )}
        </>
      ) : (
        <>
          <div
            className="flex w-full max-w-[50rem] mx-auto justify-center items-center bg-white border-4 border-purple-300 rounded-md p-4"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <div className="flex w-full max-w-[50rem] items-center justify-between">
              <div className="flex gap-4 items-center cursor-pointer">
                <ArrowLeft
                  size={24}
                  aria-label="Back"
                  onClick={() => router.back()}
                  className="text-purple-700"
                />
                <span className="text-2xl font-bold text-purple-700">
                  {cards[0]?.title}
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <CircleCheck className="w-6 h-6 text-white fill-green-500" />
                    <span className="text-lg font-bold text-purple-700">
                      {score}/{cards.length}
                    </span>
                  </div>
                  <div className="text-sm font-medium bg-purple-100 px-3 py-1 rounded-full text-purple-600">
                    Monthly Tries: {attemptsUsed}/8
                  </div>
                </div>
                {/* <Shop aria-label="Shop" /> */}

                <GameHistory gameRecord={gameRecord} cards={cards?.length} />
              </div>
            </div>
          </div>
          {attemptsUsed >= 13 && (
            <div className="flex w-full justify-center items-center">
              <div className="w-full max-w-[50rem] bg-red-400 rounded-lg mt-3 p-3">
                <p className="text-sm text-white text-center">
                  You have used all your attempts for this month. Your score
                  wont be recorded. Wait for next month.
                </p>
              </div>
            </div>
          )}
          <div
            className="flex w-full max-w-[50rem] mx-auto justify-center items-center bg-white border-4 border-purple-300 rounded-full px-4 my-4"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <div className="w-full max-w-[50rem] my-4">
              <Progress
                value={(answer / (cards?.length || 1)) * 100}
                classNames={{
                  value: "text-foreground/60",
                  indicator: "bg-purple-500",
                  track: "bg-slate-200",
                }}
                aria-label="Game progress"
              />
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl mb-4">
            <Swiper
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
              modules={[EffectCreative]}
              className="mySwiper w-full drop-shadow-lg rounded-md"
              style={{
                filter: "drop-shadow(4px 4px 0px #7828C8",
              }}
              onSwiper={(swiper) => setSwiperInstance(swiper)}
              onSlideChange={() => console.log("slide change")}
              onSwiperSlideChange={() => console.log("swiper slide change")}
              aria-label="Color game slides"
            >
              {shuffledCards.map((card, index) => (
                <SwiperSlide key={card.color_game_id}>
                  <div key={card.color_game_id}>
                    <motion.div
                      animate={{
                        borderColor: feedback[index]?.includes("Correct")
                          ? "#22c55e" // green for correct
                          : attempts[index] >= 3
                          ? "#f9a8d4" // pink for out of attempts, default for others
                          : "#d8b4fe",
                      }}
                      transition={{ duration: 0.5 }}
                      className="border-4 bg-white rounded-lg"
                    >
                      <Card className="w-full rounded-md shadow-xl flex flex-col gap-2 h-[40rem] aspect-square mx-auto p-4">
                        <CardBody className="flex py-0 flex-col gap-2 px-auto items-center justify-center">
                          <div>
                            <h1 className="text-2xl text-purple-700 font-bold text-center">
                              Choose the correct image(s)
                            </h1>
                            <div className="flex justify-center items-center gap-2">
                              <div className="text-4xl text-purple-700 font-extrabold capitalize">
                                <h1>{card.color}</h1>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`grid ${
                              [
                                card.image1,
                                card.image2,
                                card.image3,
                                card.image4,
                              ].filter((image) => image !== null).length === 4
                                ? "grid-cols-2 max-w-[23rem]"
                                : [
                                    card.image1,
                                    card.image2,
                                    card.image3,
                                    card.image4,
                                  ].filter((image) => image !== null).length ===
                                  3
                                ? "grid-cols-3 max-sm:grid-cols-2 max-sm:max-w-[23rem]"
                                : "grid-cols-2"
                            } gap-2 justify-center`}
                          >
                            {[
                              card.image1,
                              card.image2,
                              card.image3,
                              card.image4,
                            ].map((image, imageIndex) =>
                              image ? (
                                <motion.div
                                  key={imageIndex}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`relative block w-full aspect-square rounded-md items-center justify-center cursor-pointer ${
                                    (attempts[index] || 0) >= 3
                                      ? "opacity-50 pointer-events-none"
                                      : ""
                                  } ${
                                    (
                                      selectedImages[card.color_game_id] || []
                                    ).includes(imageIndex)
                                      ? "border-3 border-purple-300 bg-white"
                                      : "border-3 border-transparent bg-white"
                                  }`}
                                  style={{
                                    transition:
                                      "border-color 0.3s ease, transform 0.3s ease",
                                    filter: (
                                      selectedImages[card.color_game_id] || []
                                    ).includes(imageIndex)
                                      ? "drop-shadow(4px 4px 0px #7828C8)"
                                      : "none", // Apply shadow only when selected
                                  }}
                                  onClick={() =>
                                    handleImageSelect(
                                      card.color_game_id,
                                      imageIndex,
                                      image
                                    )
                                  }
                                  aria-label={`Select image ${imageIndex + 1}`}
                                >
                                  <div className="p-2 rounded-md relative overflow-hidden">
                                    <Checkbox
                                      color="secondary"
                                      isSelected={(
                                        selectedImages[card.color_game_id] || []
                                      ).includes(imageIndex)}
                                      onChange={() =>
                                        handleImageSelect(
                                          card.color_game_id,
                                          imageIndex,
                                          image
                                        )
                                      }
                                      className="absolute top-2 right-1 opacity-0"
                                      isDisabled={(attempts[index] || 0) >= 3}
                                      aria-label={`Select image ${
                                        imageIndex + 1
                                      }`}
                                    />
                                    <Image
                                      src={image}
                                      alt={`Color image ${imageIndex + 1}`}
                                      className="w-full aspect-square object-cover rounded-md"
                                    />
                                  </div>
                                </motion.div>
                              ) : null
                            )}
                          </div>
                        </CardBody>
                        <CardFooter className="w-full flex flex-col gap-2 pt-0">
                          <AnimatePresence>
                            {submissionResults[card.color_game_id] && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="flex w-full text-center justify-center rounded-md"
                                role="alert"
                              >
                                <motion.div
                                  key={feedback[index]}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 20 }}
                                  className={
                                    submissionResults[card.color_game_id] ===
                                    "Correct!"
                                      ? "text-white w-full bg-green-500 p-2 rounded-lg"
                                      : submissionResults[
                                          card.color_game_id
                                        ] === "Almost there!"
                                      ? "text-white w-full bg-yellow-400 p-2 rounded-lg"
                                      : "text-purple-900 w-full bg-pink-300 p-2 rounded-lg"
                                  }
                                >
                                  {submissionResults[card.color_game_id]}
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full"
                          >
                            <Button
                              radius="sm"
                              className="w-full h-16 justify-center text-purple-700 text-lg bg-white border-4 border-purple-300"
                              style={{
                                filter: "drop-shadow(4px 4px 0px #7828C8",
                              }}
                              onClick={() => handleSubmit(index)}
                              isDisabled={
                                (attempts[index] || 0) >= 3 ||
                                !(selectedImages[card.color_game_id] || [])
                                  .length ||
                                submissionResults[card.color_game_id] ===
                                  "Correct!"
                              }
                              aria-label="Check answers"
                            >
                              Check Answer
                            </Button>
                          </motion.div>
                        </CardFooter>
                        <AnimatePresence>
                          {showEmoji && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0, rotate: -45 }}
                              animate={{
                                scale: [1.5, 1.8, 1.2, 1],
                                opacity: 1,
                                rotate: [0, 10, -10, 0],
                              }}
                              exit={{ scale: 0, opacity: 0, rotate: 45 }}
                              transition={{
                                duration: 1.2,
                                ease: [0.36, 1.2, 0.5, 1],
                              }}
                              className="absolute z-10 top-[40%] left-[39%] transform -translate-x-1/2 -translate-y-1/2 text-9xl"
                            >
                              😄
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </>
      )}
    </div>
  );
};

export default ColorGames;
