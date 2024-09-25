import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { CircleCheck } from "lucide-react";
import ReactCrop from "react-image-crop";
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
} from "@nextui-org/react";
const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const [cards, setCards] = useState([]);
  const fileInputRefs = useRef([]);
  const [title, setTitle] = useState("");

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
        // console.log(`Ref initialized at index ${i}`); // Debugging line
      }
    }
  };

  //   useEffect(() => {
  //     initializeRefs(cards.length);
  //   }, [cards]);

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
        correct_answer: null,
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

      if (Array.isArray(data) && data.length > 0) {
        const formattedCards = data.map((card) => ({
          title: card.title,
          word: card.word,
          images: [card.image1, card.image2, card.image3, card.image4],
          four_pics_advanced_id: card.four_pics_advanced_id,
          four_pics_advanced_set_id: card.four_pics_advanced_set_id,
          correct_answer: card.correct_answer,
        }));

        setCards(formattedCards);
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
    }
  };

  const setupNewCards = async (cards) => {
    const newCards = cards.filter((card) => card.isNew === true);
    console.log("newCards", newCards);

    if (newCards.length > 0) {
      for (const card of newCards) {
        card.four_pics_advanced_set_id = cards[0].four_pics_advanced_set_id;
        card.title = cards[0].title;
        // Log card before sending to check if correct_answer is still present
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

  const handleSave = async () => {
    if (!title) {
      alert("Please enter a title.");
      return;
    }
    // Ensure each card has 4 images
    for (const card of cards) {
      if (card.images.filter((image) => image !== null).length < 4) {
        alert("Please upload 4 images for each card.");
        return;
      }
    }
    //check if correct_answer is null
    // if (cards.correct_answer === null) {
    //   alert("Please select the correct answer for each card.");
    //   return;
    // }
    for (const card of cards) {
      if (card.correct_answer === null) {
        alert("Please select the correct answer for each card.");
        return;
      }
    }

    try {
      await setupNewCards(cards); // Handle new cards creation if necessary
      const cardsToUpdate = cards.filter((c) => !c.isNew); // Filter out new cards
      console.log("cardsToUpdate", cardsToUpdate);
      let allUpdatesSuccessful = true;
      for (const card of cardsToUpdate) {
        const body = JSON.stringify({
          title: title, // Pass the title for the card set
          cards: card, // Pass the modified card details (with images and word)
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
          fetchCards(); // Refresh cards after updating
        } else {
          console.error("Error updating card");
          allUpdatesSuccessful = false;
        }
      }
      if (allUpdatesSuccessful) {
        alert("All cards updated successfully!");
      }
    } catch (error) {
      console.error("Error saving cards:", error);
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

  return (
    <div>
      <h1>edit 4pics1word</h1>
      <h1>room code {room_code}</h1>
      <div className="w-80">
        <Input
          label="Title"
          value={title}
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
                            <div className="flex items-center  space-x-2 m-2 p-2  w-full">
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

                              {card.correct_answer == imageIndex ? (
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
            <Button color="secondary" onPress={handleSave} isDisabled={!title}>
              Save Changes
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

export default index;