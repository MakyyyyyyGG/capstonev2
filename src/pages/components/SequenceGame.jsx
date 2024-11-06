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

const SequenceGame = ({ sequenceGame }) => {
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

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      {gameData && gameData.length > 0 && gameData[0].video && (
        <>
          <div className="flex w-full justify-center">
            <div className="aspect-video w-full max-w-[50rem] max-h-[300px] rounded-lg overflow-hidden 'bg-black'">
              <iframe
                src={gameData[0].video}
                frameBorder="0"
                allowFullScreen
                title="Sequence Game Video"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* <h1>{gameData[0].title}</h1> */}
        </>
      )}
      <div className="flex justify-center items-center">
        <div className="w-full max-w-[50rem] grid md:grid-cols-2 gap-3">
          <Card className="p-4 max-md:h-96">
            <CardHeader>
              <h1 className="text-xl font-bold">Available Steps</h1>
            </CardHeader>
            <CardBody className="relative border rounded-lg shadow-inner">
              {sequenceGame.map(
                (item, index) =>
                  !selectedImages.includes(item.image) && (
                    <motion.div
                      key={index}
                      style={randomPositions[index]}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleImageSelect(item.image)}
                      className="absolute w-24 h-24 m-4 aspect-square rounded-lg overflow-hidden border"
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
          <Card className="p-4">
            <CardHeader>
              <h1 className="text-xl font-bold">Arrange the Sequence</h1>
            </CardHeader>
            <CardBody className="flex flex-col gap-3">
              {sequenceGame.map((item, index) => (
                <Card
                  key={index}
                  className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border shadow-sm"
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
                      <h3 className="font-medium">Step {index + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.step}
                      </p>
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
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
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
                        <div className="flex gap-1">
                          <Button
                            isIconOnly
                            radius="sm"
                            variant="flat"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            radius="sm"
                            variant="flat"
                            color="success"
                            onClick={() => handleCheckStep(index)}
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
                          className={`text-white w-full p-2 rounded-md ${
                            stepResults[index] ? "bg-green-500" : "bg-red-500"
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
              <Button onClick={handleReset} variant="bordered" radius="sm">
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
