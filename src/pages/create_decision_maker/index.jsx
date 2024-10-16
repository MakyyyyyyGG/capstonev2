import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { useSession } from "next-auth/react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Divider,
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
import {
  Smile,
  Sad,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Image,
  Pencil,
  Trash2,
} from "lucide-react";
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
      imageUrl: "",
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
    setCards([
      ...cards,
      { word: "", image: null, correct_answer: "", imageUrl: "" },
    ]);
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

  const handleInsertImageFromUrl = (index) => {
    const newCards = [...cards];
    newCards[index].image = newCards[index].imageUrl;
    setCards(newCards);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Create Decision Maker</h1>
        <Button color="secondary" onPress={handleSubmit}>
          Create
        </Button>
      </div>
      {/* <h1>Room Code: {room_code}</h1> */}
      <div className="items-center z-0">
        <Input
          label="Title"
          variant="faded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className="w-full border border-slate-800 rounded-md flex"
          >
            <CardHeader className="flex px-3 justify-between items-center z-0">
              <div className="pl-2 text-xl font-bold">
                <h1>{index + 1}</h1>
              </div>
              <div className="flex gap-2">
                {!card.image ? (
                  <>
                    <div className="flex gap-4 items-center justify-center">
                      <Input
                        label="Image URL"
                        variant="underlined"
                        color="secondary"
                        className="text-[#7469B6] px-2 z-0"
                        value={card.imageUrl}
                        onChange={(e) => {
                          handleCardChange(index, "imageUrl", e.target.value);
                        }}
                      />
                      <Button
                        color="secondary"
                        onClick={() => handleInsertImageFromUrl(index)}
                      >
                        Add
                      </Button>
                    </div>
                    <Button
                      color="secondary"
                      onPress={() => {
                        setCurrentIndex(index);
                        onOpen();
                      }}
                      startContent={<Image size={22} />}
                    >
                      Insert Image
                    </Button>
                  </>
                ) : (
                  <Button
                    color="secondary"
                    onPress={() => {
                      setCurrentIndex(index);
                      onOpen();
                    }}
                    startContent={<Pencil size={22} />}
                  >
                    Change Image
                  </Button>
                )}
                <Button
                  isIconOnly
                  color="danger"
                  onClick={() => removeCard(index)}
                >
                  <Trash2 size={22} />
                </Button>
              </div>
            </CardHeader>
            <Divider className="m-0 h-0.5 bg-slate-300" />
            <CardBody>
              <div className="flex gap-4 w-full items-center max-sm:flex-col">
                <div className="flex w-full flex-col gap-4">
                  <Input
                    color="secondary"
                    variant="underlined"
                    label="Word"
                    value={card.word}
                    onChange={(e) =>
                      handleCardChange(index, "word", e.target.value)
                    }
                  />

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
                          radius="sm"
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
                          color="secondary"
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

                  <RadioGroup
                    label="Decision"
                    color="secondary"
                    value={card.correct_answer}
                    onChange={(e) =>
                      handleCardChange(index, "correct_answer", e.target.value)
                    }
                  >
                    <div className="flex gap-4">
                      <Radio value="positive">Positive</Radio>
                      <Radio value="negative">Negative</Radio>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex shrink-0 items-center justify-center border-dashed border-2 border-gray-300 w-[150px] h-[150px] max-sm:w-[150px] max-sm:h-[150px]">
                  {card.image && (
                    <div className=" w-[150px] h-[150px] max-sm:w-[100px] max-sm:h-[100px]">
                      <img
                        src={card.image}
                        alt="Crop preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <Button
        size="lg"
        radius="sm"
        color="secondary"
        className="my-4 text-sm"
        onPress={addCard}
        startContent={<Plus size={22} />}
      >
        Add Card
      </Button>
    </div>
  );
};

export default index;
