import React, { useState, useRef } from "react";
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
} from "@nextui-org/react";

const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;

  const [cards, setCards] = useState([
    { images: [null, null, null], color: "" },
  ]);
  const [title, setTitle] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
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
    setSelectedImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      } else if (prev.length < 3) {
        return [...prev, imageId];
      }
      return prev;
    });
  };

  const handleAddCard = () => {
    setCards([...cards, { images: [null, null, null], color: "" }]);
  };

  const handleRemoveCard = (cardIndex) => {
    const updatedCards = cards.filter((_, index) => index !== cardIndex);
    setCards(updatedCards);
  };

  const handleEdit = (cardIndex, imageIndex) => {
    console.log("Card index and image index:", cardIndex, imageIndex);
    setDraggingIndex({ cardIndex, imageIndex });
    setSelectedImages(
      cards[cardIndex].images
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting:", {
      title,
      cards: cards.map((card) => ({ ...card, color: card.color })),
    });

    try {
      const response = await fetch("/api/color_game/color_game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          cards,
          account_id: session.user.id,
          room_code: room_code,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Color game created successfully");
      console.log("Color game created successfully:", data);
      alert("Color game created successfully");
    } catch (error) {
      console.error("Error creating color game:", error);
    }
  };

  const insertImages = () => {
    const updatedCards = [...cards];
    const selectedImageUrls = selectedImages.map(
      (id) => displayImages.find((img) => img.id === id).image
    );
    updatedCards[draggingIndex.cardIndex].images = selectedImageUrls;
    setCards(updatedCards);
    setSelectedImages([]);
    onOpenChange();
  };

  const handleColorChange = (cardIndex, color) => {
    const updatedCards = [...cards];
    updatedCards[cardIndex].color = color;
    setCards(updatedCards);
  };

  return (
    <div>
      <h1>Create Color Game</h1>
      <h1>room code: {room_code}</h1>
      <form onSubmit={handleSubmit}>
        <div className="w-80">
          <Input
            label="Title"
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-80"
          />
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

                  <h1>Choose 3 images</h1>
                  <div className="grid grid-cols-3 gap-4">
                    {card.images.map((image, imageIndex) => (
                      <div
                        key={imageIndex}
                        className={`relative block w-full aspect-square bg-gray-100 rounded-lg border-2  flex items-center justify-center cursor-pointer`}
                      >
                        {image ? (
                          <>
                            <img
                              src={image}
                              alt={`Uploaded ${imageIndex + 1}`}
                              className="h-full w-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2 opacity-0 hover:opacity-100 transition-opacity">
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
                          </>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <Button
                              onPress={() => handleEdit(cardIndex, imageIndex)}
                            >
                              <LibraryBig />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button color="secondary" onClick={handleAddCard} type="button">
              Add Card
            </Button>
            <Button
              color="primary"
              type="submit"
              isDisabled={
                !title ||
                cards.some(
                  (card) =>
                    card.images.some((img) => img === null) || !card.color
                )
              }
            >
              Create Game
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
                <h2 className="mb-4 text-lg font-semibold">Select 3 Images</h2>
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
                              isSelected={selectedImages.includes(item.id)}
                              onChange={() => handleImageSelect(item.id)}
                              isDisabled={
                                selectedImages.length >= 3 &&
                                !selectedImages.includes(item.id)
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
                  isDisabled={selectedImages.length !== 3}
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

export default Index;
