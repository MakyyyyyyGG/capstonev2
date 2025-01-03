import React, { useState, useEffect, useRef } from "react";
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
  CardFooter,
  Image,
  Switch,
} from "@nextui-org/react";
import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Check,
  X,
  ArrowLeftRight,
  Eye,
  EyeOff,
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
import Loader from "./Loader";

const DecisionMaker = ({ cards }) => {
  const [firstCard, setFirstCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState({});
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [hideWord, setHideWord] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (cards?.length > 0) {
      setFirstCard(cards[0]);

      // Load all images
      const imagePromises = cards.map((card) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = card.image;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      Promise.all(imagePromises)
        .then(() => setImagesLoaded(true))
        .catch((err) => {
          console.error("Error loading images:", err);
          setImagesLoaded(true); // Set to true even on error to prevent infinite loading
        });
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
      positive: <ThumbsUp size={26} />,
      negative: <ThumbsDown size={26} />,
    },
    {
      positive: <Smile size={26} />,
      negative: <Frown size={26} />,
    },
    {
      positive: <Check size={26} />,
      negative: <X size={26} />,
    },
    {
      positive: "Yes",
      negative: "No",
    },
  ];
  const changeIconPair = () => {
    setCurrentPairIndex((prevIndex) => (prevIndex + 1) % buttonPairs.length);
  };

  if (!imagesLoaded) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 max-w-[50rem] mx-auto">
      <div className="flex w-full max-w-[50rem] items-center justify-between">
        <div
          className="flex w-full max-w-[50rem] mx-auto justify-end items-center bg-white border-4 border-purple-300 rounded-md p-4 "
          style={{
            filter: "drop-shadow(4px 4px 0px #7828C8",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                radius="sm"
                className="w-full justify-center text-purple-700 bg-white border-4 border-purple-300"
                style={{
                  filter: "drop-shadow(4px 4px 0px #7828C8",
                }}
                startContent={hideWord ? <EyeOff /> : <Eye />}
                onClick={() => setHideWord(!hideWord)}
              >
                {hideWord ? (
                  <span className="text-sm text-purple-700">Hide Word</span>
                ) : (
                  <span className="text-sm text-purple-700">Show Word</span>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                radius="sm"
                className="w-full justify-center text-purple-700 bg-white border-4 border-purple-300"
                style={{
                  filter: "drop-shadow(4px 4px 0px #7828C8",
                }}
                onPress={changeIconPair}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span className="text-sm text-purple-700">Change Icons</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* {firstCard && <h1>{firstCard.title}</h1>} */}

      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl">
        {cards?.length > 0 && (
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
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            {cards.map((card) => (
              <SwiperSlide key={card.decision_maker_id}>
                <Card
                  required
                  isRequired
                  key={card.decision_maker_id}
                  className="mx-auto w-full h-[40rem] gap-2 aspect-square overflow-hidden rounded-md bg-white shadow-lg border-4 border-purple-300 p-4"
                >
                  <CardBody className="flex flex-col gap-2 px-auto items-center justify-center">
                    <div className="flex flex-col text-center">
                      <h1 className="text-2xl text-purple-700 font-bold text-center">
                        Click that correct image
                      </h1>
                      {!hideWord ? (
                        <h1 className="text-4xl font-extrabold mb-5 text-purple-700 capitalize">
                          {card.word}
                        </h1>
                      ) : (
                        <h1 className="text-4xl font-extrabold mb-5 capitalize opacity-0">
                          {card.word}
                        </h1>
                      )}
                    </div>
                    <div className="max-w-[22rem]">
                      <Image
                        src={card.image}
                        alt={card.title}
                        className="w-full aspect-square object-cover rounded-md"
                      />
                    </div>
                  </CardBody>
                  <CardFooter className="w-full flex flex-col gap-2 pt-0">
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
                              <div className="text-white w-full bg-green-500 p-2 rounded-lg">
                                <h1 className="w-full">Correct</h1>
                              </div>
                            ) : (
                              <div className="text-purple-900 w-full bg-pink-300 p-2 rounded-lg">
                                <h1 className="w-full">Incorrect</h1>
                              </div>
                            )}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex justify-center gap-2 w-full">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Button
                          radius="sm"
                          onPress={() => handleVote(card, "positive")}
                          color="success"
                          className="w-full h-16 justify-center text-green-700 text-lg bg-white border-4 border-green-300"
                          style={{
                            filter: "drop-shadow(4px 4px 0px #22c55e",
                          }}
                        >
                          {buttonPairs[currentPairIndex].positive}
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Button
                          radius="sm"
                          onPress={() => handleVote(card, "negative")}
                          color="danger"
                          className="w-full h-16 justify-center text-red-700 text-lg bg-white border-4 border-red-300"
                          style={{
                            filter: "drop-shadow(4px 4px 0px #ef4444",
                          }}
                        >
                          {buttonPairs[currentPairIndex].negative}
                        </Button>
                      </motion.div>
                    </div>
                  </CardFooter>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </div>
  );
};

export default DecisionMaker;
