import React, { useState, useEffect, useRef } from "react";
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
  Tabs,
  Tab,
} from "@nextui-org/react";
import { Image, Pencil, Plus, Trash2, ScanSearch, Upload } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
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
  const [openModalIndices, setOpenModalIndices] = useState({
    cardIndex: null,
    imageIndex: null,
  });
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
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Add a slight delay to get the skeleton effect
    }
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
      toast.error("Please enter a word for each card.");
      return;
    }
    if (!title) {
      toast.error("Please enter a title.");
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
        toast.error(`Please upload all images slots for each card.`);
        return;
      }
    }
    setIsSaving(true);

    toast.promise(
      (async () => {
        try {
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

            if (!response.ok) {
              throw new Error("Error updating card");
            }
          }
          setHasUnsavedChanges(false); // Reset unsaved changes flag
          // After successful save, navigate back
          const currentPath = router.asPath;
          const newPath = currentPath.replace("/edit", "");
          router.push(newPath);
        } catch (error) {
          console.error("Error saving cards:", error);
          throw error;
        } finally {
          fetchCards(); // Refresh cards after updating
          setIsSaving(false);
        }
      })(),
      {
        loading: "Saving cards...",
        success: "Cards updated successfully",
        error: "Error updating cards",
      }
    );
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

    // useEffect(() => {
    //   // Simulate loading
    //   const timer = setTimeout(() => {
    //     setIsLoading(false);
    //   }, 1000);

    //   return () => clearTimeout(timer);
    // }, []);

    return (
      <div className={`grid grid-cols-2 gap-2 justify-around`}>
        <Toaster />
        {card.images.slice(0, imageCount).map((image, imageIndex) => (
          <div
            key={imageIndex}
            className={`flex flex-col relative aspect-square rounded-lg border-2 border-[#9183e2] border-dashed bg-gray-100 items-center justify-center cursor-pointer `}
            onDragEnter={(e) => handleDragEnter(e, cardIndex, imageIndex)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, cardIndex, imageIndex)}
            onDragOver={(e) => e.preventDefault()}
          >
            {image ? (
              <div className="w-full flex flex-col">
                <img
                  src={image.startsWith("data:") ? image : `${image}`}
                  alt={`Uploaded ${imageIndex + 1}`}
                  className="h-full w-full object-cover rounded-lg"
                />
                <div className="absolute top-0 right-0 p-2 flex items-center justify-center space-x-2">
                  {/* <Button
                    isIconOnly
                    size="sm"
                    color="secondary"
                    onClick={() => handleEdit(cardIndex, imageIndex)}
                  >
                    <Pencil size={18} />
                  </Button> */}
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
                {/* <div className="flex gap-4 items-center justify-center">
                  <Input
                    label="Image URLs"
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
                  
                </div> */}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Button
                  radius="sm"
                  color="secondary"
                  onClick={() => {
                    setOpenModalIndices({
                      cardIndex,
                      imageIndex,
                    });
                    setSelectedCardIndex(cardIndex);
                    setSelectedImageIndex(imageIndex);
                  }}
                >
                  <Upload size={20} />
                  <span className="max-sm:hidden">Upload Image</span>
                  <span className="sm:hidden">Upload</span>
                </Button>

                <Modal
                  isOpen={
                    openModalIndices.cardIndex === cardIndex &&
                    openModalIndices.imageIndex === imageIndex
                  }
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setOpenModalIndices({
                        cardIndex: null,
                        imageIndex: null,
                      });
                      setTempImage(null);
                    }
                  }}
                  size="lg"
                >
                  <ModalContent>
                    {(onClose) => (
                      <>
                        <ModalHeader className="flex flex-col gap-1">
                          Upload Image
                        </ModalHeader>
                        <ModalBody>
                          <div className="w-full">
                            <Tabs aria-label="Options" fullWidth>
                              <Tab key="drag" title="Drag & Drop">
                                <div
                                  className="rounded-lg border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) {
                                      handleFlashcardImageChange(cardIndex, {
                                        target: {
                                          files: [file],
                                        },
                                      });
                                    }
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`imageUpload-${cardIndex}`}
                                    onChange={(e) => {
                                      handleFileChange(
                                        e,
                                        cardIndex,
                                        imageIndex
                                      );
                                    }}
                                  />
                                  <label
                                    htmlFor={`imageUpload-${cardIndex}`}
                                    className="block"
                                  >
                                    Drag or upload your image here
                                  </label>
                                  <Button
                                    radius="sm"
                                    variant="bordered"
                                    color="secondary"
                                    className="mt-4"
                                    onClick={() => {
                                      document
                                        .getElementById(
                                          `imageUpload-${cardIndex}`
                                        )
                                        .click();
                                    }}
                                  >
                                    <Upload size={20} />
                                    Upload Image
                                  </Button>
                                </div>
                                {tempImage && (
                                  <div className="w-full h-full">
                                    <ReactCrop
                                      className="w-full h-full"
                                      src={tempImage}
                                      crop={crop}
                                      onChange={(newCrop) => setCrop(newCrop)}
                                      aspect={1}
                                    >
                                      <img
                                        src={tempImage}
                                        onLoad={onImageLoad}
                                        alt="Crop preview"
                                        className="w-full h-full object-contain"
                                        // style={{
                                        //   transform: `scale(${zoom})`,
                                        // }}
                                      />
                                    </ReactCrop>
                                  </div>
                                )}
                              </Tab>
                              <Tab key="url" title="Image URL">
                                <div className="flex gap-2">
                                  <Input
                                    radius="sm"
                                    placeholder="Image URL"
                                    variant="bordered"
                                    color="secondary"
                                    className="text-[#7469B6] w-full"
                                    onChange={(e) => {
                                      setTempImage(e.target.value);
                                    }}
                                  />
                                  <Button
                                    radius="sm"
                                    color="secondary"
                                    isDisabled={!tempImage}
                                    onClick={() => {
                                      handleInsertImageFromUrl(
                                        cardIndex,
                                        imageIndex
                                      );
                                      onClose();
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </Tab>
                            </Tabs>
                          </div>
                        </ModalBody>
                        <ModalFooter>
                          <Button
                            variant="flat"
                            radius="sm"
                            color="danger"
                            onPress={onClose}
                            onClick={() => {
                              setTempImage(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            radius="sm"
                            isDisabled={!tempImage}
                            color="secondary"
                            onClick={() => {
                              handleCrop();
                              onClose();
                            }}
                          >
                            Insert
                          </Button>
                        </ModalFooter>
                      </>
                    )}
                  </ModalContent>
                </Modal>
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
    <div className="w-full flex flex-col gap-4 p-4  mx-auto max-w-[80rem] ">
      {isLoading ? (
        Array.from({ length: Math.ceil(cards.length / 2) }).map(
          (_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, colIndex) => {
                const cardIndex = rowIndex * 2 + colIndex;
                if (cardIndex >= cards.length) return null;
                return (
                  <Card
                    key={cardIndex}
                    className="w-full border border-slate-800 rounded-md flex"
                  >
                    <CardBody>
                      <div className="flex flex-col w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                        <Skeleton className="w-full h-6 rounded-md mb-4" />
                        <div className="grid grid-cols-2 gap-4 justify-center max-sm:gap-2">
                          {Array.from({ length: 4 }).map((_, imgIndex) => (
                            <Skeleton
                              key={imgIndex}
                              className="w-[18rem] aspect-square bg-gray-100 rounded-lg max-sm:w-[14rem]"
                            />
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )
        )
      ) : (
        <>
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <h1>Edit ThinkPic Set</h1>
            {isSaving ? (
              <Button
                isLoading
                isDisabled
                color="secondary"
                radius="sm"
                onClick={handleSave}
                className="mt-5"
              >
                Save Changes
              </Button>
            ) : (
              <Button
                radius="sm"
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
          <div className="flex gap-2 items-center z-0">
            <Input
              placeholder="Enter title"
              value={title}
              size="lg"
              radius="sm"
              onChange={(e) => setTitle(e.target.value)}
              isRequired
              classNames={{
                label: "text-white",
                inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
              }}
              variant="bordered"
              color="secondary"
              className="w-full max-sm:w-full"
            />
            <div className="flex gap-2  items-center w-full">
              {updateDifficulty ? (
                <>
                  <Select
                    size="lg"
                    radius="sm"
                    classNames={{
                      label: "text-white",
                      mainWrapper:
                        "bg-[#ffffff] border-1 border-[#7469B6]  rounded-lg",
                    }}
                    placeholder="Difficulty"
                    variant="bordered"
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
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
                  <div className="flex">
                    <Button
                      radius="sm"
                      isIconOnly
                      onPress={() => handleRemoveCard(cardIndex)}
                      color="danger"
                    >
                      <Trash2 size={22} />
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex w-full gap-4 justify-between">
                    <form action="" className="w-full">
                      <div className="flex shrink w-full mb-4">
                        <Input
                          isRequired
                          radius="sm"
                          label="Word"
                          variant="bordered"
                          color="secondary"
                          classNames={{
                            label: "",
                            inputWrapper: "border-1 border-[#7469B6]",
                          }}
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

          {/* <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
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
          </Modal> */}
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
