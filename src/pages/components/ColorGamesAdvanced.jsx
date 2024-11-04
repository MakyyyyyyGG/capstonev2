import React, { useState, useEffect } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const ColorGamesAdvanced = ({ cards }) => {
  const [showImages, setShowImages] = useState(false);
  const [randomizedImages, setRandomizedImages] = useState({});
  const [checkResult, setCheckResult] = useState({});

  // Function to render images
  const renderImages = (card) => {
    const images = card.images.split(",");
    return (
      <div className="flex w-full">
        {images?.map((image, index) => (
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
    const result = images.every((image, index) =>
      image.src.includes(colors[index].trim())
    );
    setCheckResult((prev) => ({
      ...prev,
      [card.color_game_advanced_id]: result,
    }));
  };

  // Randomize images on mount
  useEffect(() => {
    const newRandomizedImages = {};
    cards?.forEach((card) => {
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
  }, [cards]);

  return (
    <div>
      <h1>Color Games Advanced</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        {cards?.map((card) => (
          <Card key={card.color_game_advanced_id}>
            <CardBody>
              <h2>{card.title}</h2>
              <p>Color Sequence: {card.color.split(",").join(", ")}</p>
              <p>Difficulty: {card.difficulty}</p>
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

              <Button onClick={() => setShowImages(!showImages)}>
                {showImages ? "Hide Images" : "Show Images"}
              </Button>
              <Button onClick={() => checkImageSequence(card)}>
                Check Sequence
              </Button>
              {checkResult[card.color_game_advanced_id] !== undefined && (
                <p>
                  {checkResult[card.color_game_advanced_id] ? (
                    <h1 className="text-green-500">Correct Sequence!</h1>
                  ) : (
                    <h1 className="text-red-500">Incorrect Sequence!</h1>
                  )}
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </DragDropContext>
    </div>
  );
};

export default ColorGamesAdvanced;
