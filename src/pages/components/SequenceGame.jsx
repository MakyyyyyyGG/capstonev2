import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
} from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, RefreshCw, Pause, Volume2 } from "lucide-react";
import Loader from "./Loader";

const SequenceGame = ({ sequenceGame }) => {
  console.log("sequenceGame", sequenceGame);
  // Add null check for sequenceGame prop
  if (!sequenceGame) {
    return <div>Loading...</div>;
  }

  const [gameData, setGameData] = useState(sequenceGame);
  const [selectedImages, setSelectedImages] = useState([]);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [stepResults, setStepResults] = useState([]);
  const [removedIndex, setRemovedIndex] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const [isPlaying, setIsPlaying] = useState(
    Array(sequenceGame.length).fill(false)
  );
  const audioRefs = useRef([]);

  const handleAudioToggle = (index) => {
    if (audioRefs.current[index]) {
      if (isPlaying[index]) {
        audioRefs.current[index].pause();
      } else {
        audioRefs.current[index].play();
      }
      setIsPlaying((prev) => {
        const newPlayingState = [...prev];
        newPlayingState[index] = !newPlayingState[index];
        return newPlayingState;
      });
    }
  };

  useEffect(() => {
    if (sequenceGame) {
      setGameData(sequenceGame);
      console.log("game Data", gameData);

      // Load all images
      const imagePromises = sequenceGame.map((item) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = item.image;
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
  }, [sequenceGame]);

  const getRandomPosition = (index, totalImages) => {
    const gridSize = Math.ceil(Math.sqrt(totalImages));
    const cellSize = 100 / gridSize;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    return {
      top: `${row * cellSize + Math.random() * (cellSize / 2)}%`,
      left: `${col * cellSize + Math.random() * (cellSize / 2)}%`,
    };
  };

  const randomPositions = useMemo(() => {
    return gameData.map((_, index) =>
      getRandomPosition(index, gameData.length)
    );
  }, [gameData]);

  const handleImageSelect = (image) => {
    const imageIndex = selectedImages.indexOf(image);
    if (imageIndex !== -1) {
      handleRemoveImage(imageIndex);
    } else if (removedIndex !== null) {
      setSelectedImages((prev) => {
        const newImages = [...prev];
        newImages[removedIndex] = image;
        return newImages;
      });
      setRemovedIndex(null);
    } else {
      setSelectedImages((prev) => {
        const availableIndex = prev.findIndex((img) => img === null);
        if (availableIndex !== -1) {
          const newImages = [...prev];
          newImages[availableIndex] = image;
          return newImages;
        } else {
          return [...prev, image];
        }
      });
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
    setStepResults((prev) => {
      const newResults = [...prev];
      newResults[index] = undefined;
      return newResults;
    });
    setRemovedIndex(index);
  };

  const handleCheckStep = (index) => {
    const isCorrect = selectedImages[index] === sequenceGame[index].image;
    setStepResults((prev) => {
      const newResults = [...prev];
      newResults[index] = isCorrect;
      return newResults;
    });
  };

  const handleReset = () => {
    setSelectedImages([]);
    setStepResults([]);
    setRemovedIndex(null);
  };

  if (!imagesLoaded) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 max-w-[80rem] mx-auto">
      {gameData && gameData.length > 0 && gameData[0].video && (
        <>
          <div
            className="flex w-full max-w-[80rem] mx-auto justify-between items-center bg-white border-4 border-purple-300 rounded-md p-1 mb-4"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <div className="aspect-video w-full max-w-[80rem] max-h-[300px] rounded-md overflow-hidden 'bg-black'">
              {gameData[0].video.includes("youtube") ? (
                <iframe
                  src={gameData[0].video}
                  frameBorder="0"
                  allowFullScreen
                  title="Sequence Game Video"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={gameData[0].video}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
          {/* <h1>{gameData[0].title}</h1> */}
        </>
      )}
      <div className="flex justify-center items-center">
        <div className="w-full max-w-[80rem] grid md:grid-cols-2 gap-3">
          <Card
            className="bg-white border-4 border-purple-300 rounded-md p-4 max-md:h-96"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <CardHeader>
              <h1 className="text-xl text-purple-700 font-bold">
                Available Steps
              </h1>
            </CardHeader>
            <CardBody className="relative border-2 border-purple-300 rounded-md shadow-inner">
              {sequenceGame.map(
                (item, index) =>
                  !selectedImages.includes(item.image) && (
                    <motion.div
                      key={index}
                      style={randomPositions[index]}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleImageSelect(item.image)}
                      className="absolute w-24 h-24 m-4 aspect-square rounded-md overflow-hidden border border-purple-300"
                    >
                      <img
                        src={item.image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                      />
                    </motion.div>
                  )
              )}
            </CardBody>
          </Card>
          <Card
            className="bg-white border-4 border-purple-300 p-4 rounded-md"
            style={{
              filter: "drop-shadow(4px 4px 0px #7828C8",
            }}
          >
            <CardHeader>
              <h1 className="text-xl text-purple-700 font-bold">
                Arrange the Sequence
              </h1>
            </CardHeader>
            <CardBody className="flex flex-col gap-3">
              {sequenceGame.map((item, index) => (
                <Card
                  key={index}
                  className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg  shadow-sm border-4 border-purple-300"
                >
                  <div className="flex w-full gap-4 justify-between items-center">
                    <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                      {selectedImages[index] ? (
                        <motion.img
                          src={selectedImages[index]}
                          alt={`Selected Image ${index + 1}`}
                          className="w-24 h-24 object-cover"
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Step {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-700">
                        Step {index + 1}
                      </h3>
                      <p className="text-sm text-purple-500">{item.step}</p>
                    </div>

                    {item.audio && (
                      <>
                        <div className="absolute top-1 right-1">
                          <Button
                            isIconOnly
                            radius="sm"
                            onClick={() => handleAudioToggle(index)}
                            className="p-2 bg-transparent text-purple-500 hover:text-purple-700"
                          >
                            {isPlaying[index] ? (
                              <Pause className="h-[22px] w-[22px]" />
                            ) : (
                              <Volume2 className="h-[22px] w-[22px]" />
                            )}
                          </Button>
                          <audio
                            ref={(el) => (audioRefs.current[index] = el)}
                            src={item.audio}
                            onEnded={() =>
                              setIsPlaying((prev) => {
                                const newPlayingState = [...prev];
                                newPlayingState[index] = false;
                                return newPlayingState;
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {selectedImages[index] && (
                      <>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            radius="sm"
                            variant="flat"
                            onClick={() => handleRemoveImage(index)}
                            className="w-full justify-center text-gray-700 bg-white border-4 border-gray-300"
                            style={{
                              filter: "drop-shadow(4px 4px 0px #6b7280",
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            radius="sm"
                            variant="flat"
                            color="success"
                            onClick={() => handleCheckStep(index)}
                            className="w-full justify-center text-green-700 bg-white border-4 border-green-300"
                            style={{
                              filter: "drop-shadow(4px 4px 0px #22c55e",
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <AnimatePresence>
                    {stepResults[index] !== undefined && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex w-full text-center justify-center rounded-md"
                      >
                        <p
                          className={`text-purple-900 w-full p-2 rounded-md ${
                            stepResults[index] ? "bg-green-500" : "bg-pink-300"
                          }`}
                        >
                          {stepResults[index] ? "Correct!" : "Incorrect!"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </CardBody>

            <CardFooter className="flex justify-between items-center py-4">
              <Button
                onClick={handleReset}
                variant="bordered"
                radius="sm"
                className="justify-center text-purple-700 bg-white border-4 border-purple-300"
                style={{
                  filter: "drop-shadow(4px 4px 0px #7828C8",
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Reset
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SequenceGame;
