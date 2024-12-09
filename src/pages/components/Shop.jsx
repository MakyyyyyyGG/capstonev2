import React, { useState, useEffect, useRef } from "react";
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
  Chip,
  Select,
  SelectItem,
  Image,
  useDisclosure,
  CircularProgress,
} from "@nextui-org/react";
import {
  ShoppingCart,
  X,
  Clock,
  PartyPopper,
  Zap,
  Snowflake,
  Star,
  Atom,
  Coins,
} from "lucide-react";
import { RiTyphoonFill } from "react-icons/ri";
import Confetti from "react-confetti";
import ConfettiFirework from "./ConfettiFirework";
import ConfettiCrossfire from "./ConfettiCrossfire";
import ConfettiSnow from "./ConfettiSnow";
import ConfettiVortex from "./ConfettiVortex";
import ConfettiStar from "./ConfettiExplosion";
import ConfettiPhotons from "./ConfettiPhotons";
import ConfettiRealistic from "./ConfettiRealistic";
import { useSession } from "next-auth/react";
import useUserStore from "../api/coins_exp/useUserStore";
import { color, motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import toast, { Toaster } from "react-hot-toast";

const Shop = () => {
  const { data: session } = useSession();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVariant, setSelectedVariant] = useState("default");
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { updateCoinsExp } = useUserStore(); // Get the update function from the store
  const confettiInstance = useRef(null);

  useEffect(() => {
    let timer;
    if (showConfetti) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowConfetti(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showConfetti]);

  const handleSelectVariant = (variant, price) => {
    setSelectedVariant(variant);
    handleBuy(variant, price);
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
      if (response.status === 400) {
        toast.error(data.message);
      } else {
        updateCoinsExp(data.coins, null);
        toast.success("Purchase successful!");
        setShowConfetti(true);
      }
    } catch (error) {
      toast.error("Error buying: " + error.message);
      console.error("Error buying:", error);
    }
  };

  const handleStopConfetti = () => {
    setShowConfetti(false);
    setCountdown(60);
  };

  const variants = [
    {
      price: 1,
      duration: 60,
      key: "default",
      label: "Default Confetti",
      color: "bg-[#FF5E5E]",
      icon: <PartyPopper size={40} />,
    },
    {
      price: 100,
      duration: 60,
      key: "fireworks",
      label: "Fireworks",
      color: "bg-[#B558F6]",
      icon: <Zap size={40} />,
    },
    {
      price: 100,
      duration: 60,
      key: "snow",
      label: "Snow",
      color: "bg-[#48C1E3]",
      icon: <Snowflake size={40} />,
    },
    {
      price: 100,
      duration: 60,
      key: "stars",
      label: "Stars",
      color: "bg-[#F5D259]",
      icon: <Star size={40} />,
    },
    {
      price: 100,
      duration: 60,
      key: "vortex",
      label: "Vortex",
      color: "bg-[#8CE563]",
      icon: <RiTyphoonFill className="w-12 h-12" />,
    },
    {
      price: 100,
      duration: 60,
      key: "photons",
      label: "Photons",
      color: "bg-[#FF7C5E]",
      icon: <Atom size={40} />,
    },
  ];

  const renderSelectedConfetti = () => {
    switch (selectedVariant) {
      case "default":
        return <ConfettiRealistic />;
      case "fireworks":
        return <ConfettiFirework />;
      case "snow":
        return <ConfettiSnow />;
      case "stars":
        return <ConfettiStar />;
      case "vortex":
        return <ConfettiVortex />;
      case "photons":
        return <ConfettiPhotons />;
      default:
        return null;
    }
  };

  return (
    <>
      <Toaster />
      {showConfetti && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-50 pointer-events-none bg-black/40"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="fixed bottom-0 right-0 transform -translate-x-1/2 text-purple-700 bg-white rounded-full -translate-y-1/2 px-3 py-3 text-2xl font-bold flex flex-col items-center m-4"
            >
              <Button
                color="secondary"
                className="pointer-events-auto h-12 rounded-full bg-white border-4 border-purple-700 text-purple-700"
                onClick={handleStopConfetti}
              >
                {/* <CircularProgress
                  aria-label="Countdown"
                  formatOptions={{ style: "unit", unit: "second" }}
                  color="warning"
                  showValueLabel={true}
                  size="lg"
                  value={countdown}
                /> */}
                <span className="text-2xl">{countdown}s</span>
                <X className="font-bold text-purple-700" />
              </Button>
            </motion.div>
            {renderSelectedConfetti()}
          </motion.div>
        </AnimatePresence>
      )}
      <div>
        <Button
          color="secondary"
          radius="sm"
          onPress={onOpen}
          className="w-full justify-center text-white bg-emerald-500"
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Buy Effects
        </Button>

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="5xl"
          position="center"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>
              <h1 className="w-full text-3xl font-bold text-center py-2">
                Shop
              </h1>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((variant) => (
                  <Card
                    key={variant.key}
                    className="w-full rounded-lg overflow-hidden p-0"
                    isPressable
                  >
                    <CardHeader className="p-6 w">
                      <div className="flex justify-between items-start w-full">
                        <div className="flex flex-col text-left">
                          <h1 className="text-xl font-bold">{variant.label}</h1>
                          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                            <Clock className="w-4 h-4" />
                            <span>{variant.duration} Seconds</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 border border-purple-500 rounded-full bg-purple-500/10 p-1 px-2 ">
                          <Coins className="w-5 h-5" color="gold" />
                          <span className="text-lg font-bold">
                            {variant.price}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="relative group p-6 pt-0">
                      <div
                        className={`rounded-lg w-full h-28 flex items-center justify-center ${variant.color}`}
                      >
                        {variant.icon}
                      </div>
                    </CardBody>
                    <CardFooter className="p-6 pt-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            color="secondary"
                            radius="sm"
                            className="w-full group-hover:shadow-lg transition-all duration-300"
                          >
                            Buy Now
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <h2>Confirm Purchase</h2>
                            <p>
                              Are you sure you want to buy {variant.label} for{" "}
                              {variant.price} coins?
                            </p>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleSelectVariant(variant.key, variant.price)
                              }
                            >
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
};

export default Shop;
