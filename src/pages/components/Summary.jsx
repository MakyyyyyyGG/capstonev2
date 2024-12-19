import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Select,
  SelectItem,
  Modal,
  ModalContent,
} from "@nextui-org/react";
import {
  Trophy,
  Home,
  BarChart3,
  ArrowLeft,
  NotepadText,
  Coins,
} from "lucide-react";
import { useRouter } from "next/router";
import ConfettiCanvas from "react-canvas-confetti";
import Shop from "@/pages/components/Shop";
import ConfettiCoins from "./ConfettiCoins";
import ConfettiExp from "./ConfettiExp";
import useUserStore from "../api/coins_exp/useUserStore";

const Summary = ({
  gameRecord = [],
  questions = 0,
  rewards = { coins: 0, exp: 0, bonus: 0 },
}) => {
  const router = useRouter();
  const { updateCoinsExp } = useUserStore(); // Get the update function from the store

  const { data: session, status } = useSession();
  // Add default values for both props
  const currentMonth = new Date().toLocaleString("default", { month: "short" });
  const currentYear = new Date().getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasUpdatedCoins, setHasUpdatedCoins] = useState(false);
  const [showChestConfetti, setShowChestConfetti] = useState(false); // State for chest confetti

  // Prepare data for the LineChart
  const chartData = (gameRecord || []) // Add null check with empty array fallback
    .filter((record) => {
      const date = new Date(record.created_at);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear().toString();
      const monthMatch = selectedMonth === "All" || month === selectedMonth;
      const yearMatch = selectedYear === "All" || year === selectedYear;
      return monthMatch && yearMatch;
    })
    .map((record, index) => {
      const date = new Date(record.created_at);
      const month = date.toLocaleString("default", { month: "short" });
      return {
        name: `Attempt ${index + 1} (${month})`,
        Score: ((record.score / questions) * 100).toFixed(2), // Convert to percentage and limit to 2 decimals
      };
    });

  // Calculate summary statistics from filtered data
  const totalAttempts = chartData.length;
  const totalCorrect = chartData.reduce(
    (sum, record) => sum + (record.Score * questions) / 100,
    0
  );
  const totalWrong = totalAttempts * questions - totalCorrect;
  const averageAccuracy =
    totalAttempts > 0
      ? ((totalCorrect / (totalAttempts * questions)) * 100).toFixed(2)
      : 0;

  // Get unique months and years from gameRecord with null check
  const uniqueMonths = [
    ...new Set(
      (gameRecord || []).map((record) =>
        new Date(record.created_at).toLocaleString("default", {
          month: "short",
        })
      )
    ),
  ];

  const uniqueYears = [
    ...new Set(
      (gameRecord || []).map((record) =>
        new Date(record.created_at).getFullYear().toString()
      )
    ),
  ];

  // Get the latest score from gameRecord
  const latestScore =
    gameRecord && gameRecord.length > 0
      ? gameRecord[gameRecord.length - 1].score
      : 0;

  const incorrectAnswers = questions - latestScore;
  const totalScore = latestScore; // Use the actual score
  const accuracy = ((latestScore / questions) * 100).toFixed(0); // Calculate accuracy as a percentage

  const [showEndScreen, setShowEndScreen] = useState(false); // State to toggle end screen visibility
  const [showSummary, setShowSummary] = useState(false); // State to toggle summary visibility

  const applauseRef = useRef(null); // Reference to the applause audio
  const openChestRef = useRef(null); // Reference to the open chest audio
  const coinsSfxRef = useRef(null); // Reference to the coins sfx audio

  // Preload chest images
  useEffect(() => {
    const preloadImage = (src) => {
      const img = new Image();
      img.src = src;
    };

    preloadImage("/chest/closechest.png");
    preloadImage("/chest/openchest.png");
  }, []);

  // Play applause sound when the score is 10 and the end screen is shown
  useEffect(() => {
    if (showEndScreen && totalScore === questions) {
      applauseRef.current.play();
    }
  }, [showEndScreen, totalScore]);

  //api call to update the coins and exp of the student
  const updateCoinsExpInDatabase = async () => {
    if (hasUpdatedCoins || !session?.user?.id) return; // Skip if already updated or no user ID

    const account_id = session.user.id;
    try {
      const response = await fetch(
        `/api/coins_exp/coins_exp?account_id=${account_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_id: account_id,
            coins: rewards.coins + rewards.bonus,
            exp: rewards.exp,
            // bonus: rewards.bonus,
            score: latestScore,
          }),
        }
      );
      const data = await response.json();
      console.log("Coins and exp updated:", data);

      // Update Zustand store with the new values after a successful response
      if (response.ok) {
        updateCoinsExp(data.coins, data.exp);
        console.log("Coins and exp updated:", data.coins, data.exp);
        setHasUpdatedCoins(true); // Mark as updated
      }
    } catch (error) {
      console.error("Error updating coins and exp:", error);
    }
  };

  useEffect(() => {
    if (!hasUpdatedCoins && session?.user?.id) {
      updateCoinsExpInDatabase();
    }
  }, [session, hasUpdatedCoins]);

  const [showChest, setShowChest] = useState(true);
  const [isChestOpened, setIsChestOpened] = useState(false);

  const handleChestClick = () => {
    setIsChestOpened(true);
    openChestRef.current.play(); // Play open chest sound
    coinsSfxRef.current.play(); // Play coin sfx sound

    // Trigger confetti for chest opening
    setShowChestConfetti(true);
    setTimeout(() => setShowChestConfetti(false), 1200);

    setTimeout(() => {
      setShowChest(false);
      setShowEndScreen(true);
    }, 1000);
  };

  return (
    <div>
      <AnimatePresence>
        <audio
          ref={openChestRef}
          src="/soundfx/audio/openchest.mp3"
          preload="auto"
        />
        <audio
          ref={coinsSfxRef}
          src="/soundfx/audio/coinsfx.mp3"
          preload="auto"
        />
        {showChest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-[44%] left-[45%] -translate-x-1/2 -translate-y-1/2"
            >
              {showChestConfetti && (
                <>
                  <ConfettiCoins className="z-20" />
                  <ConfettiExp className="z-20" />
                </>
              )}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }} // Pulsating effect
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleChestClick}
                className="h-40 w-40 cursor-pointer"
              >
                {/* Closed chest - show before click */}
                {!isChestOpened && (
                  <motion.img
                    src="/chest/closechest.png"
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: isChestOpened ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                    alt="Closed Chest"
                  />
                )}

                {/* Open chest - show after click with shake effect */}
                {isChestOpened && (
                  <motion.img
                    src="/chest/openchest.png"
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{
                      scale: 1.05,
                      rotate: [0, -5, 5, -5, 5, 0], // Shake animation
                    }}
                    transition={{ duration: 0.6 }}
                    alt="Open Chest"
                  />
                )}
              </motion.div>
              {/* Text to indicate action */}
              {/* {!isChestOpened && (
                <h1 className="text-purple-700 text-center mt-2 text-xl font-bold">
                  Click the chest to open
                </h1>
              )} */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEndScreen && (
          <>
            {/* Confetti on top of end screen */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
              {/* Conditionally render confetti if score is 10 */}
              {accuracy === "100" && (
                <motion.div
                  key="confetti"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Confetti gravity={0.03} />
                </motion.div>
              )}

              {/* Applause sound effect */}
              <audio
                ref={applauseRef}
                src="/soundfx/audio/applause.mp3"
                preload="auto"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md"
              >
                <Card className="p-6 border-0 shadow-lg">
                  <CardHeader className="flex-col text-center space-y-4 pb-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="mx-auto bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center"
                    >
                      <Trophy className="h-8 w-8 text-purple-600" />
                    </motion.div>
                    <h1 className="text-3xl font-bold">Game Completed</h1>
                    <h1>
                      {rewards.coins} coins and {rewards.exp} exp +{" "}
                      {rewards.bonus} bonus
                    </h1>
                  </CardHeader>

                  <CardBody className="text-center space-y-6 pt-4">
                    <p className="text-muted-foreground">Thanks for playing!</p>

                    <div className="grid grid-cols-3 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-emerald-50 px-4 py-5 rounded-md"
                      >
                        <div className="text-2xl font-bold text-emerald-600">
                          {latestScore}
                        </div>
                        <div className="text-sm text-emerald-600">Correct</div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-rose-50 px-4 py-5 rounded-md"
                      >
                        <div className="text-2xl font-bold text-rose-600">
                          {incorrectAnswers}
                        </div>
                        <div className="text-sm text-rose-600">Incorrect</div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-purple-50 px-4 py-5 rounded-md"
                      >
                        <div className="text-2xl font-bold text-purple-600">
                          {accuracy}%
                        </div>
                        <div className="text-sm text-purple-600">Accuracy</div>
                      </motion.div>
                    </div>
                  </CardBody>

                  <CardFooter className="flex flex-col gap-3 pt-6">
                    <div className="w-full">
                      <Shop aria-label="Shop" />
                    </div>
                    <Button
                      onClick={() => {
                        setShowEndScreen(false); // Hide end screen
                        setShowSummary(true); // Show summary
                      }}
                      radius="sm"
                      color="secondary"
                      className="w-full"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Summary
                    </Button>
                    {/* <Button
                      color="success"
                      variant="flat"
                      className="w-full"
                      radius="sm"
                      onClick={() => setShowSurvey(true)}
                    >
                      <NotepadText className="h-4 w-4 mr-2" />
                      Answer Survey (Please 😭)
                    </Button> */}
                    <Button
                      variant="outline"
                      radius="sm"
                      className="w-full"
                      onClick={() => router.back()}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Return Home
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Survey Modal */}
      <Modal
        isOpen={showSurvey}
        onClose={() => setShowSurvey(false)}
        size="full"
        scrollBehavior="outside"
        className="m-0 p-0"
      >
        <ModalContent className="h-screen m-0 p-0">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSdZFX_ZuLu1T813AkAivQy7j0bR-_yfUmb4oV-x2aHKuCU9WQ/viewform?embedded=true"
            className="w-full h-full border-0"
          />
        </ModalContent>
      </Modal>

      {/* Game Performance Summary */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl"
          >
            <Card className="p-6 border-0 shadow-lg">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Game Performance Summary</h1>
                <Button
                  radius="sm"
                  color="secondary"
                  classNames={{
                    base: "text-purple-500 hover:bg-purple-50",
                  }}
                  onClick={() => {
                    setShowSummary(false);
                    setShowEndScreen(true);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-emerald-50 px-4 py-5 rounded-md"
                >
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(totalCorrect)}
                  </div>
                  <div className="text-sm text-emerald-600">Total Correct</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-rose-50 px-4 py-5 rounded-md"
                >
                  <div className="text-2xl font-bold text-rose-600">
                    {Math.round(totalWrong)}
                  </div>
                  <div className="text-sm text-rose-600">Total Wrong</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-purple-50 px-4 py-5 rounded-md"
                >
                  <div className="text-2xl font-bold text-purple-600">
                    {averageAccuracy}%
                  </div>
                  <div className="text-sm text-purple-600">
                    Average Accuracy
                  </div>
                </motion.div>
              </div>
              <div className="flex flex-col gap-4 py-4 border  rounded-xl mt-6">
                <h3 className="text-lg font-bold text-center">Accuracy</h3>
                <div className="flex justify-center gap-4 items-center max-sm:flex-col max-sm:gap-2">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="monthFilter"
                      className="text-nowrap text-sm"
                    >
                      Filter by Month:
                    </label>
                    <Select
                      size="sm"
                      radius="sm"
                      variant="bordered"
                      id="monthFilter"
                      defaultSelectedKeys={["Nov"]}
                      className="w-[100px]"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {/* <SelectItem value="All">All</SelectItem> */}
                      {uniqueMonths.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label htmlFor="yearFilter" className="text-nowrap text-sm">
                      Filter by Year:
                    </label>
                    <Select
                      size="sm"
                      radius="sm"
                      id="yearFilter"
                      variant="bordered"
                      defaultSelectedKeys={["2024"]}
                      className="w-[100px]"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {/* <SelectItem value="All">All</SelectItem> */}
                      {uniqueYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center"
                >
                  <LineChart
                    width={480}
                    height={250}
                    data={chartData}
                    margin={{ top: 30, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Score"
                      stroke="#8884d8"
                      activeDot={{ r: 13 }}
                      label={{
                        position: "top",
                        offset: 10,
                        formatter: (value) => `${value}%`,
                      }}
                    />
                  </LineChart>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Summary;
