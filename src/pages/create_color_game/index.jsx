import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
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
  Tabs,
  Tab,
} from "@nextui-org/react";
import { getImages } from "@/pages/api/getImages";
import toast, { Toaster } from "react-hot-toast";
import PreviewColorGame from "@/pages/components/PreviewColorGame";

export async function getStaticProps() {
  const images = getImages();
  // console.log("images:", images);
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
  const [selectedColor, setSelectedColor] = useState(null);

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
      return {
        ...card,
        images: card.images.slice(0, maxImages),
      };
    });
    setCards(updatedCards);
  };

  const handleColorFilterChange = (color) => {
    setSelectedColor(color);
  };

  const filteredImages = selectedColor
    ? groupedImages[selectedColor] || []
    : displayImages;

  const colors = [
    { name: "Red", className: "bg-red-500", value: "red" },
    { name: "Blue", className: "bg-blue-500", value: "blue" },
    { name: "Yellow", className: "bg-yellow-500", value: "yellow" },
    { name: "Green", className: "bg-green-500", value: "green" },
    { name: "Purple", className: "bg-purple-500", value: "purple" },
    { name: "Orange", className: "bg-orange-500", value: "orange" },
    { name: "Pink", className: "bg-pink-400", value: "pink" },
    { name: "Brown", className: "bg-yellow-700", value: "brown" },
    { name: "Black", className: "bg-gray-900", value: "black" },
    { name: "White", className: "bg-gray-100", value: "white" },
  ];

  const driverObj = useRef(
    driver({
      showProgress: true,
      steps: [
        {
          element: "input[placeholder='Enter Title']",
          popover: {
            title: "Set Title",
            description: "Enter a title for your color game set",
          },
        },
        {
          element: "#difficulty",
          popover: {
            title: "Set Difficulty",
            description:
              "Choose difficulty level - Easy (2 images), Medium (3 images), or Hard (4 images)",
          },
        },
        {
          element: "#remove-card-btn",
          popover: {
            title: "Remove Card",
            description: "Click here to remove a card from your set",
          },
        },
        {
          element: ".grid-cols-5",
          popover: {
            title: "Choose Color",
            description: "Select a color for this card",
          },
        },
        {
          element: "#select-image-btn",
          popover: {
            title: "Select Images",
            description: "Click to select images that match the chosen color",
          },
        },
        {
          element: "#add-card-btn",
          popover: {
            title: "Add More Cards",
            description: "Click here to add more color cards to your set",
          },
        },
        {
          element: "#create-btn",
          popover: {
            title: "Create Color Game",
            description:
              "When you're done, click here to create your color game",
          },
        },
      ],
    })
  );

  useEffect(() => {
    const isTutorialShown = !localStorage.getItem("create-color-game-tutorial");
    if (isTutorialShown) {
      setTimeout(() => {
        driverObj.current.drive();
        localStorage.setItem("create-color-game-tutorial", "true");
      }, 1000);
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Create Color Game</h1>
        <div className="flex gap-2 items-center">
          <PreviewColorGame />
          <div>
            {isLoading ? (
              <Button isDisabled isLoading color="secondary">
                Create
              </Button>
            ) : (
              <Button
                id="create-btn"
                onClick={handleSubmit}
                color="secondary"
                radius="sm"
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
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 items-center z-0 mb-4 max-sm:flex-col">
          <Input
            isRequired
            placeholder="Enter Title"
            size="lg"
            radius="sm"
            classNames={{
              label: "text-white",
              inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
            }}
            variant="bordered"
            color="secondary"
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            id="difficulty"
            size="lg"
            radius="sm"
            classNames={{
              label: "text-white",
              mainWrapper: "bg-[#ffffff] border-1 border-[#7469B6]  rounded-lg",
            }}
            placeholder="Difficulty"
            variant="bordered"
            onChange={handleDifficultyChange}
            isRequired
          >
            <SelectItem key="easy">Easy (2 images)</SelectItem>
            <SelectItem key="medium">Medium (3 images)</SelectItem>
            <SelectItem key="hard">Hard (4 images)</SelectItem>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  id="remove-card-btn"
                  radius="sm"
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
                    {colors.map((color) => (
                      <div key={color.value} className="relative">
                        <div className="flex flex-col items-center">
                          <div
                            onClick={() =>
                              handleColorChange(cardIndex, color.value)
                            }
                            className={`rounded-full w-12 h-12 transition-transform duration-300 ${
                              color.className
                            } max-sm:scale-[90%] cursor-pointer ${
                              card.color === color.value
                                ? "ring-4 ring-purple-700 ring-offset-2 scale-110"
                                : ""
                            }`}
                          ></div>
                          <span className="text-sm mt-1">{color.name}</span>
                        </div>
                      </div>
                    ))}
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
                        className={`flex relative w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed items-center justify-center cursor-pointer`}
                      >
                        {card.images[imageIndex] ? (
                          <>
                            <img
                              src={card.images[imageIndex]}
                              alt={`Uploaded ${imageIndex + 1}`}
                              className="h-full w-full object-cover rounded-lg"
                            />
                            <div className="absolute top-0 right-0 p-2 flex items-center justify-center space-x-2">
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
                              id="select-image-btn"
                              radius="sm"
                              color="secondary"
                              className="border-1"
                              onPress={() => handleEdit(cardIndex, imageIndex)}
                            >
                              <LibraryBig size={18} /> Select
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
        size="5xl"
        scrollBehavior="outside"
        backdrop="blur"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{""}</ModalHeader>
              <ModalBody>
                <div className="flex justify-between items-center">
                  <h2 className="mb-2 text-lg font-semibold">Image Library</h2>
                  <div className="flex items-center gap-4">
                    <h1>
                      Selected: {selectedImages.length}/
                      {difficulty === "easy"
                        ? 2
                        : difficulty === "medium"
                        ? 3
                        : 4}
                    </h1>
                    <Button
                      radius="sm"
                      color="secondary"
                      className="text-white"
                      onPress={insertImages}
                    >
                      Insert
                    </Button>
                  </div>
                </div>
                <div className="w-full">
                  <div className=" ">
                    <Tabs
                      aria-label="Filter by Color"
                      variant="underlined"
                      onChange={(e) => handleColorFilterChange(e)}
                      selectedKey={selectedColor}
                      onSelectionChange={setSelectedColor}
                    >
                      {Object.keys(groupedImages).map((color) => (
                        <Tab
                          key={color}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                          value={color}
                        />
                      ))}
                      <Tab
                        title="All"
                        value=""
                        onClick={() => setSelectedColor("")}
                      >
                        <div className=" p-4">
                          <div className="grid grid-cols-5 justify-center gap-4">
                            {displayImages.map((item) => (
                              <Card
                                key={item.id}
                                className={`  p-2 rounded-md relative overflow-hidden border transition-all duration-300 ${
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
                                        : 4) &&
                                    !selectedImages.includes(item.id)
                                  }
                                  className="absolute top-2 left-2" // Floating checkbox on the top left
                                />
                                <CardBody className="w-full h-full">
                                  <div>
                                    <img
                                      src={item.image}
                                      alt={`Color game image ${item.id}`}
                                      className="w-full h-full object-cover"
                                      onClick={() => handleImageSelect(item.id)}
                                    />
                                  </div>
                                </CardBody>
                                <CardFooter className="flex justify-center items-center">
                                  <h1 className="text-center">{item.name}</h1>
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </Tab>
                    </Tabs>
                  </div>
                  <div className=" p-4">
                    <div className="grid grid-cols-5 justify-center gap-4">
                      {filteredImages.map((item) => (
                        <Card
                          as={motion.div}
                          key={item.id}
                          initial={{ borderColor: "#7469B6" }}
                          animate={{
                            borderColor: selectedImages.includes(item.id)
                              ? "#17C964"
                              : "#7469B6",
                          }}
                          transition={{ duration: 0.3 }}
                          className={`p-2 rounded-md relative overflow-hidden border-2`}
                        >
                          <Checkbox
                            color="success"
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
                            className="absolute top-2 right-1" // Floating checkbox on the top left
                          />
                          <CardBody className="w-full h-full">
                            <div>
                              <img
                                src={item.image}
                                alt={`Color game image ${item.id}`}
                                className="w-full h-full object-cover"
                                onClick={() => handleImageSelect(item.id)}
                              />
                            </div>
                          </CardBody>
                          <CardFooter className="flex justify-center items-center">
                            <h1 className="text-center">{item.name}</h1>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      <Button
        id="add-card-btn"
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
