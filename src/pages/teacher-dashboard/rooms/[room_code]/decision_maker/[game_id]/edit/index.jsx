import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Input,
  Card,
  CardBody,
  Select,
  SelectItem,
  Radio,
  RadioGroup,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Link from "next/link";
const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session } = useSession();
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(null);
  const imgRef = useRef(null);
  const [title, setTitle] = useState("");
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });

  const [cards, setCards] = useState([
    {
      word: "",
      image: null,
      correct_answer: "",
      imageBlob: null,
    },
  ]);
  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }
  const handleCardImageChange = (index, e) => {
    setCurrentIndex(index);
    handleImageChange(e);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };
  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    console.log("Image loaded successfully");
    setCrop({
      unit: "%",
      width: 50,
      height: 50,
      x: 25,
      y: 25,
    });
  };

  const confirmImage = (index) => {
    if (!imgRef.current) {
      console.error("Image is not loaded yet.");
      return;
    }

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

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas is empty");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        const newCards = [...cards];
        newCards[currentIndex].imageBlob = base64data;
        newCards[currentIndex].image = base64data; // Ensure the image is set in the new card
        setCards(newCards);
        setTempImage(null);
      };
    }, "image/jpeg");
  };

  const addCard = () => {
    setCards([
      ...cards,
      {
        word: "",
        image: null,
        correct_answer: "",
        imageBlob: null,
        isNew: true,
      },
    ]);
  };

  const removeCard = (index) => {
    const newCards = cards.filter((_, i) => i !== index);
    handleDeleteCard(index);
    setCards(newCards);
  };

  const handleDeleteCard = async (cardIndex) => {
    const userConfirmed = confirm(
      "Are you sure you want to delete this color game advanced card?"
    );
    if (userConfirmed) {
      const updatedCards = [...cards];
      const removedCard = updatedCards.splice(cardIndex, 1)[0];
      setCards(updatedCards);
      console.log(
        "removed decision maker card id:",
        removedCard.decision_maker_id
      );
      try {
        const response = await fetch(
          `/api/decision_maker/update_decision_maker?decision_maker_id=${removedCard.decision_maker_id}`,
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
  const handleCardChange = (index, field, value) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };
  const setupNewCards = async (cards) => {
    const newCards = cards.filter((card) => card.isNew === true);
    console.log("newCards", newCards);
    if (newCards.length > 0) {
      for (const card of newCards) {
        card.decision_maker_set_id = cards[0].decision_maker_set_id;
        card.title = cards[0].title;

        try {
          const response = await fetch(
            "/api/decision_maker/update_decision_maker",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cards: card, // Wrap in an array
                decision_maker_set_id: card.decision_maker_set_id,
                // title: card.title,
              }),
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

  const handleSubmit = async () => {
    // console.log(title, room_code, cards);
    if (!title) {
      alert("Please enter a title");
      return;
    }
    for (const card of cards) {
      if (!card.image) {
        alert("Please insert an image for all cards");
        return;
      }
      if (!card.correct_answer) {
        alert("Please select a decision answer for all cards");
        return;
      }
      if (!card.word) {
        alert("Please enter a word for all cards");
        return;
      }
    }
    console.log(cards);
    await setupNewCards(cards);

    const cardsToUpdate = cards.filter((c) => !c.isNew); // Filter out new cards

    for (const card of cardsToUpdate) {
      const body = JSON.stringify({
        title: title, // Pass the title for the card set
        cards: card, // Pass the modified card details (with images and word)
        game_id: game_id,
        image: card.image,
        updated_image: card.image,
      });
      //   console.log("body", body);

      try {
        const response = await fetch(
          `/api/decision_maker/decision_maker?decision_maker_id=${card.decision_maker_id}`,
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
        } else {
          fetchCards();
          alert("Decision maker updated successfully");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch(
        `/api/decision_maker/decision_maker?game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      const transformedData = data.map((item) => ({
        ...item, // Spread the existing properties
      }));
      setCards(transformedData);
      setTitle(transformedData[0].title);
      console.log("transformedData", transformedData);

      if (res.ok) {
        console.log("Cards fetched successfully");
        console.log(data);
      } else {
        console.error("Error fetching cards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchCards();
    }
  }, [game_id]);

  const handleInsertImageFromUrl = (index) => {
    const newCards = [...cards];
    newCards[index].image = newCards[index].imageUrl;
    setCards(newCards);
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
        <div className="flex flex-col gap-4">
          <h1>Edit Decision Maker</h1>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-4">
            {cards.map((card, index) => (
              <div key={index} className="flex flex-col gap-4">
                <div>
                  <Card className="w-full">
                    <CardBody>
                      <Input
                        label="Word"
                        value={card.word}
                        onChange={(e) =>
                          handleCardChange(index, "word", e.target.value)
                        }
                      />
                      {!card.image ? (
                        <>
                          <Button
                            className="my-4"
                            onPress={() => {
                              setCurrentIndex(index);
                              onOpen();
                            }}
                          >
                            Insert Image
                          </Button>
                          <div className="flex gap-4 items-center justify-center">
                            <Input
                              label="Image URL"
                              variant="underlined"
                              color="secondary"
                              className="text-[#7469B6] px-2 z-0"
                              value={card.imageUrl}
                              onChange={(e) => {
                                handleCardChange(
                                  index,
                                  "imageUrl",
                                  e.target.value
                                );
                              }}
                            />
                            <Button
                              color="secondary"
                              onClick={() => handleInsertImageFromUrl(index)}
                            >
                              Add
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          className="my-4"
                          onPress={() => {
                            setCurrentIndex(index);
                            onOpen();
                          }}
                        >
                          Change Image
                        </Button>
                      )}
                      <Modal
                        isOpen={isOpen && currentIndex === index}
                        onOpenChange={onOpenChange}
                      >
                        <ModalContent>
                          <ModalHeader>
                            <h1>Crop Image</h1>
                          </ModalHeader>
                          <ModalBody>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCardImageChange(index, e)}
                            />
                            {tempImage && (
                              <div className="w-full h-full">
                                <ReactCrop
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
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              onClick={() => {
                                confirmImage(currentIndex);
                                onOpenChange();
                              }}
                            >
                              Confirm Image
                            </Button>
                          </ModalFooter>
                        </ModalContent>
                      </Modal>
                      {card.image && (
                        <div className="w-full h-full">
                          <div className="flex gap-4 items-center justify-center">
                            <Input
                              label="Image URL"
                              variant="underlined"
                              color="secondary"
                              className="text-[#7469B6] px-2 z-0"
                              value={card.imageUrl}
                              onChange={(e) => {
                                handleCardChange(
                                  index,
                                  "imageUrl",
                                  e.target.value
                                );
                              }}
                            />
                            <Button
                              color="secondary"
                              onClick={() => handleInsertImageFromUrl(index)}
                            >
                              Add
                            </Button>
                          </div>
                          <img
                            src={card.imageBlob || card.image}
                            alt="Crop preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <RadioGroup
                        label="Decision"
                        value={card.correct_answer}
                        onChange={(e) =>
                          handleCardChange(
                            index,
                            "correct_answer",
                            e.target.value
                          )
                        }
                      >
                        <div className="flex gap-4">
                          <Radio value="positive">Positive</Radio>
                          <Radio value="negative">Negative</Radio>
                        </div>
                      </RadioGroup>
                      <Button
                        color="danger"
                        onClick={() => removeCard(index)}
                        className="mt-4"
                      >
                        Remove Card
                      </Button>
                    </CardBody>
                  </Card>
                </div>
              </div>
            ))}
          </div>{" "}
          <Button onPress={addCard} color="primary">
            Add Card
          </Button>
          <Button onPress={handleSubmit} color="secondary">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default index;
