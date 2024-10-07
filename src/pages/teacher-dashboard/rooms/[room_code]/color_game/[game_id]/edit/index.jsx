import React, { useState, useRef, useEffect } from "react";
import { LibraryBig } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  Input,
  Button,
  Image,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Select,
  SelectItem,
} from "@nextui-org/react";
const index = () => {
  const { data: session } = useSession();

  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);
  const [title, setTitle] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [defaultImages, setDefaultImages] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [updateDifficulty, setUpdateDifficulty] = useState(false);
  const [tempImage, setTempImage] = useState();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const displayImages = [
    {
      id: 1,
      image: "/color_game/images/blue-book.png",
    },
    {
      id: 2,
      image: "/color_game/images/blue-cap.png",
    },
    {
      id: 3,
      image: "/color_game/images/blue-cup.png",
    },
    {
      id: 4,
      image: "/color_game/images/red-ball.png",
    },
    {
      id: 5,
      image: "/color_game/images/red-strawberry.png",
    },
    {
      id: 6,
      image: "/color_game/images/red-watermelon.png",
    },
    {
      id: 7,
      image: "/color_game/images/yellow-bee.png",
    },
    {
      id: 8,
      image: "/color_game/images/yellow-duck.png",
    },
    {
      id: 9,
      image: "/color_game/images/yellow-star.png",
    },
    {
      id: 10,
      image: "/color_game/images/yellow-star.png",
    },
    {
      id: 11,
      image: "/color_game/images/yellow-star.png",
    },
  ];
  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/color_game/color_game?game_id=${game_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      // Map over the data and transform image1, image2, and image3 into an array
      const transformedData = data.map((item) => ({
        ...item, // Spread the existing properties
        images: [item.image1, item.image2, item.image3, item.image4], // Create an 'images' array
      }));

      setCards(transformedData); // Set the transformed data as cards
      setTitle(transformedData[0].title); // Set the title (assuming title is from the first card)
      setDifficulty(transformedData[0].difficulty);
      setSelectedDifficulty(transformedData[0].difficulty);
      if (res.ok) {
        console.log("Cards fetched successfully");
        console.log(transformedData);
      } else {
        console.error("Error fetching cards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchCards();
    }
  }, [game_id]);

  const groupImagesByColor = (images) => {
    return images.reduce((acc, image) => {
      const color = image.image.split("/").pop().split("-")[0];
      if (!acc[color]) {
        acc[color] = [];
      }
      acc[color].push(image);
      return acc;
    }, {});
  };

  const groupedImages = groupImagesByColor(displayImages);

  const handleImageSelect = (imageId) => {
    setDefaultImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      } else if (
        prev.length <
        (difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4)
      ) {
        return [...prev, imageId];
      }
      return prev;
    });
    setSelectedImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      } else if (
        prev.length <
        (difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4)
      ) {
        return [...prev, imageId];
      }
      return prev;
    });
  };

  const handleAddCard = () => {
    setCards([
      ...cards,
      { images: [null, null, null, null], color: "", isNew: true },
    ]);
  };

  const handleRemoveCard = (cardIndex) => {
    const updatedCards = cards.filter((_, index) => index !== cardIndex);
    handleDeleteCard(cardIndex);
    setCards(updatedCards);
  };

  const handleEdit = (cardIndex, imageIndex) => {
    console.log("Card index and image index:", cardIndex, imageIndex);
    const card = cards[cardIndex];
    setDraggingIndex({ cardIndex, imageIndex });

    setSelectedImages(
      (card.images || [])
        .filter((img) => img !== null)
        .map((img) => {
          const foundImage = displayImages.find(
            (dispImg) => dispImg.image === img
          );
          return foundImage ? foundImage.id : null;
        })
        .filter((id) => id !== null)
    );
    onOpen();
  };

  const setupNewCards = async (cards) => {
    const newCards = cards.filter((card) => card.isNew === true);
    console.log("newCards", newCards);
    if (newCards.length > 0) {
      for (const card of newCards) {
        card.color_game_set_id = cards[0].color_game_set_id;
        card.title = cards[0].title;

        try {
          const response = await fetch(
            "/api/color_game/update_color_game/update_color_game",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ cards: card }), // Wrap in an array
            }
          );
          if (response.ok) {
            console.log("Card created successfully");
          } else {
            console.error("Error creating card:", response.error);
          }
        } catch (error) {
          console.error("Error creating card:", error);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await setupNewCards(cards);
    console.log("Submitting:", {
      title,
      cards,
      difficulty,
      room_code,
    });

    try {
      const cardsToUpdate = cards.filter((c) => !c.isNew); // Filter out new cards
      // console.log("cardsToUpdate", cardsToUpdate);
      for (const card of cardsToUpdate) {
        const body = JSON.stringify({
          title: title, // Pass the title for the card set
          cards: card, // Pass the modified card details (with images and word)
          difficulty: difficulty,
          game_id: game_id,
        });
        console.log("body", body);
        const response = await fetch(
          `/api/color_game/color_game?color_game_id=${card.color_game_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: body,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        alert("Color game created successfully");
        console.log("Color game created successfully:", data);
      }
    } catch (error) {
      console.error("Error creating color game:", error);
    }
    fetchCards();
  };

  const handleDeleteCard = async (cardIndex) => {
    const userConfirmed = confirm(
      "Are you sure you want to delete this color game card?"
    );
    if (userConfirmed) {
      const updatedCards = [...cards];
      const removedCard = updatedCards.splice(cardIndex, 1)[0];
      setCards(updatedCards);
      console.log("removed color game card id:", removedCard.color_game_id);
      try {
        const response = await fetch(
          `/api/color_game/update_color_game/update_color_game?color_game_id=${removedCard.color_game_id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          console.log("Card deleted successfully");
          fetchCards();
        } else {
          console.error("Error deleting card");
        }
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  const insertImages = () => {
    const updatedCards = [...cards];
    const selectedImageUrls = selectedImages.map(
      (id) => displayImages.find((img) => img.id === id).image
    );
    if (!updatedCards[draggingIndex.cardIndex].images) {
      updatedCards[draggingIndex.cardIndex].images = [null, null, null];
    }
    updatedCards[draggingIndex.cardIndex].images = selectedImageUrls;
    console.log("Updated cards:", updatedCards);
    setCards(updatedCards);
    setSelectedImages([]);
    onOpenChange();
  };

  const handleColorChange = (cardIndex, color) => {
    const updatedCards = [...cards];
    updatedCards[cardIndex].color = color;
    setCards(updatedCards);
  };

  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);

    const maxImages =
      newDifficulty === "easy" ? 2 : newDifficulty === "medium" ? 3 : 4;
    const updatedCards = cards.map((card) => {
      const updatedImages = card.images.slice(0, maxImages);
      return {
        ...card,
        images: updatedImages,
      };
    });
    setCards(updatedCards);
  };

  return (
    <div>
      <h1>Create Color Game</h1>
      <h1>room code: {room_code}</h1>
      <form onSubmit={handleSubmit}>
        <div className="w-80">
          <Input
            isRequired
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-80"
          />

          {updateDifficulty ? (
            <>
              <Select
                isRequired
                label="Difficulty"
                defaultSelectedKeys={[selectedDifficulty]}
                onChange={handleDifficultyChange}
                className="mb-4 w-80"
              >
                <SelectItem value="easy" key="easy">
                  Easy (2 images)
                </SelectItem>
                <SelectItem value="medium" key="medium">
                  Medium (3 images)
                </SelectItem>
                <SelectItem value="hard" key="hard">
                  Hard (4 images)
                </SelectItem>
              </Select>
              <Button onClick={() => setUpdateDifficulty(false)}>Cancel</Button>
            </>
          ) : (
            <Button
              onClick={() => setUpdateDifficulty(!updateDifficulty)}
              color="secondary"
            >
              Edit Difficulty
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            {cards.map((card, cardIndex) => (
              <Card key={cardIndex} className="w-full">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <h2 className="mb-4 text-lg font-semibold">
                      Color Card {cardIndex + 1}
                    </h2>
                    <p>Card ID: {card.color_game_id}s</p>
                    <Button
                      onPress={() => handleRemoveCard(cardIndex)}
                      color="danger"
                      className="mb-4"
                    >
                      Remove Card
                    </Button>
                  </div>
                  <div>
                    <h1>Choose a color</h1>
                    <Checkbox
                      className="m-2 border bg-red-300 rounded-md"
                      isSelected={card.color === "red"}
                      onChange={() => handleColorChange(cardIndex, "red")}
                    >
                      Red
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-blue-300 rounded-md"
                      isSelected={card.color === "blue"}
                      onChange={() => handleColorChange(cardIndex, "blue")}
                    >
                      Blue
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-yellow-300 rounded-md"
                      isSelected={card.color === "yellow"}
                      onChange={() => handleColorChange(cardIndex, "yellow")}
                    >
                      Yellow
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-green-300 rounded-md"
                      isSelected={card.color === "green"}
                      onChange={() => handleColorChange(cardIndex, "green")}
                    >
                      Green
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-purple-300 rounded-md"
                      isSelected={card.color === "purple"}
                      onChange={() => handleColorChange(cardIndex, "purple")}
                    >
                      Purple
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-orange-300 rounded-md"
                      isSelected={card.color === "orange"}
                      onChange={() => handleColorChange(cardIndex, "orange")}
                    >
                      Orange
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-pink-300 rounded-md"
                      isSelected={card.color === "pink"}
                      onChange={() => handleColorChange(cardIndex, "pink")}
                    >
                      Pink
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-yellow-700 rounded-md"
                      isSelected={card.color === "brown"}
                      onChange={() => handleColorChange(cardIndex, "brown")}
                    >
                      Brown
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-gray-900 rounded-md "
                      isSelected={card.color === "black"}
                      onChange={() => handleColorChange(cardIndex, "black")}
                    >
                      <span className="text-white">Black</span>
                    </Checkbox>
                    <Checkbox
                      className="m-2 border bg-gray-100 rounded-md "
                      isSelected={card.color === "white"}
                      onChange={() => handleColorChange(cardIndex, "white")}
                    >
                      White
                    </Checkbox>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {card.images
                      .slice(
                        0,
                        difficulty === "easy"
                          ? 2
                          : difficulty === "medium"
                          ? 3
                          : 4
                      )
                      .map((image, imageIndex) => (
                        <div
                          key={imageIndex}
                          className={`relative block w-full aspect-square bg-gray-100 rounded-lg border-2  items-center justify-center cursor-pointer group`}
                        >
                          {image ? (
                            <div className="p-2 border rounded-md border-purple-400 relative overflow-hidden w-full h-full">
                              <img
                                src={image}
                                alt={`Image ${imageIndex + 1}`}
                                className="h-full w-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-100">
                                <Button
                                  onPress={() =>
                                    handleEdit(cardIndex, imageIndex)
                                  }
                                  color="secondary"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => {
                                    const updatedCards = [...cards];
                                    updatedCards[cardIndex].images[imageIndex] =
                                      null;
                                    setCards(updatedCards);
                                  }}
                                  color="danger"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center space-y-2">
                              <Button
                                onPress={() =>
                                  handleEdit(cardIndex, imageIndex)
                                }
                              >
                                <LibraryBig />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    {/* Render empty image holders based on difficulty */}
                    {Array.from(
                      {
                        length:
                          (difficulty === "easy"
                            ? 2
                            : difficulty === "medium"
                            ? 3
                            : 4) - card.images.length,
                      },
                      (_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="flex flex-col items-center space-y-2"
                        >
                          <Button
                            onPress={() =>
                              handleEdit(cardIndex, card.images.length + index)
                            }
                          >
                            <LibraryBig />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button color="secondary" onClick={handleAddCard} type="button">
              Add Card
            </Button>
            <Button color="primary" type="submit" isDisabled={!title}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Image Library
              </ModalHeader>
              <ModalBody>
                <h2 className="mb-4 text-lg font-semibold">
                  Select{" "}
                  {difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4}{" "}
                  Images
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(groupedImages).map(([color, images]) => (
                    <div
                      key={color}
                      className="flex flex-col border rounded-md border-purple-400 p-4"
                    >
                      <h3 className="mb-2 text-md font-semibold capitalize">
                        {color}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {images.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 border rounded-md border-purple-400 relative overflow-hidden"
                          >
                            <Checkbox
                              color="secondary"
                              className="absolute top-2 right-2 z-99"
                              isSelected={
                                selectedImages.includes(item.id) ||
                                defaultImages.includes(item.image)
                              }
                              onChange={() => handleImageSelect(item.id)}
                              isDisabled={
                                selectedImages.length >=
                                  (difficulty === "easy"
                                    ? 2
                                    : difficulty === "medium"
                                    ? 3
                                    : 4) && !selectedImages.includes(item.id)
                                // !defaultImages.includes(item.image)
                              }
                            />
                            <Image
                              src={item.image}
                              alt={`Color game image ${item.id}`}
                              className="w-full h-full object-cover"
                              onClick={() => handleImageSelect(item.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={insertImages}
                  isDisabled={
                    selectedImages.length !==
                    (difficulty === "easy"
                      ? 2
                      : difficulty === "medium"
                      ? 3
                      : 4)
                  }
                >
                  Insert
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default index;
