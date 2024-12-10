import React, { useState, useRef, useEffect } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Select,
  SelectItem,
  Skeleton,
  Tabs,
  Tab,
} from "@nextui-org/react";
import toast, { Toaster } from "react-hot-toast";

const index = () => {
  const { data: session } = useSession();

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const [displayImages, setDisplayImages] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);

  //fetch images
  const fetchImages = async () => {
    const res = await fetch("/api/getImages", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log("data", data);
    setDisplayImages(data);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchCards = async () => {
    setIsLoading(true);
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
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Add a slight delay to get the skeleton effect
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
    //prevent default form submission
    e.preventDefault();
    //return if no title
    if (!title) {
      toast.error("Please enter a title");
      return;
    }
    //return if no selected color
    for (const card of cards) {
      if (!card.color) {
        toast.error("Please select a color for each card");
        return;
      }
    }

    //return if no images
    for (const card of cards) {
      if (!card.images) {
        toast.error("Please select images for each card");
        return;
      }
    }

    await setupNewCards(cards);
    console.log("Submitting:", {
      title,
      cards,
      difficulty,
      room_code,
    });
    setIsSaving(true);

    toast.promise(
      (async () => {
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
            console.log("Color game created successfully:", data);
          }
          const currentPath = router.asPath;
          const newPath = currentPath.replace("/edit", "");
          router.push(newPath);
        } catch (error) {
          console.error("Error creating color game:", error);
          throw error;
        } finally {
          setIsSaving(false);
          fetchCards();
        }
      })(),
      {
        loading: "Saving changes...",
        success: "Color game created successfully!",
        error: "Error creating color game",
      }
    );
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

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Edit Color Game</h1>
        {isSaving ? (
          <Button isDisabled isLoading color="secondary">
            Save Changes
          </Button>
        ) : (
          <Button
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
            Save Changes
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 items-center z-0 mb-4 max-sm:flex-col">
          <Input
            isRequired
            placeholder="Enter Title"
            size="lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            radius="sm"
            classNames={{
              label: "text-white",
              inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
            }}
            variant="bordered"
            color="secondary"
          />
          <div className="flex gap-2  items-center w-full max-sm:w-full">
            {updateDifficulty ? (
              <>
                <Select
                  defaultSelectedKeys={[selectedDifficulty]}
                  onChange={handleDifficultyChange}
                  size="lg"
                  radius="sm"
                  classNames={{
                    label: "text-white",
                    mainWrapper:
                      "bg-[#ffffff] border-1 border-[#7469B6]  rounded-lg",
                  }}
                  placeholder="Difficulty"
                  variant="bordered"
                  isRequired
                  className="w-full max-sm:w-full"
                >
                  <SelectItem key="easy">Easy (2 images)</SelectItem>
                  <SelectItem key="medium">Medium (3 images)</SelectItem>
                  <SelectItem key="hard">Hard (4 images)</SelectItem>
                </Select>
                <Button
                  size="lg"
                  color="danger"
                  variant="flat"
                  radius="sm"
                  onClick={() => setUpdateDifficulty(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                radius="sm"
                onClick={() => setUpdateDifficulty(!updateDifficulty)}
                color="secondary"
              >
                Edit Difficulty
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({ length: cards.length }).map((_, index) => (
                <Skeleton key={index} className="rounded-md w-full h-96	" />
              ))
            ) : (
              <>
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
                        <h1 className="mb-4 font-bold text-lg">
                          Choose a color
                        </h1>
                        <div className="grid grid-cols-5 gap-6 mx-2 my-2 max-sm:gap-4 max-sm:max-0">
                          {colors.map((color) => (
                            <div key={color.value} className="relative">
                              <div className="flex flex-col items-center space-y-2">
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
                                <span className="text-sm mt-1">
                                  {color.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
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
                              className={`flex  relative  w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed items-center justify-center cursor-pointer`}
                            >
                              {image ? (
                                <>
                                  <img
                                    src={image}
                                    alt={`Image ${imageIndex + 1}`}
                                    className="h-full w-full object-cover rounded-lg"
                                  />
                                  <div className="absolute top-0 right-0 p-2 flex items-center justify-center space-x-2">
                                    <Button
                                      isIconOnly
                                      onClick={() => {
                                        const updatedCards = [...cards];
                                        updatedCards[cardIndex].images[
                                          imageIndex
                                        ] = null;
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
                                    onPress={() =>
                                      handleEdit(cardIndex, imageIndex)
                                    }
                                  >
                                    <LibraryBig size={18} /> Select
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
                                radius="sm"
                                variant="bordered"
                                color="secondary"
                                className="border-1"
                                onPress={() =>
                                  handleEdit(
                                    cardIndex,
                                    card.images.length + index
                                  )
                                }
                              >
                                <LibraryBig /> Select
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </>
            )}
          </div>
          {/* <div className="mt-4 flex justify-between">
            <Button color="secondary" onClick={handleAddCard} type="button">
              Add Card
            </Button>
            {isSaving ? (
              <Button color="primary" type="submit" isDisabled isLoading>
                Save Changes
              </Button>
            ) : (
              <Button color="primary" type="submit" isDisabled={!title}>
                Save Changes
              </Button>
            )}
          </div> */}
        </div>
      </form>

      {/* <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        scrollBehavior="inside"
      >
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
                            <p className="text-sm text-gray-500">{item.name}</p>
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
      </Modal> */}

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
                                  : 4) && !selectedImages.includes(item.id)
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
                </div>
              </ModalBody>
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

export default index;
