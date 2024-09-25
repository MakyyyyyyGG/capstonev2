import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { CircleCheck, Volume2 } from "lucide-react";

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
} from "@nextui-org/react";

const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState([
    { word: "", images: [null, null, null, null], correct_answer: null },
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
      { word: "", images: [null, null, null, null], correct_answer: null },
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
    for (const card of cards) {
      if (card.images.filter((image) => image !== null).length < 4) {
        alert("Please upload 4 images for each card.");
        return;
      }
      if (card.correct_answer === null) {
        alert("Please select the correct answer for each card.");
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
    <div>
      <h1>create_4pics1word_advanced</h1>
      <h1>room code {room_code}</h1>
      <div className="w-80">
        <Input
          label="Title"
          onChange={(e) => setTitle(e.target.value)}
          className="mb-4 w-80"
        />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card, cardIndex) => (
            <Card key={cardIndex} className="w-full ">
              <CardBody>
                <div className="flex items-center justify-between">
                  <h1 className="mb-4 text-lg font-semibold">4 Pics 1 Word</h1>
                  <Button
                    onPress={() => handleRemoveCard(cardIndex)}
                    color="danger"
                    className="mb-4"
                  >
                    Remove Card
                  </Button>
                </div>

                <form action="">
                  <Input
                    label="Word"
                    className="mb-4"
                    color="secondary"
                    value={card.word}
                    onChange={(e) => {
                      const updatedCards = [...cards];
                      updatedCards[cardIndex].word = e.target.value;
                      setCards(updatedCards);
                    }}
                  />
                  {card.word && (
                    <Button
                      className="mb-4"
                      color="secondary"
                      onPress={() => handleTextToSpeech(card.word)}
                    >
                      <Volume2 />
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {card.images.map((image, imageIndex) => (
                      <div
                        key={imageIndex}
                        className={`relative block w-full aspect-square bg-gray-100 rounded-lg border-2 ${
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
                            <div className="  flex items-center  space-x-2 m-2 p-2  w-full">
                              <Button
                                onClick={() =>
                                  handleEdit(cardIndex, imageIndex)
                                }
                                color="secondary"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => {
                                  const updatedCards = [...cards];
                                  updatedCards[cardIndex].images[imageIndex] =
                                    null;
                                  setCards(updatedCards);
                                }}
                                color="danger"
                                size="sm"
                              >
                                Delete
                              </Button>
                              {card.correct_answer === imageIndex ? (
                                <div
                                  className="bg-green-500 p-2 rounded-full"
                                  style={{ color: "#fff" }}
                                  onClick={() => {
                                    const updatedCards = [...cards];
                                    updatedCards[cardIndex].correct_answer =
                                      null;
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
                                    updatedCards[cardIndex].correct_answer =
                                      imageIndex;
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
                            <span className="text-gray-400">
                              Drag & Drop Image
                            </span>
                            <Button
                              color="secondary"
                              onClick={() => handleEdit(cardIndex, imageIndex)}
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
              </CardBody>
            </Card>
          ))}

          <div className="col-span-3 mt-4 flex justify-between">
            <Button color="secondary" onClick={handleAddCard}>
              Add +
            </Button>
            <Button
              color="secondary"
              onPress={handleSubmit}
              isDisabled={!title}
            >
              Create
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Crop Image</ModalHeader>
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
  );
};

export default Index;
