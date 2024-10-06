import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Image,
  Input,
  Checkbox,
  Button,
} from "@nextui-org/react";

const ColorGames = ({ cards }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [correctSelections, setCorrectSelections] = useState({});
  const [submissionResults, setSubmissionResults] = useState({});
  const getColorFromImageUrl = (url) => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split("-")[0];
  };
  useEffect(() => {
    console.log("cards:", cards);
  }, [cards]);
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
    <div className="">
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.color_game_id}>
            <Card>
              <CardBody>
                <div
                  className={`grid ${
                    card.difficulty === "easy"
                      ? "grid-cols-2"
                      : card.difficulty === "medium"
                      ? "grid-cols-3"
                      : "grid-cols-2 grid-rows-2"
                  } gap-2 border`}
                >
                  {[card.image1, card.image2, card.image3, card.image4].map(
                    (image, imageIndex) =>
                      image && (
                        <div
                          key={imageIndex}
                          className={`relative block w-full aspect-square bg-gray-100 rounded-lg border-2 flex items-center justify-center cursor-pointer `}
                          onClick={() =>
                            handleImageSelect(
                              card.color_game_id,
                              imageIndex,
                              image
                            )
                          }
                        >
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
        ))}
      </div>
    </div>
  );
};

export default ColorGames;
