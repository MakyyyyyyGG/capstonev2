import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody, Button, CardHeader } from "@nextui-org/react";
import { motion } from "framer-motion";

const SequenceGameStudent = ({ sequenceGame }) => {
  const [gameData, setGameData] = useState(sequenceGame);
  const [selectedImages, setSelectedImages] = useState([]);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [stepResults, setStepResults] = useState([]);
  const [removedIndex, setRemovedIndex] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [score, setScore] = useState(0);

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
      newResults[index] = isCorrect ? "Correct!" : "Incorrect!";
      return newResults;
    });

    setAttempts((prev) => {
      const newAttempts = [...prev];
      newAttempts[index] = (newAttempts[index] || 0) + 1;
      return newAttempts;
    });

    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else if (attempts[index] >= 2) {
      setStepResults((prev) => {
        const newResults = [...prev];
        newResults[index] = false;
        return newResults;
      });
    }
  };

  const handleReset = () => {
    setSelectedImages([]);
    setStepResults([]);
    setRemovedIndex(null);
    setAttempts([]);
    setScore(0);
  };

  return (
    <div>
      {gameData && gameData.length > 0 && gameData[0].video && (
        <>
          <iframe
            src={gameData[0].video}
            frameBorder="0"
            width="100%"
            height="400"
            allowFullScreen
            title="Sequence Game Video"
          />
          <h1>{gameData[0].title}</h1>
        </>
      )}
      <div className="grid grid-cols-2 w-full">
        <div className="border-2 border-gray-300 rounded-md p-4 relative h-[600px] w-[600px]">
          {sequenceGame.map(
            (item, index) =>
              !selectedImages.includes(item.image) && (
                <motion.div
                  key={index}
                  className="absolute"
                  style={randomPositions[index]}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleImageSelect(item.image)}
                >
                  <img
                    src={item.image}
                    alt={`Image ${index + 1}`}
                    className="w-24 h-24 object-cover cursor-pointer"
                  />
                </motion.div>
              )
          )}
        </div>
        <div>
          <div className="border-2 p-4">
            {sequenceGame.map((item, index) => (
              <Card key={index}>
                <CardBody>
                  <p>Step {index + 1}</p>
                  {item.audio && <audio src={item.audio} controls />}
                  <p>{item.step}</p>
                  {/* display the available attems here */}
                  <div>
                    {selectedImages[index] ? (
                      <motion.img
                        src={selectedImages[index]}
                        alt={`Selected Image ${index + 1}`}
                        className="w-24 h-24 object-cover"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    ) : (
                      <div className="w-24 h-24 border-2 border-gray-300 flex items-center justify-center">
                        <p>Placeholder</p>
                      </div>
                    )}
                    {selectedImages[index] && (
                      <>
                        <Button
                          onClick={() => handleRemoveImage(index)}
                          isDisabled={
                            attempts[index] >= 3 ||
                            stepResults[index] === "Correct!"
                          }
                        >
                          Remove
                        </Button>
                        <Button
                          onClick={() => handleCheckStep(index)}
                          //disbaled if its correct or attempts are over
                          isDisabled={
                            stepResults[index] === "Correct!" ||
                            attempts[index] >= 3
                          }
                        >
                          Check
                        </Button>
                      </>
                    )}
                    {stepResults[index] !== undefined && (
                      <p>
                        {stepResults[index] === "Correct!"
                          ? "Correct!"
                          : attempts[index] >= 3
                          ? "Incorrect! No more attempts."
                          : `Incorrect! Try again. Attempts left: ${
                              3 - attempts[index]
                            }`}
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
            <Button onClick={handleReset}>Reset</Button>
            <p>Score: {score}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceGameStudent;
