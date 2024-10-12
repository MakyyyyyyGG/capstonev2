import React, { useState, useRef } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { LibraryBig, Trash2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  Input,
  Button,
  Image,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
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

const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;

  const [cards, setCards] = useState([
    { images: [null, null, null, null], color: "" },
  ]);
  const [title, setTitle] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [difficulty, setDifficulty] = useState("");
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

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const groupedImages = groupImagesByColor(displayImages);

  const handleImageSelect = (imageId) => {
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
    setCards([...cards, { images: [null, null, null, null], color: "" }]);
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
      difficulty,
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
          difficulty,
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

  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);

    const maxImages =
      newDifficulty === "easy" ? 2 : newDifficulty === "medium" ? 3 : 4;
    const updatedCards = cards.map((card) => {
      // if (card.images.filter((img) => img !== null).length > maxImages) {
      //   alert(
      //     `Some cards have more than ${maxImages} images. Please adjust them.`
      //   );
      // }
      return {
        ...card,
        images: card.images.slice(0, maxImages),
      };
    });
    setCards(updatedCards);
  };

  return (
    <div>
      <Header
        isCollapsed={isCollapsedSidebar}
        toggleCollapse={toggleSidebarCollapseHandler}
      />
      <div className="flex border-2">
        <Sidebar
          isCollapsed={isCollapsedSidebar}
          toggleCollapse={toggleSidebarCollapseHandler}
        />
        <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <h1>Create Color Game</h1>
            <Button
              type="submit"
              color="secondary"
              isDisabled={
                !title ||
                cards.some(
                  (card) =>
                    card.images.some((img) => img === null) || !card.color
                )
              }
            >
              Create
            </Button>
          </div>
          <h1>room code: {room_code}</h1>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 items-center z-0 mb-4 max-sm:flex-col">
              <Input
                isRequired
                label="Title"
                onChange={(e) => setTitle(e.target.value)}
                className="w-3/5 max-sm:w-full"
              />
              <Select
                label="Difficulty"
                onChange={handleDifficultyChange}
                isRequired
                className="w-2/5 max-sm:w-full"
              >
                <SelectItem key="easy">Easy (2 images)</SelectItem>
                <SelectItem key="medium">Medium (3 images)</SelectItem>
                <SelectItem key="hard">Hard (4 images)</SelectItem>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4">
              {cards.map((card, cardIndex) => (
                <Card
                  key={cardIndex}
                  className="w-full border border-slate-800 rounded-md flex"
                >
                  <CardHeader className="flex px-3 justify-between items-center z-0">
                    <div className="pl-2 text-xl font-bold">
                      <h1>{cardIndex + 1}</h1>
                    </div>
                    <Button
                      isIconOnly
                      onPress={() => handleRemoveCard(cardIndex)}
                      color="danger"
                    >
                      <Trash2 size={22} />
                    </Button>
                  </CardHeader>
                  <Divider className="m-0 h-0.5 bg-slate-300" />
                  <CardBody>
                    <div className="mb-2">
                      <h1 className="mb-4 font-bold text-lg">Choose a color</h1>
                      <div className="flex flex-wrap gap-6 mx-2 my-2 max-sm:gap-4 max-sm:max-0">
                        <Checkbox
                          className="border bg-red-500 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "red"}
                          onChange={() => handleColorChange(cardIndex, "red")}
                        >
                          <span className="text-white">Red</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-blue-500 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "blue"}
                          onChange={() => handleColorChange(cardIndex, "blue")}
                        >
                          <span className="text-white">Blue</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-yellow-500 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "yellow"}
                          onChange={() =>
                            handleColorChange(cardIndex, "yellow")
                          }
                        >
                          <span className="text-white">Yellow</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-green-500 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "green"}
                          onChange={() => handleColorChange(cardIndex, "green")}
                        >
                          <span className="text-white">Green</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-purple-500 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "purple"}
                          onChange={() =>
                            handleColorChange(cardIndex, "purple")
                          }
                        >
                          <span className="text-white">Purple</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-orange-500 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "orange"}
                          onChange={() =>
                            handleColorChange(cardIndex, "orange")
                          }
                        >
                          <span className="text-white">Orange</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-pink-400 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "pink"}
                          onChange={() => handleColorChange(cardIndex, "pink")}
                        >
                          <span className="text-white">Pink</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-yellow-700 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "brown"}
                          onChange={() => handleColorChange(cardIndex, "brown")}
                        >
                          <span className="text-white">Brown</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-gray-900 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "black"}
                          onChange={() => handleColorChange(cardIndex, "black")}
                        >
                          <span className="text-white">Black</span>
                        </Checkbox>
                        <Checkbox
                          className="border bg-gray-100 rounded-md max-sm:scale-[90%]"
                          isSelected={card.color === "white"}
                          onChange={() => handleColorChange(cardIndex, "white")}
                        >
                          White
                        </Checkbox>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Array.from(
                        {
                          length:
                            difficulty === "easy"
                              ? 2
                              : difficulty === "medium"
                              ? 3
                              : 4,
                        },
                        (_, imageIndex) => (
                          <div
                            key={imageIndex}
                            className={`flex relative block w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed items-center justify-center cursor-pointer`}
                          >
                            {card.images[imageIndex] ? (
                              <>
                                <img
                                  src={card.images[imageIndex]}
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
                                      updatedCards[cardIndex].images[
                                        imageIndex
                                      ] = null;
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
                                  color="secondary"
                                  onPress={() =>
                                    handleEdit(cardIndex, imageIndex)
                                  }
                                >
                                  <LibraryBig /> Select
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex justify-between"></div>
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
                      {difficulty === "easy"
                        ? 2
                        : difficulty === "medium"
                        ? 3
                        : 4}{" "}
                      Images
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(groupedImages).map(([color, images]) => (
                        <Card
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
                                    selectedImages.length >=
                                      (difficulty === "easy"
                                        ? 2
                                        : difficulty === "medium"
                                        ? 3
                                        : 4) &&
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
                        </Card>
                      ))}
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" onPress={onClose}>
                      Close
                    </Button>
                    <Button
                      color="secondary"
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
          <Button
            size="lg"
            radius="sm"
            color="secondary"
            className="mb-4 text-sm"
            onClick={handleAddCard}
            type="button"
            startContent={<Plus size={22} />}
          >
            Add Card
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
