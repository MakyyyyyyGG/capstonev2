import React, { useState, useRef, useEffect } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { CircleCheck, Volume2, Trash2, Plus, Pencil } from "lucide-react";

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
} from "@nextui-org/react";

const Index = () => {
  const { data: session } = useSession();
  const [difficulty, setDifficulty] = useState("");
  const router = useRouter();
  const { room_code } = router.query;
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState([
    { word: "", images: [null, null, null, null], correct_answers: [] },
  ]);
  const fileInputRefs = useRef([]);

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
      alert("Please enter a title.");
      return;
    }
    const requiredImages =
      difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
    for (const card of cards) {
      if (
        card.images.filter((image) => image !== null).length < requiredImages
      ) {
        alert(`Please upload ${requiredImages} images for each card.`);
        return;
      }
      if (card.word === "") {
        alert("Please enter a word for each card.");
        return;
      }
      if (card.correct_answers.length === 0) {
        alert("Please select at least one correct answer for each card.");
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
        alert("Game created successfully");
        console.log("Response data:", data);
      } else {
        alert("Error creating game");
      }
    } catch (error) {
      console.error("Error:", error);
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
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };
  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Create a new ThinkPic+ Set</h1>
        <div>
          <Button
            color="secondary"
            onPress={handleSubmit}
            isDisabled={!title || !difficulty || cards.length < 2}
          >
            Create
          </Button>
        </div>
      </div>
      <h1>room code {room_code}</h1>
      <div className="flex gap-2 items-center z-0 max-sm:flex-col">
        <Input
          isRequired
          label="Title"
          onChange={(e) => setTitle(e.target.value)}
          className="w-3/5 max-sm:w-full"
        />
        <Select
          label="Difficulty"
          onChange={(e) => {
            setDifficulty(e.target.value);
          }}
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
              <div className="flex">
                <Button
                  isIconOnly
                  color="danger"
                  onPress={() => handleRemoveCard(cardIndex)}
                >
                  <Trash2 size={22} />
                </Button>
              </div>
            </CardHeader>
            <Divider className="m-0 h-0.5 bg-slate-300" />
            <CardBody className="flex px-3 pb-6 items-center z-0">
              <div className="flex w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                <form action="" className="w-full">
                  <div className="flex shrink w-full mb-4 items-center">
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
                      }}
                    />
                    {card.word && (
                      <Button
                        isIconOnly
                        color="secondary"
                        onPress={() => handleTextToSpeech(card.word)}
                      >
                        <Volume2 />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center max-sm:gap-2">
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
                          className={`relative block w-[18rem] aspect-square bg-gray-100 rounded-lg border-2 max-sm:w-[14rem] ${
                            draggingIndex?.cardIndex === cardIndex &&
                            draggingIndex?.imageIndex === imageIndex
                              ? "border-green-500"
                              : "border-dashed border-gray-300"
                          } flex flex-col items-center justify-center cursor-pointer`}
                          onDragEnter={(e) =>
                            handleDragEnter(e, cardIndex, imageIndex)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, cardIndex, imageIndex)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          {image ? (
                            <>
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2 opacity-0 hover:opacity-100 transition-opacity p-2 z-10">
                                <Button
                                  isIconOnly
                                  onClick={() =>
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
                              <div className="absolute p-2 z-10 top-0 right-0">
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
                                      {" "}
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
                              <div className="relative">
                                <img
                                  src={image}
                                  alt={`Uploaded ${imageIndex + 1}`}
                                  className="h-full w-full object-cover rounded-lg"
                                />
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
                              <span className="text-gray-400">
                                Drag & Drop Image
                              </span>
                              <Button
                                color="secondary"
                                onClick={() =>
                                  handleEdit(cardIndex, imageIndex)
                                }
                              >
                                Upload Image
                              </Button>
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
        </Modal>
      </div>
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
