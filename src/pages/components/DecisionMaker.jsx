import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@nextui-org/react";
import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Check,
  X,
  ArrowLeftRight,
} from "lucide-react";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";

// import required modules
import { Pagination, Navigation } from "swiper/modules";
import { EffectCreative } from "swiper/modules";
const DecisionMaker = ({ cards }) => {
  const [firstCard, setFirstCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState({});
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  useEffect(() => {
    if (cards.length > 0) {
      setFirstCard(cards[0]);
    }
  }, [cards]);

  const handleVote = (card, vote) => {
    console.log(card, vote);
    const isCorrect = card.correct_answer === vote;
    console.log("isCorrect", isCorrect);
    setSelectedCards((prev) => ({
      ...prev,
      [card.decision_maker_id]: { ...card, isCorrect },
    }));
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
  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      <div className="flex w-full max-w-[50rem] items-center justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold">Decision Game</h1>
        </div>
        <Button variant="flat" color="secondary" onPress={changeIconPair}>
          <ArrowLeftRight className="h-4 w-4 mr-1" />
          Change Icons
        </Button>
      </div>
      {/* {firstCard && <h1>{firstCard.title}</h1>} */}

      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl">
        <Swiper
          // pagination={{
          //   type: "progressbar",
          // }}
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
        >
          {cards.map((card) => (
            <SwiperSlide key={card.decision_maker_id}>
              <Card
                key={card.decision_maker_id}
                className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto"
              >
                <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
                  <h1 className="text-3xl font-extrabold my-5 capitalize">
                    {card.word}
                  </h1>
                  <div className="max-w-[15rem]">
                    <Image
                      src={card.image}
                      alt={card.title}
                      width="100%"
                      height="100%"
                    />
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onPress={() => handleVote(card, "positive")}
                        color="success"
                        variant="flat"
                      >
                        {buttonPairs[currentPairIndex].positive}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onPress={() => handleVote(card, "negative")}
                        color="danger"
                        variant="flat"
                      >
                        {buttonPairs[currentPairIndex].negative}
                      </Button>
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {selectedCards[card.decision_maker_id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex w-full justify-center rounded-md"
                      >
                        <p className="w-full text-center">
                          {selectedCards[card.decision_maker_id].isCorrect ? (
                            <div className="text-white w-full bg-green-500 p-2 rounded-md">
                              <h1 className="w-full">Correct</h1>
                            </div>
                          ) : (
                            <div className="text-white w-full bg-red-500 p-2 rounded-md">
                              <h1 className="w-full">Incorrect</h1>
                            </div>
                          )}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default DecisionMaker;
