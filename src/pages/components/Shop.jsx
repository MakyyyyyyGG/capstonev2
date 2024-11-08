import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Select,
  SelectItem,
  Image,
  useDisclosure,
} from "@nextui-org/react";
import { ShoppingCart, XCircle } from "lucide-react";
import Confetti from "react-confetti";
import { useSession } from "next-auth/react";
import useUserStore from "../api/coins_exp/useUserStore";
const Shop = () => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVariant, setSelectedVariant] = useState("default");
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { updateCoinsExp } = useUserStore(); // Get the update function from the store

  useEffect(() => {
    let timer;
    if (showConfetti) {
      // Start countdown from 60
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowConfetti(false);
            return 60; // Reset to 60 when done
          }
          return prev - 1;
        });
      }, 1000);

      // Start confetti after 60 seconds
      const confettiTimer = setTimeout(() => {
        setShowConfetti(true);
      }, 60000);

      return () => {
        clearInterval(timer);
        clearTimeout(confettiTimer);
      };
    }
  }, [showConfetti]);

  const handleSelectVariant = (variant, price) => {
    setSelectedVariant(variant);
    handleBuy(variant, price);
    setShowConfetti(true);
    onClose();
  };

  const handleBuy = async (variant, price) => {
    const account_id = session?.user?.id;
    console.log("selectedVariant", variant);
    console.log("price", price);

    try {
      const response = await fetch(
        `/api/coins_exp/coins_exp?account_id=${account_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ account_id, price }),
        }
      );
      const data = await response.json();
      console.log("data", data);
      updateCoinsExp(data.coins, null);
    } catch (error) {
      console.error("Error buying:", error);
    }
  };

  const handleStopConfetti = () => {
    setShowConfetti(false);
    setCountdown(60);
  };

  const variants = [
    {
      price: 100,
      duration: 60,
      key: "default",
      label: "Default Confetti",
      config: {
        colors: ["#ff0000", "#00ff00", "#0000ff"],
        gravity: 0.03,
      },
    },
    {
      price: 100,
      duration: 60,
      key: "fireworks",
      label: "Fireworks",
      config: {
        colors: ["#FFD700", "#FF6B6B", "#4ECDC4"],
        gravity: 0.1,
        explosion: true,
        numberOfPieces: 200,
      },
    },
    {
      price: 100,
      duration: 60,
      key: "snow",
      label: "Snow",
      config: {
        colors: ["#ffffff"],
        gravity: 0.1,
        wind: 2,
        numberOfPieces: 100,
      },
    },
    {
      price: 100,
      duration: 60,
      key: "stars",
      label: "Stars",
      config: {
        colors: ["#FFD700", "#FFFFFF"],
        shapes: ["star"],
        gravity: 0.05,
        numberOfPieces: 50,
      },
    },
  ];

  const getConfettiConfig = () => {
    const variant = variants.find((v) => v.key === selectedVariant);
    return variant ? variant.config : variants[0].config;
  };

  return (
    <div>
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-700/80 px-8 py-4 rounded-full text-2xl font-bold flex flex-col items-center">
            {countdown}s
            <Button
              isIconOnly
              color="danger"
              className="mt-2 pointer-events-auto"
              onClick={handleStopConfetti}
            >
              <XCircle />
            </Button>
          </div>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            {...getConfettiConfig()}
          />
        </div>
      )}

      <Button isIconOnly variant="light" onPress={onOpen}>
        <ShoppingCart size={24} />
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalContent>
          <ModalHeader>Shop</ModalHeader>
          <ModalBody>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {variants.map((variant) => (
                <Card
                  key={variant.key}
                  className="w-[300px] hover:scale-105 transition-transform"
                  isPressable
                  onPress={() =>
                    handleSelectVariant(variant.key, variant.price)
                  }
                >
                  <CardHeader>
                    <div className="flex justify-between items-center w-full">
                      <div className="flex  flex-col text-left">
                        <h1 className="text-xl font-bold">{variant.label}</h1>
                        <span>price: {variant.price} Coins</span>
                        <span>duration: {variant.duration} Seconds</span>
                      </div>
                      <Button
                        color="secondary"
                        variant="bordered"
                        radius="sm"
                        onPress={() =>
                          handleSelectVariant(variant.key, variant.price)
                        }
                      >
                        Buy Now
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="relative group">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src={`/confetti/confetti.gif`}
                        alt={variant.label}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <Image
                      src={`/confetti/${variant.key}.gif`}
                      alt={variant.label}
                      className="w-full h-48 object-cover"
                    />
                  </CardBody>
                </Card>
              ))}
            </div>
          </ModalBody>
          {/* <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={onClose}>
              Save
            </Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Shop;
