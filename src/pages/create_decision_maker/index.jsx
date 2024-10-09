import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { useSession } from "next-auth/react";
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
import { Smile, Sad, ThumbsUp, ThumbsDown, Check, X } from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const index = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session } = useSession();
  const router = useRouter();
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(null);
  const imgRef = useRef(null);
  const [title, setTitle] = useState("");
  const [gameData, setGameData] = useState({
    room_code: "",
    cards: [],
  });
  const { room_code } = router.query;
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
    },
  ]);

  useEffect(() => {
    // Add an initial card on first load
  }, []);

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
        newCards[currentIndex].image = base64data;
        setCards(newCards);
        setTempImage(null);
      };
    }, "image/jpeg");
  };

  const addCard = () => {
    setCards([...cards, { word: "", image: null, correct_answer: "" }]);
  };

  const removeCard = (index) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
  };

  const handleCardChange = (index, field, value) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
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
    try {
      const response = await fetch("/api/decision_maker/decision_maker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          account_id: session.user.id,
          room_code,
          cards,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("POST success", data);
        alert("Game created successfully");
      } else {
        console.log("POST failed", data.error);
      }
    } catch (error) {
      console.error(error);
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

        <div className="flex flex-col gap-4">
          <h1>Create Decision Maker</h1>
          <h1>Room Code: {room_code}</h1>
          <Input
            label="Title"
            className="w-1/2"
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
                        <Button
                          className="my-4"
                          onPress={() => {
                            setCurrentIndex(index);
                            onOpen();
                          }}
                        >
                          Insert Image
                        </Button>
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
                          <img
                            src={card.image}
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
          </div>
          <Button onPress={addCard}>Add Card</Button>
          <Button onPress={handleSubmit}>Submit</Button>
        </div>
      </div>
    </div>
  );
};

export default index;
