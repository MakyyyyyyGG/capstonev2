import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Image,
  Input,
  Checkbox,
  Button,
  Progress,
} from "@nextui-org/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import "swiper/swiper-bundle.css";
const ColorGames = ({ cards }) => {
  // console.log(cards);
  const [selectedImages, setSelectedImages] = useState([]);
  const [correctSelections, setCorrectSelections] = useState({});
  const [submissionResults, setSubmissionResults] = useState({});
  const [shuffledCards, setShuffledCards] = useState([]);
  const [feedback, setFeedback] = useState(Array(cards.length).fill(""));
  const [answer, setAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { game_id } = router.query;

  useEffect(() => {
    setShuffledCards(shuffleArray(cards));
    setFeedback(Array(cards.length).fill(""));
    getStudentTries();
  }, [cards]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getColorFromImageUrl = (url) => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split("-")[0];
  };

  const handleImageSelect = async (cardId, imageIndex, imageUrl) => {
    const color = await getColorFromImageUrl(imageUrl);
    console.log("Color:", color);
    console.log("Image url:", imageUrl);

    setSelectedImages((prev) => {
      const newSelection = prev[cardId] ? [...prev[cardId]] : [];
      if (newSelection.includes(imageIndex)) {
        return {
          ...prev,
          [cardId]: newSelection.filter((id) => id !== imageIndex),
        };
      } else if (newSelection.length < 3) {
        return { ...prev, [cardId]: [...newSelection, imageIndex] };
      }
      return prev;
    });
  };

  useEffect(() => {
    const newCorrectSelections = {};
    shuffledCards.forEach((card) => {
      const cardImages = [card.image1, card.image2, card.image3];
      const selectedCardImages = selectedImages[card.color_game_id] || [];
      const allSelectedImagesCorrect = selectedCardImages.every(
        (index) => getColorFromImageUrl(cardImages[index]) === card.color
      );
      const allCorrectImagesSelected = cardImages.every(
        (image, index) =>
          getColorFromImageUrl(image) !== card.color ||
          selectedCardImages.includes(index)
      );
      newCorrectSelections[card.color_game_id] =
        allSelectedImagesCorrect &&
        allCorrectImagesSelected &&
        selectedCardImages.length ===
          cardImages.filter(
            (image) => getColorFromImageUrl(image) === card.color
          ).length;
    });
    setCorrectSelections(newCorrectSelections);
  }, [selectedImages, shuffledCards]);

  const handleSubmit = (color_game_id) => {
    const card = shuffledCards.find((c) => c.color_game_id === color_game_id);
    const selectedCardImages = selectedImages[color_game_id] || [];
    const correctImageCount = [card.image1, card.image2, card.image3].filter(
      (image) => getColorFromImageUrl(image) === card.color
    ).length;
    const correctSelectionsCount = selectedCardImages.filter(
      (index) =>
        getColorFromImageUrl([card.image1, card.image2, card.image3][index]) ===
        card.color
    ).length;

    let resultMessage = "";
    if (
      correctSelectionsCount === correctImageCount &&
      selectedCardImages.length === correctImageCount
    ) {
      alert("Correct!");
      resultMessage = "Correct!";
      setAnswer(answer + 1);

      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    } else {
      alert("Incorrect.");
      resultMessage = "Incorrect.";
      setAnswer(answer + 1);
      if (swiperInstance) {
        swiperInstance.slideNext();
      }
    }
    if (answer + 1 === cards.length) {
      endGame();
    }

    setSubmissionResults((prev) => ({
      ...prev,
      [color_game_id]: resultMessage,
    }));
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
    <div className="w-full m-auto my-4">
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
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        navigation
        spaceBetween={50}
        slidesPerView={1}
        onSwiper={(swiper) => setSwiperInstance(swiper)}
        onSlideChange={() => console.log("slide change")}
        onSwiperSlideChange={() => console.log("swiper slide change")}
      >
        {shuffledCards.map((card) => (
          <SwiperSlide key={card.color_game_id}>
            <div className="flex justify-center w-1/2 m-auto">
              <div key={card.color_game_id}>
                <Card>
                  <CardBody>
                    <div className="grid grid-cols-3 gap-4">
                      {[card.image1, card.image2, card.image3].map(
                        (image, imageIndex) => (
                          <div
                            key={imageIndex}
                            className={`relative block w-full aspect-square bg-gray-100 rounded-lg border-2  items-center justify-center cursor-pointer `}
                            onClick={() =>
                              handleImageSelect(
                                card.color_game_id,
                                imageIndex,
                                image
                              )
                            }
                          >
                            {image && (
                              <div className="p-2 border rounded-md border-purple-400 relative overflow-hidden">
                                <Checkbox
                                  isSelected={(
                                    selectedImages[card.color_game_id] || []
                                  ).includes(imageIndex)}
                                  onChange={() =>
                                    handleImageSelect(
                                      card.color_game_id,
                                      imageIndex,
                                      image
                                    )
                                  }
                                  className="absolute top-2 left-2 z-99"
                                />
                                <Image
                                  src={image}
                                  alt={`Image ${imageIndex + 1}`}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    <p>Color: {card.color}</p>

                    <Button onClick={() => handleSubmit(card.color_game_id)}>
                      Submit
                    </Button>
                    {submissionResults[card.color_game_id] && (
                      <p
                        className={
                          submissionResults[card.color_game_id] === "Correct!"
                            ? "text-green-500"
                            : submissionResults[card.color_game_id] ===
                              "Almost there!"
                            ? "text-yellow-500"
                            : "text-red-500"
                        }
                      >
                        {submissionResults[card.color_game_id]}
                      </p>
                    )}
                  </CardBody>{" "}
                </Card>{" "}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ColorGames;
