import React, { useState, useEffect, useRef } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { useRouter } from "next/router";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Divider,
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Skeleton,
} from "@nextui-org/react";
import { Image, Pencil, Plus, Trash2, ScanSearch } from "lucide-react";
import Loader from "@/pages/components/Loader";

const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);
  const fileInputRefs = useRef([]);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [updateDifficulty, setUpdateDifficulty] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 10,
    height: 10,
    x: 25,
    y: 25,
  });
  const imgRef = useRef(null);

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  // Track dragging state
  const [draggingIndex, setDraggingIndex] = useState(null);

  const initializeRefs = (numCards) => {
    const totalSlots = numCards * 4; // 4 image refs per card

    for (let i = 0; i < totalSlots; i++) {
      if (!fileInputRefs.current[i]) {
        fileInputRefs.current[i] = React.createRef();
      }
    }
  };

  const handleFileChange = (e, cardIndex, imageIndex) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target.result);
        setSelectedCardIndex(cardIndex);
        setSelectedImageIndex(imageIndex);
        setIsOpen(true); // Open modal for cropping
        setHasUnsavedChanges(true); // Mark as having unsaved changes
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (cardIndex, imageIndex) => {
    const refIndex = cardIndex * 4 + imageIndex;
    const inputRef = fileInputRefs.current[refIndex];

    if (inputRef && inputRef.current) {
      inputRef.current.click(); // Trigger file input click
    } else {
      console.error(`Ref at index ${refIndex} is not initialized properly.`);
    }
  };

  const handleAddCard = () => {
    const newCards = [
      ...cards,
      {
        word: "",
        images: [null, null, null, null],
        imageUrls: [null, null, null, null], // Initialize imageUrls array
        isNew: true,
      },
    ];
    setCards(newCards);
    initializeRefs(newCards.length); // Initialize refs for the new card
    setHasUnsavedChanges(true); // Mark as having unsaved changes
  };

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
  };

  const getCroppedImg = () => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      // Convert canvas to Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas is empty.");
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        1
      );
    });
  };

  const handleCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = () => {
        const base64data = reader.result;
        const updatedCards = [...cards];
        updatedCards[selectedCardIndex].images[selectedImageIndex] = base64data;
        setCards(updatedCards);
        console.log("updatedCards", updatedCards);
        // Reset crop settings
        setCrop({
          unit: "%",
          width: 50,
          height: 50,
          x: 25,
          y: 25,
        });
        setIsOpen(false); // Close modal
        setHasUnsavedChanges(true); // Mark as having unsaved changes
      };
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  // Handle drag enter
  const handleDragEnter = (e, cardIndex, imageIndex) => {
    e.preventDefault();
    setDraggingIndex({ cardIndex, imageIndex });
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDraggingIndex(null);
  };

  // Handle drop
  const handleDrop = (e, cardIndex, imageIndex) => {
    e.preventDefault();
    setDraggingIndex(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target.result);
        setSelectedCardIndex(cardIndex);
        setSelectedImageIndex(imageIndex);
        setIsOpen(true); // Open modal for cropping
        setHasUnsavedChanges(true); // Mark as having unsaved changes
      };
      reader.readAsDataURL(file);
    }
  };

  //remove card
  const handleRemoveCard = async (cardIndex) => {
    const userConfirmed = confirm(
      "Are you sure you want to delete this 4pics1word card?"
    );
    if (userConfirmed) {
      const updatedCards = [...cards];
      const removedCard = updatedCards.splice(cardIndex, 1)[0];
      setCards(updatedCards);
      console.log("removed flashcard id:", removedCard.four_pics_one_word_id);
      try {
        const response = await fetch(
          `/api/4pics1word/update_4pic1word/update_4pics1word?four_pics_one_word_id=${removedCard.four_pics_one_word_id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          console.log("Card deleted successfully");
          setHasUnsavedChanges(true); // Mark as having unsaved changes
        } else {
          console.error("Error deleting card");
        }
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/4pics1word/4pics1word?game_id=${game_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const formattedCards = data.map((card) => ({
          difficulty: card.difficulty,
          title: card.title,
          word: card.word,
          images: [card.image1, card.image2, card.image3, card.image4],
          imageUrls: [card.image1, card.image2, card.image3, card.image4],
          four_pics_one_word_id: card.four_pics_one_word_id,
          four_pics_one_word_set_id: card.four_pics_one_word_set_id,
        }));

        setCards(formattedCards);
        setTitle(formattedCards[0].title);
        setDifficulty(formattedCards[0].difficulty);
        setSelectedDifficulty(formattedCards[0].difficulty);
        console.log("Cards fetched successfullyyy:", formattedCards);

        // Initialize refs after cards are fetched and set
        initializeRefs(formattedCards.length);
      } else {
        console.error("No cards data received or invalid data format");
      }

      if (!res.ok) {
        console.error("Error fetching cards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
    setIsLoading(false);
  };

  const setupNewCards = async (cards) => {
    const newCards = cards.filter((card) => card.isNew === true);
    if (newCards.length > 0) {
      for (const card of newCards) {
        card.four_pics_one_word_set_id = cards[0].four_pics_one_word_set_id;
        card.title = cards[0].title;
        try {
          const response = await fetch(
            "/api/4pics1word/update_4pic1word/update_4pics1word",
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
            const data = await response.json();
            console.log("Card data:", data);
          } else {
            console.error("Error creating card");
          }
        } catch (error) {
          console.error("Error creating card:", error);
        }
      }
    }
  };

  const handleSave = async () => {
    //if there is no word return
    if (cards.some((card) => card.word === "")) {
      alert("Please enter a word for each card.");
      return;
    }
    if (!title) {
      alert("Please enter a title.");
      return;
    }
    for (const card of cards) {
      let requiredImages = 4; // Default to 4 images for "hard" difficulty
      const currentDifficulty = selectedDifficulty || difficulty;
      if (currentDifficulty === "easy") {
        requiredImages = 2;
      } else if (currentDifficulty === "medium") {
        requiredImages = 3;
      } else if (currentDifficulty === "hard") {
        requiredImages = 4;
      }

      if (
        card.images.filter((image) => image !== null).length < requiredImages
      ) {
        alert(`Please upload all  images slots for each card.`);
        return;
      }
    }

    try {
      setIsSaving(true);
      await setupNewCards(cards); // Handle new cards creation if necessary
      const cardsToUpdate = cards.filter((c) => !c.isNew); // Filter out new cards
      console.log("cardsToUpdate", cardsToUpdate);
      for (const card of cardsToUpdate) {
        const body = JSON.stringify({
          title: title, // Pass the title for the card set
          cards: card, // Pass the modified card details (with images and word)
          difficulty: selectedDifficulty || difficulty,
          game_id: game_id,
        });

        const response = await fetch(
          `/api/4pics1word/4pics1word?four_pics_one_word_id=${card.four_pics_one_word_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: body,
          }
        );

        if (response.ok) {
          console.log("Card updated successfully");
        } else {
          console.error("Error updating card");
        }
      }
      alert("Cards updated successfully");
      setHasUnsavedChanges(false); // Reset unsaved changes flag
    } catch (error) {
      console.error("Error saving cards:", error);
    } finally {
      fetchCards(); // Refresh cards after updating
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Ensure refs are initialized once cards are fetched
    if (game_id) {
      fetchCards().then(() => {
        // Initialize refs after cards have been set
        initializeRefs(cards.length);
      });
    }
  }, [game_id]);

  useEffect(() => {
    // Reinitialize refs whenever cards length changes (e.g., after adding a card)
    initializeRefs(cards.length);
  }, [cards.length]);

  // Function to dynamically set Chip color based on room difficulty
  const getChipColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "success";
      case "moderate":
        return "warning";
      case "hard":
        return "danger";
      default:
        return "default"; // fallback if the difficulty is not recognized
    }
  };

  const getImageHolders = (card, cardIndex) => {
    let imageCount;
    if (selectedDifficulty === "easy") {
      imageCount = 2;
    } else if (selectedDifficulty === "medium") {
      imageCount = 3;
    } else {
      imageCount = 4;
    }

    const gridCols = imageCount === 3 ? "grid-cols-3" : "grid-cols-2";
    const handleInsertImageFromUrl = (cardIndex, imageIndex) => {
      const updatedCards = [...cards];
      updatedCards[cardIndex].images[imageIndex] = tempImage;
      setCards(updatedCards);
      setHasUnsavedChanges(true); // Mark as having unsaved changes
    };
    return (
      <div className="flex flex-wrap gap-4 justify-center max-sm:gap-2">
        {card.images.slice(0, imageCount).map((image, imageIndex) => (
          <div
            key={imageIndex}
            className={`relative block w-[18rem] aspect-square bg-gray-100 rounded-lg border-2 max-sm:w-[14rem] ${
              draggingIndex?.cardIndex === cardIndex &&
              draggingIndex?.imageIndex === imageIndex
                ? "border-green-500"
                : "border-dashed border-gray-300"
            } flex items-center justify-center cursor-pointer`}
            onDragEnter={(e) => handleDragEnter(e, cardIndex, imageIndex)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, cardIndex, imageIndex)}
            onDragOver={(e) => e.preventDefault()}
          >
            {image ? (
              <div className="flex flex-col">
                <img
                  src={image.startsWith("data:") ? image : `${image}`}
                  alt={`Uploaded ${imageIndex + 1}`}
                  className="h-full w-full object-cover rounded-lg"
                />
                <div className="absolute top-0 right-0 p-2 flex items-center justify-center space-x-2">
                  <Button
                    isIconOnly
                    size="sm"
                    color="secondary"
                    onClick={() => handleEdit(cardIndex, imageIndex)}
                  >
                    <Pencil size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    onClick={() => {
                      const updatedCards = [...cards];
                      updatedCards[cardIndex].images[imageIndex] = null;
                      setCards(updatedCards);
                      console.log("updatedCards", updatedCards);
                      setHasUnsavedChanges(true); // Mark as having unsaved changes
                    }}
                    color="danger"
                    size="sm"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                <div className="flex gap-4 items-center justify-center">
                  <Input
                    label="Image URL"
                    variant="underlined"
                    color="secondary"
                    className="text-[#7469B6] px-2 z-0"
                    value={card.imageUrls?.[imageIndex] || ""}
                    onChange={(e) => {
                      const updatedCards = [...cards];
                      if (!updatedCards[cardIndex].imageUrls) {
                        updatedCards[cardIndex].imageUrls = [];
                      }
                      updatedCards[cardIndex].imageUrls[imageIndex] =
                        e.target.value;
                      setCards(updatedCards);
                      setTempImage(e.target.value);
                    }}
                  />
                  <Button
                    color="secondary"
                    onClick={() =>
                      handleInsertImageFromUrl(cardIndex, imageIndex)
                    }
                  >
                    Edit
                  </Button>
                  {/* <h1>{card.imageUrls[imageIndex]}</h1> */}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <span className="text-gray-400">Drag & Drop Image</span>
                <Button
                  color="secondary"
                  onClick={() => handleEdit(cardIndex, imageIndex)}
                >
                  Upload Image
                </Button>
                <div className="flex gap-4">
                  <Input
                    label="Image URL"
                    variant="underlined"
                    color="secondary"
                    className="text-[#7469B6] px-2 z-0"
                    value={card.imageUrls?.[imageIndex] || ""}
                    onChange={(e) => {
                      const updatedCards = [...cards];
                      if (!updatedCards[cardIndex].imageUrls) {
                        updatedCards[cardIndex].imageUrls = [];
                      }
                      updatedCards[cardIndex].imageUrls[imageIndex] =
                        e.target.value;
                      setCards(updatedCards);
                      setTempImage(e.target.value);
                    }}
                  />
                  <Button
                    color="secondary"
                    onClick={() =>
                      handleInsertImageFromUrl(cardIndex, imageIndex)
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRefs.current[cardIndex * 4 + imageIndex]}
              className="hidden"
              onChange={(e) => handleFileChange(e, cardIndex, imageIndex)}
            />
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        const confirmationMessage =
          "You have unsaved changes. Are you sure you want to leave?";
        event.returnValue = confirmationMessage; // For most browsers
        return confirmationMessage; // For some browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen w-full">
          <Skeleton className="w-full h-[800px] rounded-md" />
        </div>
      ) : (
        <>
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <h1>Edit ThinkPic Set</h1>
            {isSaving ? (
              <Button
                isLoading
                isDisabled
                color="secondary"
                onClick={handleSave}
                className="mt-5"
              >
                Save Changes
              </Button>
            ) : (
              <Button
                color="secondary"
                onClick={handleSave}
                isDisabled={!title}
                className="mt-5"
              >
                Save Changes
              </Button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <h1 className="text-lg font-bold">Difficulty:</h1>
            <Chip
              color={getChipColor(difficulty)}
              radius="sm"
              className="text-base text-white py-4 capitalize"
            >
              {difficulty}
            </Chip>
          </div>
          <div className="flex gap-2 items-center z-0 max-sm:flex-col">
            <Input
              isRequired
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2 justify-end items-center max-sm:w-full">
              {updateDifficulty ? (
                <>
                  <Select
                    isRequired
                    label="Difficulty"
                    defaultSelectedKeys={[selectedDifficulty]}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-[15rem] max-sm:w-full"
                  >
                    <SelectItem value="easy" key="easy">
                      Easy
                    </SelectItem>
                    <SelectItem value="medium" key="medium">
                      Medium
                    </SelectItem>
                    <SelectItem value="hard" key="hard">
                      Hard
                    </SelectItem>
                  </Select>
                  <Button onClick={() => setUpdateDifficulty(false)}>
                    Cancel
                  </Button>
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
                  <div className="flex">
                    <Button
                      isIconOnly
                      onPress={() => handleRemoveCard(cardIndex)}
                      color="danger"
                    >
                      <Trash2 size={22} />
                    </Button>
                  </div>
                </CardHeader>
                <Divider className="m-0 h-0.5 bg-slate-300" />
                <CardBody>
                  <div className="flex w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                    <form action="" className="w-full">
                      <div className="flex shrink w-full mb-4">
                        <Input
                          label="Word"
                          variant="underlined"
                          color="secondary"
                          className="text-[#7469B6] px-2 z-0"
                          value={card.word}
                          onChange={(e) => {
                            const updatedCards = [...cards];
                            updatedCards[cardIndex].word = e.target.value;
                            setCards(updatedCards);
                            setHasUnsavedChanges(true); // Mark as having unsaved changes
                          }}
                        />
                      </div>
                      <div>{getImageHolders(card, cardIndex)}</div>
                    </form>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
            <ModalContent>
              <ModalHeader className="flex flex-col gap-1">
                Crop Image
              </ModalHeader>
              <ModalBody>
                {tempImage && (
                  <div className="w-full h-full">
                    <ReactCrop
                      src={tempImage}
                      crop={crop}
                      onChange={(newCrop) => setCrop(newCrop)}
                      onImageLoaded={onImageLoad}
                      aspect={1}
                    >
                      {tempImage && (
                        <>
                          <img
                            src={tempImage}
                            onLoad={onImageLoad}
                            alt="Crop preview"
                            className="w-full h-full object-contain"
                          />
                        </>
                      )}
                    </ReactCrop>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  auto
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  color="secondary"
                >
                  Close
                </Button>
                <Button auto onClick={handleCrop} color="primary">
                  Crop Image
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Button
            size="lg"
            radius="sm"
            color="secondary"
            className="my-4 text-sm"
            onClick={handleAddCard}
            startContent={<Plus size={22} />}
          >
            Add
          </Button>
        </>
      )}
    </div>
  );
};

export default index;
