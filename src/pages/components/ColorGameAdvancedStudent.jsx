import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Progress } from "@nextui-org/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";
const ColorGamesAdvancedStudent = ({ cards }) => {
  const [showImages, setShowImages] = useState(false);
  const [randomizedImages, setRandomizedImages] = useState({});
  const [shuffledCards, setShuffledCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [checkResult, setCheckResult] = useState({});
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;

  useEffect(() => {
    setShuffledCards(shuffleArray(cards));
    // setFeedback(Array(cards.length).fill(""));
    // getStudentTries();
  }, [cards]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to render images
  const renderImages = (card) => {
    const images = card.images.split(",");
    return (
      <div className="flex w-full">
        {images.map((image, index) => (
          <div className="w-[100px] h-[100px] border-2" key={index}>
            {showImages || checkResult[card.color_game_advanced_id] ? (
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const cardId = result.source.droppableId.split("-")[1];
    const items = Array.from(randomizedImages[cardId]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRandomizedImages((prev) => ({
      ...prev,
      [cardId]: items,
    }));
  };

  const checkImageSequence = (card) => {
    const images = randomizedImages[card.color_game_advanced_id] || [];
    const colors = card.color.split(",");
    const correctImageCount = colors.length;
    const correctSelectionsCount = images.filter((image, index) =>
      image.src.includes(colors[index].trim())
    ).length;

    const result =
      correctSelectionsCount === correctImageCount &&
      images.length === correctImageCount;

    setCheckResult((prev) => ({
      ...prev,
      [card.color_game_advanced_id]: result,
    }));

    handleNextCard();
    // Update score and answer
    setAnswer((prev) => prev + 1);
    if (result) {
      setScore((prev) => prev + 1);
      alert("Correct Sequence!");
    } else {
      alert("Incorrect Sequence!");
    }
    if (answer + 1 === cards.length) {
      endGame();
    }
  };

  // Randomize images on mount
  useEffect(() => {
    const newRandomizedImages = {};
    shuffledCards.forEach((card) => {
      const images = card.images.split(",");
      const shuffledImages = images.sort(() => Math.random() - 0.5);
      newRandomizedImages[card.color_game_advanced_id] = shuffledImages.map(
        (image) => ({
          id: `${card.color_game_advanced_id}-${image}`,
          src: image,
        })
      );
    });
    setRandomizedImages(newRandomizedImages);
  }, [shuffledCards]);

  const handleNextCard = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
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
      <h1>Color Games Advanced</h1>
      <h1>Score: {score}</h1>
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
      <DragDropContext onDragEnd={handleDragEnd}>
        {shuffledCards.length > 0 && (
          <Card
            key={shuffledCards[currentCardIndex].color_game_advanced_id}
            className="w-1/2 m-auto"
          >
            <CardBody>
              <h2>{shuffledCards[currentCardIndex].title}</h2>
              <p>
                Color Sequence:{" "}
                {shuffledCards[currentCardIndex].color.split(",").join(", ")}
              </p>
              <p>Difficulty: {shuffledCards[currentCardIndex].difficulty}</p>
              <audio controls>
                <source
                  src={shuffledCards[currentCardIndex].audio}
                  type="audio/wav"
                />
                Your browser does not support the audio element.
              </audio>
              <div className="w-full">
                {renderImages(shuffledCards[currentCardIndex])}
              </div>

              <div className="w-full">
                <h1>Images that match the color sequence</h1>
                <Droppable
                  droppableId={`droppable-${shuffledCards[currentCardIndex].color_game_advanced_id}`}
                  direction="horizontal"
                >
                  {(provided) => (
                    <ul
                      className="flex w-full"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {randomizedImages[
                        shuffledCards[currentCardIndex].color_game_advanced_id
                      ]?.map((updatedImage, index) => (
                        <Draggable
                          key={updatedImage.id}
                          draggableId={updatedImage.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              {...provided.dragHandleProps}
                              {...provided.draggableProps}
                              ref={provided.innerRef}
                              className="w-[100px] h-[100px] border-2 "
                            >
                              <img
                                src={updatedImage.src}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </div>

              <Button
                color="secondary"
                isDisabled={
                  checkResult[
                    shuffledCards[currentCardIndex].color_game_advanced_id
                  ] !== undefined
                }
                onClick={() =>
                  checkImageSequence(shuffledCards[currentCardIndex])
                }
              >
                Check Sequence
              </Button>
              {checkResult[
                shuffledCards[currentCardIndex].color_game_advanced_id
              ] !== undefined && (
                <span>
                  {checkResult[
                    shuffledCards[currentCardIndex].color_game_advanced_id
                  ] ? (
                    <h1 className="text-green-500">Correct Sequence!</h1>
                  ) : (
                    <h1 className="text-red-500">Incorrect Sequence!</h1>
                  )}
                </span>
              )}
              <div className="flex justify-between mt-4">
                <Button
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextCard}
                  disabled={currentCardIndex === shuffledCards.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </DragDropContext>
    </div>
  );
};

export default ColorGamesAdvancedStudent;
