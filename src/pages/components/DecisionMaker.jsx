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
} from "@nextui-org/react";

import {
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
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
    <div>
      {firstCard && <h1>{firstCard.title}</h1>}
      <Button variant="flat" color="secondary" onPress={changeIconPair}>
        Change Icons
      </Button>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.decision_maker_id}>
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
                >
                  {buttonPairs[currentPairIndex].positive}
                </Button>
                <Button
                  onPress={() => handleVote(card, "negative")}
                  color="danger"
                  variant="flat"
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
        ))}
      </div>
    </div>
  );
};

export default DecisionMaker;
