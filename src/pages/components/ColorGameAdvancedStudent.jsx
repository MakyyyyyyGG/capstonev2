import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Progress, Input } from "@nextui-org/react";
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
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;

  const [attempts, setAttempts] = useState({});
  const [feedback, setFeedback] = useState({});
  const [isGameFinished, setIsGameFinished] = useState(false);

  useEffect(() => {
    if (cards) {
      console.log(session);
      const shuffled = shuffleArray(cards);
      setShuffledCards(shuffled);
      initializeAttempts(shuffled);
      initializeFeedback(shuffled);
      getStudentTries();
    }
  }, [cards]);

  useEffect(() => {
    if (isGameFinished) {
      handleResult();
    }
  }, [isGameFinished]);

  const initializeAttempts = (shuffledCards) => {
    const initialAttempts = {};
    shuffledCards.forEach((card) => {
      initialAttempts[card.color_game_advanced_id] = 0;
    });
    setAttempts(initialAttempts);
  };

  const initializeFeedback = (shuffledCards) => {
    const initialFeedback = {};
    shuffledCards.forEach((card) => {
      initialFeedback[card.color_game_advanced_id] = "";
    });
    setFeedback(initialFeedback);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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
    const currentAttempts = attempts[card.color_game_advanced_id];
    if (currentAttempts >= 3) return;

    const images = randomizedImages[card.color_game_advanced_id] || [];
    const colors = card.color.split(",");
    const correctImageCount = colors.length;
    const correctSelectionsCount = images.filter((image, index) =>
      image.src.includes(colors[index].trim())
    ).length;

    const result =
      correctSelectionsCount === correctImageCount &&
      images.length === correctImageCount;

    const newAttempts = { ...attempts };
    newAttempts[card.color_game_advanced_id]++;
    setAttempts(newAttempts);

    const newFeedback = { ...feedback };
    if (result) {
      newFeedback[card.color_game_advanced_id] = "Correct!";
      setScore((prevScore) => prevScore + 1);
      setAnsweredQuestions((prevAnswered) => prevAnswered + 1);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else if (newAttempts[card.color_game_advanced_id] >= 3) {
      newFeedback[card.color_game_advanced_id] = "Out of attempts.";
      setAnsweredQuestions((prevAnswered) => prevAnswered + 1);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else {
      newFeedback[card.color_game_advanced_id] = `Incorrect. ${
        3 - newAttempts[card.color_game_advanced_id]
      } attempts left.`;
    }
    setFeedback(newFeedback);

    const allAnswered = Object.values(newFeedback).every(
      (fb) => fb.includes("Correct") || fb.includes("Out of attempts")
    );
    if (allAnswered) {
      setIsGameFinished(true);
    }
  };

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
    if (!session || !session.user) {
      console.error("Session or user is undefined");
      return;
    }
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
      if (response.ok) {
        alert("Game Recorded Successfully");
      }
      if (response.status === 403) {
        alert(result.message);
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
      <h1>
        Score: {score} / {shuffledCards.length}
      </h1>
      <div className="w-1/2 m-auto my-4">
        <Progress
          value={(answeredQuestions / shuffledCards.length) * 100}
          classNames={{
            value: "text-foreground/60",
          }}
          label="Progress"
          showValueLabel={true}
          color="success"
        />
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          navigation
          spaceBetween={50}
          slidesPerView={1}
          onSwiper={(swiper) => setSwiperInstance(swiper)}
        >
          {shuffledCards.map((card, index) => (
            <SwiperSlide key={card.color_game_advanced_id}>
              <div className="m-auto h-screen">
                <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
                  <CardBody className="flex flex-col gap-4">
                    <h2>{card.title}</h2>
                    <p>Color Sequence: {card.color.split(",").join(", ")}</p>
                    <p>Difficulty: {card.difficulty}</p>
                    <p>
                      Attempts left: {3 - attempts[card.color_game_advanced_id]}
                    </p>
                    <audio controls>
                      <source src={card.audio} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="w-full">{renderImages(card)}</div>
                    <div className="w-full">
                      <h1>Images that match the color sequence</h1>
                      <Droppable
                        droppableId={`droppable-${card.color_game_advanced_id}`}
                        direction="horizontal"
                      >
                        {(provided) => (
                          <ul
                            className="flex w-full"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {randomizedImages[card.color_game_advanced_id]?.map(
                              (updatedImage, index) => (
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
                              )
                            )}
                            {provided.placeholder}
                          </ul>
                        )}
                      </Droppable>
                    </div>
                    <Button
                      color="secondary"
                      isDisabled={
                        attempts[card.color_game_advanced_id] >= 3 ||
                        feedback[card.color_game_advanced_id] === "Correct!"
                      }
                      onClick={() => checkImageSequence(card)}
                    >
                      Check Sequence
                    </Button>
                    {feedback[card.color_game_advanced_id] && (
                      <p
                        className={
                          feedback[card.color_game_advanced_id] === "Correct!"
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {feedback[card.color_game_advanced_id]}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </DragDropContext>
      {isGameFinished && (
        <div className="m-auto h-screen">
          <Card className="w-1/2 h-[calc(100%-50px)] m-auto">
            <CardBody className="flex flex-col gap-4">
              <h1>Game Over!</h1>
              <h1>Your score is: {score}</h1>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ColorGamesAdvancedStudent;
