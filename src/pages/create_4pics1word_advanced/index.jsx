import React, { useState, useRef, useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  CircleCheck,
  Volume2,
  Trash2,
  Plus,
  Pencil,
  Upload,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
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
  Checkbox,
  CheckboxGroup,
  Spinner,
  Tabs,
  Tab,
} from "@nextui-org/react";
import toast, { Toaster } from "react-hot-toast";
// import PreviewThinkpicPlus from "@/pages/components/PreviewThinkpicPlus";
const Index = () => {
  const { data: session } = useSession();
  const [difficulty, setDifficulty] = useState("easy");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { room_code } = router.query;
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState([
    { word: "", images: [null, null, null, null], correct_answers: [] },
  ]);
  const fileInputRefs = useRef([]);
  const [zoom, setZoom] = useState(1);

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

  const initializeRefs = (numCards) => {
    const totalSlots = numCards * 4; // 4 image refs per card

    for (let i = 0; i < totalSlots; i++) {
      if (!fileInputRefs.current[i]) {
        fileInputRefs.current[i] = React.createRef();
        console.log(`Ref initialized at index ${i}`); // Debugging line
      }
    }
  };

  useEffect(() => {
    initializeRefs(cards.length);
    setDraggingIndex({ cardIndex: 0, imageIndex: 0 });
  }, [cards]);

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

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
      { word: "", images: [null, null, null, null], correct_answers: [] },
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
  const handleRemoveCard = (cardIndex) => {
    console.log(`Removing card at index ${cardIndex}`);
    const updatedCards = [...cards];
    updatedCards.splice(cardIndex, 1);
    setCards(updatedCards);
  };

  //submit form
  const handleSubmit = async () => {
    if (!title) {
      toast.error("Please enter a title.");
      return;
    }
    const requiredImages =
      difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
    for (const card of cards) {
      if (
        card.images.filter((image) => image !== null).length < requiredImages
      ) {
        toast.error(`Please upload ${requiredImages} images for each card.`);
        return;
      }
      if (card.word === "") {
        toast.error("Please enter a word for each card.");
        return;
      }
      if (card.correct_answers.length === 0) {
        toast.error("Please select at least one correct answer for each card.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("room_code", room_code);
    formData.append("cards", JSON.stringify(cards));
    // Extract the "cards" key from the FormData
    const cardsFromFormData = JSON.parse(formData.get("cards"));
    console.log("Cards data:", cardsFromFormData);

    try {
      setIsLoading(true);
      const response = await fetch(
        "/api/4pics1word_advanced/4pics1word_advanced",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Set the Content-Type header
          },
          body: JSON.stringify({
            title: title,
            room_code: room_code,
            account_id: session?.user?.id,
            cards: cards,
            difficulty: difficulty,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Game created successfully");
        console.log("Response data:", data);
        router.push(
          `/teacher-dashboard/rooms/${room_code}/4pics1word_advanced/${data.gameId}`
        );
      } else {
        toast.error("Error creating game");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const synth = window.speechSynthesis;

    // Get available voices
    let voices = synth.getVoices();

    // Ensure voices are loaded, this may run before voices are loaded, so handle this event
    if (!voices.length) {
      synth.onvoiceschanged = () => {
        voices = synth.getVoices();
        setVoiceAndSpeak(voices[1]); // Set default voice
      };
    } else {
      console.log("voices:", voices);
      setVoiceAndSpeak(voices[1]); // Set default voice
    }

    function setVoiceAndSpeak(selectedVoice) {
      // Choose a different voice if needed (e.g., second voice in the list)
      utterance.voice = selectedVoice; // Select your desired voice
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };
  const handleInsertImageFromUrl = (cardIndex, imageIndex) => {
    const updatedCards = [...cards];
    updatedCards[cardIndex].images[imageIndex] = tempImage;
    setCards(updatedCards);
  };

  // Track which modal is open
  const [openModalIndices, setOpenModalIndices] = useState({
    cardIndex: null,
    imageIndex: null,
  });
  const handleWheel = (e) => {
    e.preventDefault();
    const newZoom = zoom + (e.deltaY > 0 ? -0.1 : 0.1);
    setZoom(Math.min(Math.max(0.1, newZoom), 3));
  };

  const handleFlashcardImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmImage = async (index) => {
    try {
      const croppedBlob = await getCroppedImg();
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = () => {
        const base64data = reader.result;
        const updatedCards = [...cards];
        updatedCards[index].images[selectedImageIndex] = base64data;
        setOpenModalIndices({ cardIndex: null, imageIndex: null });
        setCards(updatedCards);
        setTempImage(null);
        setCrop({
          unit: "%",
          width: 50,
          height: 50,
          x: 25,
          y: 25,
        });
      };
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  // Clear images and correct answers when difficulty changes
  useEffect(() => {
    const maxImages =
      difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;

    const updatedCards = cards.map((card) => {
      // Clear images beyond the current difficulty limit
      const newImages = [...card.images];
      for (let i = maxImages; i < newImages.length; i++) {
        newImages[i] = null;
      }

      // Clear correct answers that are beyond the current difficulty limit
      const newCorrectAnswers = card.correct_answers.filter(
        (index) => index < maxImages
      );

      return {
        ...card,
        images: newImages,
        correct_answers: newCorrectAnswers,
      };
    });

    setCards(updatedCards);
  }, [difficulty]);

  const driverObj = useRef(
    driver({
      showProgress: true,
      steps: [
        {
          element: "#title",
          popover: {
            title: "Set Title",
            description: "Enter a title for your card set",
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
            description: "Click here to remove card",
          },
        },
        {
          element: "#word",
          popover: {
            title: "Enter Word",
            description: "Add a word to the card",
          },
        },
        {
          element: "#upload-image-btn",
          popover: {
            title: "Upload Image",
            description: "Add an image to your card",
          },
        },
        {
          element: "#add-card-btn",
          popover: {
            title: "Add More Cards",
            description: "Click here to add more cards to your set",
          },
        },
        {
          element: "#create-btn",
          popover: {
            title: "Create card Set",
            description: "When you're done, click here to create your card set",
          },
        },
      ],
    })
  );

  useEffect(() => {
    // if (room_code) {
    //   driverObj.current.drive();
    //   // setHasTourShown(true);
    // }
    const isTutorialShown = !localStorage.getItem("create-thinkpic+-tutorial");
    if (isTutorialShown) {
      setTimeout(() => {
        driverObj.current.drive();
        localStorage.setItem("create-thinkpic+-tutorial", "true");
      }, 1000);
    }
  }, [room_code]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Create a new ThinkPic+ Set</h1>
        <div className="flex gap-2 items-center">
          {/* <PreviewThinkpicPlus /> */}
          <div>
            {isLoading ? (
              <Button isLoading isDisabled color="secondary" radius="sm">
                Create
              </Button>
            ) : (
              <Button
                id="create-btn"
                color="secondary"
                radius="sm"
                onPress={handleSubmit}
                isDisabled={!title || !difficulty || cards.length < 2}
              >
                Create
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center z-0 max-sm:flex-col">
        <Input
          id="title"
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
          onChange={(e) => {
            setDifficulty(e.target.value);
          }}
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
            className="w-full border border-[#7469B6] rounded-md flex p-4"
          >
            <CardHeader className="flex px-3 justify-between items-center z-0">
              <div className="pl-2 text-xl font-bold">
                <h1>{cardIndex + 1}</h1>
              </div>
              <Button
                id="remove-card-btn"
                isIconOnly
                color="danger"
                onPress={() => handleRemoveCard(cardIndex)}
              >
                <Trash2 size={20} />
              </Button>
            </CardHeader>
            <CardBody className="flex px-3 pb-6 items-center z-0">
              <div className="flex w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                <form action="" className="w-full">
                  <div className="flex gap-2 shrink w-full mb-4 items-center">
                    <Input
                      id="word"
                      label="Enter Question"
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
                  {/* <span className="text-xs text-gray-500">
                    Upload images and select which image is the correct answer
                  </span> */}
                  <div className={`grid grid-cols-2 gap-2 justify-around`}>
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
                          className={`flex flex-col relative aspect-square rounded-lg border-2 border-[#9183e2] border-dashed bg-gray-100 items-center justify-center cursor-pointer `}
                          onDragEnter={(e) =>
                            handleDragEnter(e, cardIndex, imageIndex)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, cardIndex, imageIndex)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          {image ? (
                            <>
                              <div className="absolute top-0 right-0 flex items-center justify-center space-x-2 p-2 z-10">
                                {/* <Button
                                  isIconOnly
                                  onClick={() =>
                                    handleEdit(cardIndex, imageIndex)
                                  }
                                  color="secondary"
                                  size="sm"
                                >
                                  <Pencil size={18} />
                                </Button> */}
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
                              <div className="absolute p-2 z-10 top-0 left-0">
                                {card.correct_answers.includes(imageIndex) ? (
                                  <div
                                    className="bg-green-500 p-2 rounded-full"
                                    style={{ color: "#fff" }}
                                    onClick={() => {
                                      const updatedCards = [...cards];
                                      updatedCards[cardIndex].correct_answers =
                                        updatedCards[
                                          cardIndex
                                        ].correct_answers.filter(
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
                                      updatedCards[
                                        cardIndex
                                      ].correct_answers.push(imageIndex);
                                      setCards(updatedCards);
                                    }}
                                  >
                                    <CircleCheck size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="relative w-full">
                                <img
                                  src={image}
                                  alt={`Uploaded ${imageIndex + 1}`}
                                  className="h-full w-full object-cover rounded-lg"
                                />
                                {/* <div className="flex gap-4 items-center justify-center">
                                  <Input
                                    label="Image URL"
                                    variant="underlined"
                                    color="secondary"
                                    className="text-[#7469B6] px-2 z-0"
                                    value={card.images[imageIndex]}
                                    onChange={(e) => {
                                      setTempImage(e.target.value);
                                    }}
                                  />
                                  <Button
                                    color="secondary"
                                    onClick={() =>
                                      handleInsertImageFromUrl(
                                        cardIndex,
                                        imageIndex
                                      )
                                    }
                                  >
                                    Add
                                  </Button>
                                </div> */}
                                {/* <Checkbox
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    const updatedCards = [...cards];
                                    if (
                                      updatedCards[
                                        cardIndex
                                      ].correct_answers.includes(imageIndex)
                                    ) {
                                      updatedCards[cardIndex].correct_answers =
                                        updatedCards[
                                          cardIndex
                                        ].correct_answers.filter(
                                          (index) => index !== imageIndex
                                        );
                                    } else {
                                      updatedCards[
                                        cardIndex
                                      ].correct_answers.push(imageIndex);
                                    }
                                    setCards(updatedCards);
                                  }}
                                  isSelected={card.correct_answers.includes(
                                    imageIndex
                                  )}
                                /> */}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center space-y-2">
                              <Button
                                id="upload-image-btn"
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
                                <span className="max-sm:hidden">
                                  Upload Image
                                </span>
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
                                                onDragOver={(e) =>
                                                  e.preventDefault()
                                                }
                                                onDrop={(e) => {
                                                  e.preventDefault();
                                                  const file =
                                                    e.dataTransfer.files[0];
                                                  if (file) {
                                                    handleFlashcardImageChange(
                                                      cardIndex,
                                                      {
                                                        target: {
                                                          files: [file],
                                                        },
                                                      }
                                                    );
                                                  }
                                                }}
                                              >
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  className="hidden"
                                                  id={`imageUpload-${cardIndex}`}
                                                  onChange={(e) =>
                                                    handleFlashcardImageChange(
                                                      cardIndex,
                                                      e
                                                    )
                                                  }
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
                                                  onWheel={handleWheel}
                                                >
                                                  <ReactCrop
                                                    className="w-full h-full"
                                                    src={tempImage}
                                                    crop={crop}
                                                    onChange={(newCrop) =>
                                                      setCrop(newCrop)
                                                    }
                                                    aspect={1}
                                                  >
                                                    <img
                                                      src={tempImage}
                                                      onLoad={onImageLoad}
                                                      alt="Crop preview"
                                                      className="w-full h-full object-contain"
                                                      style={{
                                                        transform: `scale(${zoom})`,
                                                      }}
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
                                                    setTempImage(
                                                      e.target.value
                                                    );
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
                                            confirmImage(cardIndex);
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
                            ref={
                              fileInputRefs.current[cardIndex * 4 + imageIndex]
                            }
                            className="hidden"
                            onChange={(e) =>
                              handleFileChange(e, cardIndex, imageIndex)
                            }
                          />
                        </div>
                      ))}
                  </div>
                </form>
              </div>
            </CardBody>
          </Card>
        ))}

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
      </div>
      <Button
        id="add-card-btn"
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
