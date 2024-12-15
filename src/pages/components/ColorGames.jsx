import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
  CardFooter,
  Image,
  Input,
  Checkbox,
  Button,
} from "@nextui-org/react";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-creative";

// import required modules
import { Pagination, Navigation } from "swiper/modules";
import { EffectCreative } from "swiper/modules";

const ColorGames = ({ cards }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [correctSelections, setCorrectSelections] = useState({});
  const [submissionResults, setSubmissionResults] = useState({});
  const getColorFromImageUrl = (url) => {
    if (!url) return null;
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split("-")[0];
  };
  useEffect(() => {
    console.log("cards:", cards);
  }, [cards]);
  const handleImageSelect = async (
    cardId,
    imageIndex,
    imageUrl,
    difficulty
  ) => {
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
      } else if (
        newSelection.length <
        (difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4)
      ) {
        return { ...prev, [cardId]: [...newSelection, imageIndex] };
      }
      return prev;
    });
  };

  useEffect(() => {
    const newCorrectSelections = {};
    cards.forEach((card) => {
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
  }, [selectedImages, cards]);

  const handleSubmit = (color_game_id) => {
    const card = cards.find((c) => c.color_game_id === color_game_id);
    const selectedCardImages = selectedImages[color_game_id] || [];
    const correctImageCount = [
      card.image1,
      card.image2,
      card.image3,
      card.image4,
    ].filter((image) => getColorFromImageUrl(image) === card.color).length;
    const correctSelectionsCount = selectedCardImages.filter(
      (index) =>
        getColorFromImageUrl(
          [card.image1, card.image2, card.image3, card.image4][index]
        ) === card.color
    ).length;

    let resultMessage = "";
    if (
      correctSelectionsCount === correctImageCount &&
      selectedCardImages.length === correctImageCount
    ) {
      resultMessage = "Correct!";
    } else if (correctSelectionsCount > 0) {
      resultMessage = "Almost there!";
    } else {
      resultMessage = "Incorrect. Try again.";
    }

    setSubmissionResults((prev) => ({
      ...prev,
      [color_game_id]: resultMessage,
    }));
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
      <div className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto rounded-xl">
        <Swiper
          // pagination={{
          //   type: "progressbar",
          // }}
          grabCursor={true}
          effect={"creative"}
          creativeEffect={{
            prev: {
              shadow: true,
              translate: [0, 0, -400],
            },
            next: {
              translate: ["100%", 0, 0],
            },
          }}
          modules={[EffectCreative]}
          className="mySwiper w-full drop-shadow-lg rounded-md"
          style={{
            filter: "drop-shadow(4px 4px 0px #7828C8",
          }}
        >
          {cards?.map((card) => (
            <SwiperSlide key={card.color_game_id}>
              <Card className="w-full flex flex-col gap-4 h-[40rem] border-4 border-purple-300 bg-white aspect-square mx-auto p-4">
                <CardBody className="flex flex-col gap-2 px-auto items-center justify-center py-0">
                  <div className="flex justify-center items-center gap-2">
                    <div className="text-4xl text-purple-700 font-extrabold mb-1 capitalize">
                      <h1>{card.color}</h1>
                    </div>
                  </div>
                  <div
                    className={`grid ${
                      [
                        card.image1,
                        card.image2,
                        card.image3,
                        card.image4,
                      ].filter((image) => image !== null).length === 4
                        ? "grid-cols-2 max-w-[24rem]"
                        : [
                            card.image1,
                            card.image2,
                            card.image3,
                            card.image4,
                          ].filter((image) => image !== null).length === 3
                        ? "grid-cols-3 max-sm:grid-cols-2 max-sm:max-w-[24rem]"
                        : "grid-cols-2"
                    } gap-4 justify-center`}
                  >
                    {[card.image1, card.image2, card.image3, card.image4]?.map(
                      (image, imageIndex) =>
                        image && (
                          <motion.div
                            key={imageIndex}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative block w-full aspect-square rounded-md items-center justify-center cursor-pointer ${
                              selectedImages[card.color_game_id]?.includes(
                                imageIndex
                              )
                                ? "border-3 border-purple-300 bg-white"
                                : "border-3 border-transparent bg-white"
                            }`}
                            onClick={() =>
                              handleImageSelect(
                                card.color_game_id,
                                imageIndex,
                                image
                              )
                            }
                            style={{
                              transition:
                                "border-color 0.3s ease, transform 0.3s ease",
                              filter: (
                                selectedImages[card.color_game_id] || []
                              ).includes(imageIndex)
                                ? "drop-shadow(4px 4px 0px #7828C8)"
                                : "none", // Apply shadow only when selected
                            }}
                          >
                            <div className="rounded-md relative overflow-hidden">
                              <Checkbox
                                color="success"
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
                                className="absolute top-2 right-1 opacity-0"
                              />
                              <Image
                                src={image}
                                alt={`Image ${imageIndex + 1}`}
                                className="w-full aspect-square object-cover rounded-md"
                              />
                            </div>
                          </motion.div>
                        )
                    )}
                  </div>
                </CardBody>
                <CardFooter className="w-full flex flex-col gap-2 py-2">
                  <AnimatePresence>
                    {submissionResults[card.color_game_id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex w-full text-center justify-center rounded-md"
                      >
                        <p
                          className={
                            submissionResults[card.color_game_id] === "Correct!"
                              ? "text-white w-full bg-green-500 p-2 rounded-md"
                              : submissionResults[card.color_game_id] ===
                                "Almost there!"
                              ? "text-white w-full bg-yellow-500 p-2 rounded-lg"
                              : "text-white w-full bg-yellow-500 p-2 rounded-lg"
                          }
                        >
                          {submissionResults[card.color_game_id]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Button
                    radius="sm"
                    onClick={() => handleSubmit(card.color_game_id)}
                    className="w-full h-16 justify-center text-purple-700 text-lg bg-white border-4 border-purple-300"
                    style={{
                      filter: "drop-shadow(4px 4px 0px #7828C8",
                    }}
                  >
                    Check Answer
                  </Button>
                </CardFooter>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ColorGames;
