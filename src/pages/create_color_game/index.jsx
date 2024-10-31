import React, { useState, useRef, useEffect } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { LibraryBig, Trash2, Plus, Pencil } from "lucide-react";
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
  cn,
} from "@nextui-org/react";
import { getImages } from "@/pages/api/getImages";
import toast, { Toaster } from "react-hot-toast";

export async function getStaticProps() {
  const images = getImages();
  console.log("images:", images);
  return {
    props: {
      images,
    },
  };
}

const Index = ({ images }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;
  const [cards, setCards] = useState([
    { images: [null, null, null, null], color: "" },
  ]);
  // console.log("images:", images);
  const [title, setTitle] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [difficulty, setDifficulty] = useState("");
  const displayImages = images;
  const [isLoading, setIsLoading] = useState(false);

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
    if (
      selectedImages.length >=
      (difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4)
    ) {
      alert(
        `You can only select ${
          difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4
        } images.`
      );
      return;
    }
    // console.log("imageId:", imageId);
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
    setIsLoading(true);
    //error if theres no selected color
    if (cards.some((card) => !card.color)) {
      toast.error("Please select a color");
      setIsLoading(false);
      return;
    }

    //error if theres no selected image
    if (cards.some((card) => card.images.some((img) => img === null))) {
      toast.error("Please select an image");
      setIsLoading(false);
      return;
    }

    //error if theres no title
    if (!title) {
      toast.error("Please enter a title");
      setIsLoading(false);
      return;
    }

    //error if theres no difficulty
    if (!difficulty) {
      toast.error("Please select a difficulty");
      setIsLoading(false);
      return;
    }

    const toastId = toast.loading("Creating color game...");

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
      console.log("Color game created successfully:", data);
      toast.success("Color game created successfully", { id: toastId });
      router.push(
        `/teacher-dashboard/rooms/${room_code}/color_game/${data.gameId}`
      );
    } catch (error) {
      console.error("Error creating color game:", error);
      toast.error("Error creating color game", { id: toastId });
    } finally {
      setIsLoading(false);
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
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Create Color Game</h1>
        {isLoading ? (
          <Button isDisabled isLoading color="secondary">
            Create
          </Button>
        ) : (
          <Button
            // type="submit"
            onClick={handleSubmit}
            color="secondary"
            radius="sm"
            isDisabled={
              !title ||
              cards.some(
                (card) => card.images.some((img) => img === null) || !card.color
              )
            }
          >
            Create
          </Button>
        )}
      </div>
      <h1>room code: {room_code}</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 items-center z-0 mb-4 max-sm:flex-col">
          <Input
            isRequired
            placeholder="Title"
            size="lg"
            radius="md"
            classNames={{
              label: "text-white",
              inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
            }}
            variant="bordered"
            color="secondary"
            onChange={(e) => setTitle(e.target.value)}
            className="w-3/5 max-sm:w-full"
          />
          <Select
            size="lg"
            radius="md"
            classNames={{
              label: "text-white",
              mainWrapper: "bg-[#ffffff] border-1 border-[#7469B6]  rounded-lg",
            }}
            placeholder="Difficulty"
            variant="bordered"
            onChange={handleDifficultyChange}
            isRequired
            className="w-2/5 max-sm:w-full"
          >
            <SelectItem key="easy">Easy (2 images)</SelectItem>
            <SelectItem key="medium">Medium (3 images)</SelectItem>
            <SelectItem key="hard">Hard (4 images)</SelectItem>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, cardIndex) => (
            <Card
              key={cardIndex}
              className="w-full border  border-[#7469B6] rounded-md flex p-4"
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
                  <Trash2 size={20} />
                </Button>
              </CardHeader>
              <CardBody>
                <div className="mb-2">
                  <h1 className="mb-4 font-bold text-lg">Choose a color</h1>
                  <div className="grid grid-cols-5 gap-6 mx-2 my-2 max-sm:gap-4 max-sm:max-0">
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "red")}
                          className={`rounded-full w-12 h-12 bg-red-500 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "red" ? "ring-4 ring-[#7469B6]" : ""
                          }`}
                        ></div>
                        <span className="text-sm mt-1">Red</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "blue")}
                          className={`rounded-full w-12 h-12 bg-blue-500 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "blue" ? "ring-4 ring-[#7469B6]" : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Blue</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "yellow")}
                          className={`rounded-full w-12 h-12 bg-yellow-500 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "yellow"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Yellow</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "green")}
                          className={`rounded-full w-12 h-12 bg-green-500 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "green"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Green</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "purple")}
                          className={`rounded-full w-12 h-12 bg-purple-500 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "purple"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Purple</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "orange")}
                          className={`rounded-full w-12 h-12 bg-orange-500 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "orange"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Orange</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "pink")}
                          className={`rounded-full w-12 h-12 bg-pink-400 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "pink" ? "ring-4 ring-[#7469B6]" : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Pink</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "brown")}
                          className={`rounded-full w-12 h-12 bg-yellow-700 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "brown"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Brown</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "black")}
                          className={`rounded-full w-12 h-12 bg-gray-900 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "black"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">Black</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex flex-col items-center">
                        <div
                          onClick={() => handleColorChange(cardIndex, "white")}
                          className={`rounded-full w-12 h-12 bg-gray-100 max-sm:scale-[90%] cursor-pointer ${
                            card.color === "white"
                              ? "ring-4 ring-[#7469B6]"
                              : ""
                          }`}
                        />
                        <span className="text-sm mt-1">White</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
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
                        className={`flex  relative  w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed items-center justify-center cursor-pointer`}
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
                                isIconOnly
                                onPress={() =>
                                  handleEdit(cardIndex, imageIndex)
                                }
                                color="secondary"
                                size="sm"
                              >
                                <Pencil size={18} />
                              </Button>
                              <Button
                                isIconOnly
                                onClick={() => {
                                  const updatedCards = [...cards];
                                  updatedCards[cardIndex].images[imageIndex] =
                                    null;
                                  setCards(updatedCards);
                                }}
                                color="danger"
                                size="sm"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <Button
                              radius="sm"
                              variant="bordered"
                              color="secondary"
                              className="border-1"
                              onPress={() => handleEdit(cardIndex, imageIndex)}
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

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        scrollBehavior="outside"
        backdrop="blur"
        placement="center"
        classNames={{
          backdrop: "bg-[#7469B6] opacity-50",
          body: "pb-6 px-8 max-sm:p-4 max-sm:pb-4",
          header: "text-[#F3F3F3] text-3xl p-8 max-sm:p-4 max-sm:text-xl",
          footer: "px-8 pb-8 max-sm:px-4 max-sm:pb-4",
          base: "bg-[#7469B6] text-[#a8b0d3] h-full",
          closeButton:
            "text-[#fff] text-lg hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Image Library
              </ModalHeader>
              <ModalBody>
                <h2 className="mb-2 text-lg text-[#F3F3F3] font-semibold">
                  Select{" "}
                  {difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4}{" "}
                  Images
                </h2>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-md:grid-cols-2">
                  {Object.entries(groupedImages).map(([color, images]) => (
                    <Card key={color} className="flex flex-col rounded-md p-4">
                      <h3 className="mb-2 text-md font-semibold capitalize">
                        {color}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {images.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2 rounded-md relative overflow-hidden border transition-all duration-300 ${
                              selectedImages.includes(item.id)
                                ? "border-2 border-[#17C964]" // Thicker border when selected
                                : "border-2 border-[#7469B6]" // Default border when not selected
                            }`}
                          >
                            <Checkbox
                              color="secondary"
                              isSelected={selectedImages.includes(item.id)}
                              onChange={() => handleImageSelect(item.id)}
                              isDisabled={
                                selectedImages.length >=
                                  (difficulty === "easy"
                                    ? 2
                                    : difficulty === "medium"
                                    ? 3
                                    : 4) && !selectedImages.includes(item.id)
                              }
                            />
                            <Image
                              src={item.image}
                              alt={`Color game image ${item.id}`}
                              className="w-full h-full object-cover"
                              onClick={() => handleImageSelect(item.id)}
                            />
                            <h1 className="text-center">{item.name}</h1>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" radius="sm" onPress={onClose}>
                  Close
                </Button>
                <Button
                  radius="sm"
                  color="success"
                  className="text-white"
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
  );
};

export default Index;
