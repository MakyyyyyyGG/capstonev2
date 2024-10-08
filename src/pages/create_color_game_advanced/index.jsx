import React, { useState, useEffect, useRef } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { LibraryBig, Disc2, VolumeX } from "lucide-react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
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
  Select,
  SelectItem,
} from "@nextui-org/react";
const index = () => {
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingCardIndex, setRecordingCardIndex] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(60); // 60 seconds = 1 minute

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;

  const [cards, setCards] = useState([
    {
      images: [],
      colors: [],
      audio: null,
      audioBlob: null,
      insertedAudio: null,
    },
  ]);
  const [title, setTitle] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [selectedColor, setSelectedColor] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [difficulty, setDifficulty] = useState("easy");
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
      } else if (
        prev.length <
        (difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 10)
      ) {
        return [...prev, imageId];
      }
      return prev;
    });
  };

  const handleAddCard = () => {
    setCards([
      ...cards,
      {
        images: [],
        colors: [],
        audio: null,
        audioBlob: null,
        insertedAudio: null,
      },
    ]);
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

  const insertImages = () => {
    const updatedCards = [...cards];
    const selectedImageUrls = selectedImages.map(
      (id) => displayImages.find((img) => img.id === id).image
    );
    const selectedImageColors = selectedImages.map(
      (id) =>
        displayImages
          .find((img) => img.id === id)
          .image.split("/")
          .pop()
          .split("-")[0]
    );
    updatedCards[draggingIndex.cardIndex].images = selectedImageUrls;
    updatedCards[draggingIndex.cardIndex].colors = selectedImageColors;
    setCards(updatedCards);
    setSelectedImages([]);
    onOpenChange();
  };

  const handleColorChange = (cardIndex, color) => {
    const updatedCards = [...cards];
    updatedCards[cardIndex].colors = [color];
    setCards(updatedCards);
  };

  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setDifficulty(newDifficulty);

    const maxImages =
      newDifficulty === "easy" ? 3 : newDifficulty === "medium" ? 5 : 10;
    const updatedCards = cards.map((card) => {
      const newImages = card.images.slice(0, maxImages);
      const newColors = card.colors.slice(0, maxImages);
      console.log(`Card ${card.colors} images:`, newImages);
      return {
        ...card,
        images: newImages,
        colors: newColors,
      };
    });
    setCards(updatedCards);
  };

  useEffect(() => {
    const maxImages =
      difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 10;
    const updatedCards = cards.map((card) => {
      const newImages = card.images.slice(0, maxImages);
      const newColors = card.colors.slice(0, maxImages);
      console.log(`Card ${card.colors} images:`, newImages);
      return {
        ...card,
        images: newImages,
        colors: newColors,
      };
    });
    setCards(updatedCards);
  }, [difficulty]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async (cardIndex) => {
    console.log("start recording in card", cardIndex);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const updatedCards = [...cards];
        updatedCards[cardIndex].audioBlob = audioBlob;
        setCards(updatedCards);
        setRecordingCardIndex(null);
        setRecordingTime(60); // Reset the recording time
        insertAudio(cardIndex, audioBlob); // Pass the audioBlob to insertAudio
      });

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingCardIndex(cardIndex);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = async (cardIndex) => {
    if (mediaRecorder && recordingCardIndex === cardIndex) {
      mediaRecorder.stop();
    }
  };

  const removeAudio = (cardIndex) => {
    const updatedCards = [...cards];
    updatedCards[cardIndex].audioBlob = null;
    updatedCards[cardIndex].insertedAudio = null;
    setCards(updatedCards);
  };

  const insertAudio = (cardIndex, audioBlob) => {
    console.log("insert audio reached");
    const updatedCards = [...cards];
    console.log("audioBlob in insertAudio", audioBlob);
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.replace(/^data:.+;base64,/, "");
        if (isValidBase64(base64String)) {
          updatedCards[
            cardIndex
          ].insertedAudio = `data:audio/wav;base64,${base64String}`;
          setCards(updatedCards);
          console.log(`Audio Blob for card ${cardIndex}:`, base64String);
        } else {
          console.error("Invalid Base64 data for audio");
        }
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const isValidBase64 = (str) => {
    try {
      atob(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("Submitting:", {
    //   title,
    //   difficulty,
    //   cards: cards.map((card) => ({ ...card, colors: card.colors })),
    // });
    try {
      const response = await fetch(
        "/api/color_game_advanced/color_game_advanced",
        {
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
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        alert("Game created successfully");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
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
        <div className="w-full">
          <h1>Create Color Game Advanced</h1>
          <h1>room code: {room_code}</h1>
          <form onSubmit={handleSubmit}>
            <div className="w-80">
              <Input
                isRequired
                label="Title"
                onChange={(e) => setTitle(e.target.value)}
                className="mb-4 w-80"
              />
              <Select
                label="Difficulty"
                onChange={handleDifficultyChange}
                isRequired
                value={difficulty}
              >
                <SelectItem key="easy">Easy (3 images)</SelectItem>
                <SelectItem key="medium">Medium (5 images)</SelectItem>
                <SelectItem key="hard">Hard (10 images)</SelectItem>
              </Select>
            </div>
            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-2 gap-4">
                {cards.map((card, cardIndex) => (
                  <Card key={cardIndex} className="w-full">
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <h2 className="mb-4 text-lg font-semibold">
                          Color Card Sequence {cardIndex + 1}
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
                      </div>
                      {recordingCardIndex !== cardIndex ? (
                        <Button
                          color="secondary"
                          onClick={() => startRecording(cardIndex)}
                        >
                          Start Recording
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            stopRecording(cardIndex);
                          }}
                          color="danger"
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <Disc2 size={24} />
                            <p>{formatTime(60 - recordingTime)}/01:00</p>
                          </div>
                        </Button>
                      )}
                      {card.audioBlob && (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <audio
                              controls
                              src={URL.createObjectURL(card.audioBlob)}
                            ></audio>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => removeAudio(cardIndex)}
                                color="danger"
                              >
                                <VolumeX size={20} />
                                Remove Audio
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from(
                          {
                            length:
                              difficulty === "easy"
                                ? 3
                                : difficulty === "medium"
                                ? 5
                                : 10,
                          },
                          (_, imageIndex) => (
                            <div key={imageIndex}>
                              <div className="mt-2">
                                <Select
                                  label="Color"
                                  onChange={(e) =>
                                    handleColorChange(cardIndex, e.target.value)
                                  }
                                  isRequired
                                  value={card.colors[imageIndex] || ""}
                                  className="mb-4"
                                >
                                  <SelectItem key="blue">Blue</SelectItem>
                                  <SelectItem key="red">Red</SelectItem>
                                  <SelectItem key="yellow">Yellow</SelectItem>
                                  <SelectItem key="green">Green</SelectItem>
                                  <SelectItem key="orange">Orange</SelectItem>
                                  <SelectItem key="purple">Purple</SelectItem>
                                  <SelectItem key="pink">Pink</SelectItem>
                                  <SelectItem key="brown">Brown</SelectItem>
                                  <SelectItem key="black">Black</SelectItem>
                                  <SelectItem key="white">White</SelectItem>
                                  <SelectItem key="gray">Gray</SelectItem>
                                </Select>
                              </div>
                              <div
                                className={`relative block w-full aspect-square bg-gray-100 rounded-lg border-2  items-center justify-center cursor-pointer`}
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
                                          updatedCards[cardIndex].colors[
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
                                    {/* <h1>asdj</h1> */}
                                    <Button
                                      onPress={() =>
                                        handleEdit(cardIndex, imageIndex)
                                      }
                                    >
                                      <LibraryBig />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
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
                        card.images.some((img) => img === null) ||
                        !card.colors.length
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
                    <h2 className="mb-4 text-lg font-semibold">
                      Select{" "}
                      {difficulty === "easy"
                        ? 3
                        : difficulty === "medium"
                        ? 5
                        : 10}{" "}
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
                                  isSelected={selectedImages.includes(item.id)}
                                  onChange={() => handleImageSelect(item.id)}
                                  isDisabled={
                                    selectedImages.length >=
                                      (difficulty === "easy"
                                        ? 3
                                        : difficulty === "medium"
                                        ? 5
                                        : 10) &&
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
                      isDisabled={
                        selectedImages.length !==
                        (difficulty === "easy"
                          ? 3
                          : difficulty === "medium"
                          ? 5
                          : 10)
                      }
                    >
                      Insert
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default index;
