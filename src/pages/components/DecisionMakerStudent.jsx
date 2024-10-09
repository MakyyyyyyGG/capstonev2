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
  useEffect(() => {
    if (cards.length > 0) {
      setFirstCard(cards[0]);
      setShuffledCards(shuffleArray(cards));
      getStudentTries();
    }
  }, [cards]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleVote = (card, vote) => {
    console.log(card, vote);
    const isCorrect = card.correct_answer === vote;
    console.log("isCorrect", isCorrect);
    setSelectedCards((prev) => ({
      ...prev,
      [card.decision_maker_id]: { ...card, isCorrect },
    }));
    setAnswer((prev) => prev + 1);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
      alert("Correct Decision!");
    } else {
      alert("Incorrect Decision!");
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    }
    if (answer + 1 === cards.length) {
      endGame();
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
      {firstCard && <h1>{firstCard.title}</h1>}
      <Button variant="flat" color="secondary" onPress={changeIconPair}>
        Change Icons
      </Button>
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
        onSwiperSlideChange={() => console.log("swiper slide change")}
      >
        {shuffledCards.map((card) => (
          <SwiperSlide key={card.decision_maker_id}>
            <Card key={card.decision_maker_id} className="w-1/2 m-auto">
              <CardBody>
                <h1 className="m-auto font-bold text-xl my-4">{card.word}</h1>
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
                    isDisabled={
                      selectedCards[card.decision_maker_id] !== undefined
                    }
                  >
                    {buttonPairs[currentPairIndex].positive}
                  </Button>
                  <Button
                    onPress={() => handleVote(card, "negative")}
                    color="danger"
                    variant="flat"
                    isDisabled={
                      selectedCards[card.decision_maker_id] !== undefined
                    }
                  >
                    {buttonPairs[currentPairIndex].negative}
                  </Button>
                </div>
                {selectedCards[card.decision_maker_id] && (
                  <h1>
                    {selectedCards[card.decision_maker_id].isCorrect ? (
                      <div className="flex justify-center">
                        <h1 className="text-green-500">Correct</h1>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <h1 className="text-red-500">Incorrect</h1>
                      </div>
                    )}
                  </h1>
                )}
              </CardBody>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default DecisionMakerStudent;
