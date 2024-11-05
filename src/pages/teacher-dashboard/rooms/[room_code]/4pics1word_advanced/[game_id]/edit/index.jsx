import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { CircleCheck, Volume2, Trash2, Upload, Plus } from "lucide-react";
import ReactCrop from "react-image-crop";
import toast, { Toaster } from "react-hot-toast";
import "react-image-crop/dist/ReactCrop.css";
import {
  Card,
  CardBody,
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
  Divider,
  CardHeader,
  Tabs,
  Tab,
} from "@nextui-org/react";
import Loader from "@/pages/components/Loader";
const Index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef([]);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [updateDifficulty, setUpdateDifficulty] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 10,
    height: 10,
    x: 25,
    y: 25,
  });
  const imgRef = useRef(null);

  // Track dragging state
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [loading, setLoading] = useState(true); // State to track loading

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
        imageUrls: [null, null, null, null],
        correct_answers: [],
        isNew: true,
      },
    ];
    setCards(newCards);
    initializeRefs(newCards.length); // Initialize refs for the new card
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
        // Reset crop settings
        setCrop({
          unit: "%",
          width: 50,
          height: 50,
          x: 25,
          y: 25,
        });
        setIsOpen(false); // Close modal
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
  // Track which modal is open
  const [openModalIndices, setOpenModalIndices] = useState({
    cardIndex: null,
    imageIndex: null,
  });
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
      console.log("removed card id:", removedCard.four_pics_advanced_id);
      try {
        const response = await fetch(
          `/api/4pics1word_advanced/update_4pics1word_advanced/update_4pics1word_advanced?four_pics_advanced_id=${removedCard.four_pics_advanced_id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          console.log("Card deleted successfully");
        } else {
          console.error("Error deleting card");
        }
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch(
        `/api/4pics1word_advanced/4pics1word_advanced?game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      console.log("data", data);
      if (Array.isArray(data) && data.length > 0) {
        const formattedCards = data.map((card) => ({
          difficulty: card.difficulty,
          title: card.title,
          word: card.word,
          images: [card.image1, card.image2, card.image3, card.image4],
          imageUrls: [card.image1, card.image2, card.image3, card.image4],

          four_pics_advanced_id: card.four_pics_advanced_id,
          four_pics_advanced_set_id: card.four_pics_advanced_set_id,
          correct_answers: card.correct_answer.split(",").map(Number),
          game_id: card.game_id,
        }));

        setCards(formattedCards);
        setDifficulty(formattedCards[0].difficulty);
        setSelectedDifficulty(formattedCards[0].difficulty);
        setTitle(formattedCards[0].title);
        console.log("Cards fetched successfully:", formattedCards);

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
        setLoading(false);
      }, 500); // Add a slight delay to get the skeleton effect
    }
  };

  const setupNewCards = async (cards) => {
    const newCards = cards.filter((card) => card.isNew === true);
    console.log("newCards", newCards);

    if (newCards.length > 0) {
      for (const card of newCards) {
        card.four_pics_advanced_set_id = cards[0].four_pics_advanced_set_id;
        card.title = cards[0].title;
        console.log("Card being sent:", card);

        try {
          const response = await fetch(
            "/api/4pics1word_advanced/update_4pics1word_advanced/update_4pics1word_advanced",
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

  const getImageHolders = (card, cardIndex) => {
    let imageCount;
    if (selectedDifficulty === "easy") {
      imageCount = 2;
    } else if (selectedDifficulty === "medium") {
      imageCount = 3;
    } else {
      imageCount = 4;
    }
    const outOfBounds = card.correct_answers.some((answer) => {
      return answer >= imageCount;
    });

    const handleInsertImageFromUrl = (cardIndex, imageIndex) => {
      const updatedCards = [...cards];
      updatedCards[cardIndex].images[imageIndex] = tempImage;
      setCards(updatedCards);
    };

    return (
      <div className={`grid ${1} gap-4`}>
        {/* {card.word && (
          <Button
            className="mb-4"
            color="secondary"
            onPress={() => handleTextToSpeech(card.word)}
          >
            <Volume2 />
          </Button>
        )} */}
        {/* <h1>Card id: {card.four_pics_advanced_id}</h1> */}
        {outOfBounds && (
          <div className="text-red-500 mb-4">
            One or more correct answers are out of bounds for the selected
            difficulty.
          </div>
        )}
        <div className={`grid grid-cols-2 gap-2 justify-around`}>
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
                <>
                  <div className="absolute top-0 right-0 flex items-center justify-center space-x-2 p-2 z-10">
                    {/* <Input
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
                      Replace
                    </Button> */}
                    <Button
                      isIconOnly
                      onClick={() => {
                        const updatedCards = [...cards];
                        updatedCards[cardIndex].images[imageIndex] = null;
                        setCards(updatedCards);
                      }}
                      color="danger"
                      size="sm"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                  <div className="absolute p-2 z-10 top-0 left-0">
                    {/* <Button
                      onClick={() => handleEdit(cardIndex, imageIndex)}
                      color="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        const updatedCards = [...cards];
                        updatedCards[cardIndex].images[imageIndex] = null;
                        setCards(updatedCards);
                      }}
                      color="danger"
                      size="sm"
                    >
                      Delete
                    </Button> */}

                    {card.correct_answers.includes(imageIndex) ? (
                      <div
                        className="bg-green-500 p-2 rounded-full"
                        style={{ color: "#fff" }}
                        onClick={() => {
                          const updatedCards = [...cards];
                          updatedCards[cardIndex].correct_answers =
                            updatedCards[cardIndex].correct_answers.filter(
                              (index) => index !== imageIndex
                            );
                          setCards(updatedCards);
                        }}
                      >
                        <div>
                          <CircleCheck size={20} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="p-2 bg-slate-400 rounded-full"
                        style={{ color: "#fff" }}
                        onClick={() => {
                          const updatedCards = [...cards];
                          updatedCards[cardIndex].correct_answers.push(
                            imageIndex
                          );
                          setCards(updatedCards);
                        }}
                      >
                        <CircleCheck size={20} />
                      </div>
                    )}
                  </div>
                  <img
                    src={image}
                    alt={`Uploaded ${imageIndex + 1}`}
                    className="h-full w-full object-cover rounded-lg"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Button
                    radius="sm"
                    variant="bordered"
                    color="secondary"
                    className="border-1"
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
                    Upload Image
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
                                    <div
                                      className="w-full h-full"
                                      // onWheel={handleWheel}
                                    >
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

                  {/* <span className="text-gray-400">Drag & Drop Image</span>
                  <Button
                    color="secondary"
                    onClick={() => handleEdit(cardIndex, imageIndex)}
                  >
                    Upload Image
                  </Button>
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
                      Add
                    </Button>
                  </div> */}
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
      </div>
    );
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Please enter a title.");
      return;
    }
    for (const card of cards) {
      if (!card.word) {
        toast.error("Please enter a word for each card.");
        return;
      }
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

    for (const card of cards) {
      if (card.correct_answers.length === 0) {
        toast.error("Please select the correct answer for each card.");
        return;
      }
    }

    for (const card of cards) {
      let imagesToRender = card.images;
      if (difficulty === "easy" || selectedDifficulty === "easy") {
        imagesToRender = card.images.slice(0, 2);
      } else if (difficulty === "medium" || selectedDifficulty === "medium") {
        imagesToRender = card.images.slice(0, 3);
      } else if (difficulty === "hard" || selectedDifficulty === "hard") {
        imagesToRender = card.images.slice(0, 4);
      }
      let imageCount;
      if (selectedDifficulty === "easy") {
        imageCount = 2;
      } else if (selectedDifficulty === "medium") {
        imageCount = 3;
      } else {
        imageCount = 4;
      }
      const outOfBounds = card.correct_answers.some((answer) => {
        return answer >= imageCount;
      });

      if (outOfBounds) {
        toast.error(
          "One or more correct answers are out of bounds for the selected difficulty."
        );
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
          let allUpdatesSuccessful = true;
          for (const card of cardsToUpdate) {
            const body = JSON.stringify({
              title: title, // Pass the title for the card set
              cards: card, // Pass the modified card details (with images and word)
              difficulty: selectedDifficulty || difficulty,
              game_id: game_id,
            });
            const response = await fetch(
              `/api/4pics1word_advanced/4pics1word_advanced?four_pics_advanced_id=${card.four_pics_advanced_id}`,
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
              allUpdatesSuccessful = false;
            }
          }
          if (allUpdatesSuccessful) {
            fetchCards(); // Refresh cards after updating
          }
        } catch (error) {
          console.error("Error saving cards:", error);
          throw error;
        } finally {
          setIsSaving(false);
        }
      })(),
      {
        loading: "Saving cards...",
        success: "All cards updated successfully!",
        error: "Error saving cards.",
      }
    );
  };

  useEffect(() => {
    if (game_id) {
      fetchCards().then(() => {
        initializeRefs(cards.length);
      });
    }
  }, [game_id]);

  useEffect(() => {
    initializeRefs(cards.length);
  }, [cards.length]);

  const handleTextToSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const synth = window.speechSynthesis;

    let voices = synth.getVoices();

    if (!voices.length) {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices();
        setVoiceAndSpeak(voices[1]);
      };
    } else {
      console.log("voices:", voices);
      setVoiceAndSpeak(voices[1]);
    }

    function setVoiceAndSpeak(selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4  mx-auto max-w-[80rem] ">
      <Toaster />
      {loading ? (
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
            <h1>Edit a ThinkPic+ Set</h1>
            <div>
              {isSaving ? (
                <Button isLoading isDisabled color="secondary" radius="sm">
                  Save Changes
                </Button>
              ) : (
                <Button
                  radius="sm"
                  color="secondary"
                  onPress={handleSave}
                  isDisabled={!title || !difficulty || cards.length < 2}
                >
                  Save Changes
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center z-0 max-sm:flex-col">
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

            <div className="flex gap-2  items-center w-full max-sm:w-full">
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

          <div className="">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cards.map((card, cardIndex) => {
                let imagesToRender = card.images;
                if (difficulty === "easy" || selectedDifficulty === "easy") {
                  imagesToRender = card.images.slice(0, 2);
                } else if (
                  difficulty === "medium" ||
                  selectedDifficulty === "medium"
                ) {
                  imagesToRender = card.images.slice(0, 3);
                } else if (
                  difficulty === "hard" ||
                  selectedDifficulty === "hard"
                ) {
                  imagesToRender = card.images.slice(0, 4);
                }

                return (
                  <Card
                    key={cardIndex}
                    className="w-full border border-[#7469B6] rounded-md flex p-4"
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
                      <div className="flex gap-2 shrink w-full mb-4 items-center">
                        <Input
                          label="Word"
                          radius="sm"
                          size="sm"
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
                          }}
                        />
                        {card.word && (
                          <Button
                            size="lg"
                            radius="sm"
                            isIconOnly
                            color="secondary"
                            onPress={() => handleTextToSpeech(card.word)}
                          >
                            <Volume2 />
                          </Button>
                        )}
                      </div>
                      {getImageHolders(card, cardIndex)}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
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
                        <img
                          src={tempImage}
                          onLoad={onImageLoad}
                          alt="Crop preview"
                          className="w-full h-full object-contain"
                        />
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
        </>
      )}
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
    </div>
  );
};

export default Index;
