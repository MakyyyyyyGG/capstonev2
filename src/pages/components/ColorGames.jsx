import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardBody,
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
      <div className="flex mb-5 justify-between items-center text-2xl font-extrabold">
        <div>
          <h1 className="text-2xl font-bold">Color Game</h1>
        </div>
      </div>
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
        >
          {cards?.map((card) => (
            <SwiperSlide key={card.color_game_id}>
              <Card className="w-full flex flex-col gap-4 max-w-[50rem] mx-auto">
                <CardBody className="flex flex-col gap-4 px-auto items-center justify-center">
                  <div className="flex justify-center items-center gap-2">
                    <div className="text-3xl font-extrabold my-5 capitalize">
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
                        ? "grid-cols-4"
                        : [
                            card.image1,
                            card.image2,
                            card.image3,
                            card.image4,
                          ].filter((image) => image !== null).length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2"
                    } gap-2`}
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
                                ? "border-3 border-[#17C964]"
                                : "border border-purple-400"
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
                            }}
                          >
                            <div className="p-2 rounded-md relative overflow-hidden">
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
                                className="absolute top-2 right-1 z-99"
                              />
                              <Image
                                src={image}
                                alt={`Image ${imageIndex + 1}`}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            </div>
                          </motion.div>
                        )
                    )}
                  </div>
                  <div className="w-full mt-8">
                    <Button
                      radius="sm"
                      className="w-full justify-center text-white bg-[#7469B6]"
                      onClick={() => handleSubmit(card.color_game_id)}
                    >
                      Submit
                    </Button>
                  </div>
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
                              ? "text-white w-full bg-yellow-500 p-2 rounded-md"
                              : "text-white w-full bg-red-500 p-2 rounded-md"
                          }
                        >
                          {submissionResults[card.color_game_id]}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ColorGames;
