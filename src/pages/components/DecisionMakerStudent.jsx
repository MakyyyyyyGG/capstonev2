import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Card,
  CardBody,
  Image,
  Progress,
} from "@nextui-org/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";
import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import BarChart from "./BarChart";

const DecisionMakerStudent = ({ cards }) => {
  const [firstCard, setFirstCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState({});
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [shuffledCards, setShuffledCards] = useState([]);
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;
  const [gameCompleted, setGameCompleted] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameRecord, setGameRecord] = useState([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  useEffect(() => {
    if (cards.length > 0) {
      setFirstCard(cards[0]);
      setShuffledCards(shuffleArray(cards));
      getStudentTries();
    }
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

  const handleVote = (card, vote) => {
    const isCorrect = card.correct_answer === vote;
    const newFeedback = { ...feedback };

    if (isCorrect) {
      newFeedback[card.decision_maker_id] = "Correct!";
      setScore((prevScore) => prevScore + 1);
    } else {
      newFeedback[card.decision_maker_id] = "Incorrect.";
    }

    setFeedback(newFeedback);
    setAnswer((prev) => prev + 1);

    setSelectedCards((prev) => ({
      ...prev,
      [card.decision_maker_id]: {
        ...card,
        isCorrect,
        feedback: newFeedback[card.decision_maker_id],
      },
    }));

    if (swiperInstance) {
      swiperInstance.slideNext();
    }

    const allAnswered = shuffledCards.every(
      (card) => newFeedback[card.decision_maker_id]
    );

    if (allAnswered) {
      setIsGameFinished(true);
    }
  };

  const buttonPairs = [
    {
      positive: <ThumbsUp size={20} />,
      negative: <ThumbsDown size={20} />,
    },
    {
      positive: <Smile size={20} />,
      negative: <Frown size={20} />,
    },
    {
      positive: <Check size={20} />,
      negative: <X size={20} />,
    },
  ];

  const changeIconPair = () => {
    setCurrentPairIndex((prevIndex) => (prevIndex + 1) % buttonPairs.length);
  };

  const endGame = async () => {
    if (gameCompleted) {
      await handleResult();
      alert("You have completed the game!");
    }
  };

  const getStudentTries = async () => {
    const account_id = session?.user?.id;
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
      latestAttempts[month] = sortedAttempts.slice(0, 8);
    });

    // setLatestAttempts(latestAttempts);
    return latestAttempts;
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
        await getStudentTries();
      } else {
        console.log(result);
        alert("Game finished!");
        await getStudentTries();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      {isGameFinished ? (
        <>
          {gameRecord.length > 0 && (
            <BarChart gameRecord={gameRecord} questions={cards.length} />
          )}
        </>
      ) : (
        <>
          <h1>Attempts used this month: {attemptsUsed} / 8</h1>
          {attemptsUsed >= 8 && (
            <div className="w-1/2 bg-red-400 rounded-md p-4">
              <p className="text-white">
                You have used all your attempts for this month. Your score wont
                be recorded. Wait for next month.
              </p>
            </div>
          )}
          <h1>Score: {score}</h1>
          <Button variant="flat" color="secondary" onPress={changeIconPair}>
            Change Icons
          </Button>
          <div className="w-1/2 m-auto my-4">
            <Progress
              value={(answer / cards.length) * 100}
              classNames={{
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
            onSwiperSlideChange={() => console.log("swiper slide change")}
          >
            {shuffledCards.map((card) => (
              <SwiperSlide key={card.decision_maker_id}>
                <Card key={card.decision_maker_id} className="w-1/2 m-auto">
                  <CardBody>
                    <h1 className="m-auto font-bold text-xl my-4">
                      {card.word}
                    </h1>
                    <div className="">
                      <Image
                        src={card.image}
                        alt={card.title}
                        width="100%"
                        height="100%"
                      />
                    </div>
                    <div className="flex gap-2 m-auto my-4">
                      <Button
                        onPress={() => handleVote(card, "positive")}
                        color="success"
                        variant="flat"
                        isDisabled={feedback[card.decision_maker_id]}
                      >
                        {buttonPairs[currentPairIndex].positive}
                      </Button>
                      <Button
                        onPress={() => handleVote(card, "negative")}
                        color="danger"
                        variant="flat"
                        isDisabled={feedback[card.decision_maker_id]}
                      >
                        {buttonPairs[currentPairIndex].negative}
                      </Button>
                    </div>
                    {feedback[card.decision_maker_id] && (
                      <div className="flex justify-center">
                        <h1
                          className={
                            feedback[card.decision_maker_id] === "Correct!"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {feedback[card.decision_maker_id]}
                        </h1>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        </>
      )}
    </div>
  );
};

export default DecisionMakerStudent;
