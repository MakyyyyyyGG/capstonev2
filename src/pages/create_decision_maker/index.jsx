import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
  Tabs,
  Tab,
} from "@nextui-org/react";
import {
  Smile,
  Sad,
  ThumbsUp,
  ThumbsDown,
  Plus,
  X,
  Info,
  Image,
  Pencil,
  ScanSearch,
  Upload,
  Trash2,
} from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import toast, { Toaster } from "react-hot-toast";

const index = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session } = useSession();
  const router = useRouter();
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(null);
  const imgRef = useRef(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [title, setTitle] = useState("");
  const [gameData, setGameData] = useState({
    room_code: "",
    cards: [],
  });
  const {
    isOpen: isImageViewOpen,
    onOpen: onImageViewOpen,
    onOpenChange: onImageViewOpenChange,
  } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
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
    if (cards.length + 1 >= 10) {
      setDifficulty("hard");
    } else if (cards.length + 1 >= 5) {
      setDifficulty("medium");
    } else {
      setDifficulty("easy");
    }
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
      toast.error("Please enter a title");
      return;
    }
    for (const card of cards) {
      if (!card.image) {
        toast.error("Please insert an image for all cards");
        return;
      }
      if (!card.correct_answer) {
        toast.error("Please select a decision answer for all cards");
        return;
      }
      if (!card.word) {
        toast.error("Please enter a word for all cards");
        return;
      }
    }
    setIsLoading(true);
    const toastId = toast.loading("Creating game...");
    try {
      const response = await fetch("/api/decision_maker/decision_maker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          difficulty,
          account_id: session.user.id,
          room_code,
          cards,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push(
          `/teacher-dashboard/rooms/${room_code}/decision_maker/${data.gameId}`
        );

        console.log("POST success", data);
        toast.success("Game created successfully", { id: toastId });
      } else {
        console.log("POST failed", data.error);
        toast.error("Failed to create game", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating the game", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertImageFromUrl = (card, index) => {
    const newCards = [...cards];
    newCards[index].image = newCards[index].imageUrl;
    setCards(newCards);
  };

  const driverObj = useRef(
    driver({
      showProgress: true,
      steps: [
        {
          element: "#title",
          popover: {
            title: "Set Title",
            description:
              "Enter a descriptive title for your decision maker game",
          },
        },
        {
          element: "#remove-card-btn",
          popover: {
            title: "Remove Card",
            description: "Click here to remove this scenario card",
          },
        },
        {
          element: "#description",
          popover: {
            title: "Add Description",
            description: "Enter a description for this scenario",
          },
        },
        {
          element: "#decision",
          popover: {
            title: "Set Decision",
            description:
              "Choose whether this scenario should have a yes or no response",
          },
        },
        {
          element: "#upload-image-btn",
          popover: {
            title: "Upload Image",
            description: "Add an image to illustrate this scenario",
          },
        },
        {
          element: "#add-card-btn",
          popover: {
            title: "Add New Scenario",
            description: "Click here to add another scenario card",
          },
        },
        {
          element: "#create-btn",
          popover: {
            title: "Create Game",
            description:
              "When you've added all your scenarios, click here to create your decision maker game",
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
    const isTutorialShown = !localStorage.getItem("create-sequence-tutorial");
    if (isTutorialShown) {
      setTimeout(() => {
        driverObj.current.drive();
        localStorage.setItem("create-sequence-tutorial", "true");
      }, 1000);
    }
  }, [room_code]);

  return (
    <div className="w-full flex flex-col gap-4 p-4 mx-auto  max-w-[80rem]">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold ">
        <div className="flex gap-4 items-center ">
          <h1 className="">Create a new Decision Game Set</h1>
          <Popover placement="bottom">
            <PopoverTrigger>
              <Chip
                endContent={<Info size={20} />}
                variant="flat"
                color={
                  cards.length < 5
                    ? "success"
                    : cards.length >= 10
                    ? "danger"
                    : "warning"
                }
                className="cursor-pointer"
              >
                <span>
                  {cards.length < 5
                    ? "Easy"
                    : cards.length >= 10
                    ? "Hard"
                    : "Medium"}
                </span>
              </Chip>
            </PopoverTrigger>
            <PopoverContent className="w-[350px]">
              <div className="px-4 py-3">
                <div className="text-base font-bold mb-2">
                  Difficulty Levels:
                </div>
                <div className="text-sm space-y-2">
                  <p>• Easy: Less than 5 sequences</p>
                  <p>• Medium: 5-9 sequences</p>
                  <p>• Hard: 10 or more sequences</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
            isDisabled={!title || cards.length === 0}
          >
            Create
          </Button>
        )}
      </div>
      {/* <h1>Room Code: {room_code}</h1> */}
      <div className="items-center z-0">
        <Input
          id="title"
          isRequired
          placeholder="Enter title"
          classNames={{
            label: "text-white",
            inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
          }}
          variant="bordered"
          color="secondary"
          isClearable
          radius="sm"
          size="lg"
          onClear={() => setTitle("")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className="w-full border  border-[#7469B6]  flex p-4 rounded-lg"
          >
            <CardHeader className="flex px-3 justify-between items-center z-0">
              <div className="pl-2 text-xl font-bold">
                <h1>{index + 1}</h1>
              </div>
              <div className="flex gap-2">
                {/*{!card.image ? (
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
                        Change
                      </Button>
                    </div>
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
                  </>
                )}*/}
                <Button
                  id="remove-card-btn"
                  isIconOnly
                  color="danger"
                  radius="sm"
                  onClick={() => removeCard(index)}
                >
                  <Trash2 size={22} />
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex gap-4 w-full items-center max-sm:flex-col">
                <Modal
                  isOpen={card.isUploadModalOpen}
                  onOpenChange={(isOpen) => {
                    const newCards = [...cards];
                    newCards[index].isUploadModalOpen = isOpen;
                    setCards(newCards);
                    if (!isOpen) {
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
                                  className=" rounded-lg border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) {
                                      handleCardImageChange(index, {
                                        target: { files: [file] },
                                      });
                                    }
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`imageUpload-${index}`}
                                    onChange={(e) =>
                                      handleCardImageChange(index, e)
                                    }
                                  />
                                  <label
                                    htmlFor={`imageUpload-${index}`}
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
                                        .getElementById(`imageUpload-${index}`)
                                        .click();
                                    }}
                                  >
                                    <Upload size={20} />
                                    Upload Image
                                  </Button>
                                </div>
                              </Tab>
                              <Tab key="url" title="Image URL">
                                <div className="flex gap-2">
                                  <Input
                                    radius="sm"
                                    placeholder="Image URL"
                                    variant="bordered"
                                    color="secondary"
                                    className="text-[#7469B6]  w-full "
                                    value={card.imageUrl || ""}
                                    onChange={(e) => {
                                      handleCardChange(
                                        index,
                                        "imageUrl",
                                        e.target.value
                                      );
                                    }}
                                  />
                                  <Button
                                    radius="sm"
                                    color="secondary"
                                    isDisabled={!card.imageUrl}
                                    onClick={() => {
                                      handleInsertImageFromUrl(card, index);
                                      onClose();
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </Tab>
                            </Tabs>
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
                                {tempImage && !card.image && (
                                  <img
                                    src={tempImage}
                                    onLoad={onImageLoad}
                                    alt="Crop preview"
                                    className="w-full h-full object-contain"
                                    // style={{
                                    //   transform: `scale(${zoom})`,
                                    // }}
                                  />
                                )}
                              </ReactCrop>
                            </div>
                          )}
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
                              confirmImage(index);
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
                <div className="flex w-full flex-col gap-4">
                  <Input
                    id="description"
                    size="lg"
                    radius="sm"
                    placeholder="Enter Description"
                    classNames={{
                      label: "text-white",
                      inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                    }}
                    variant="bordered"
                    color="secondary"
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
                                className="w-full h-full object-contain "
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
                    id="decision"
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
                  <div className="rounded-lg m-auto flex shrink-0 items-center justify-center border-dashed bg-gray-100 border-2 border-[#9183e2] w-full h-[300px]">
                    {card.image ? (
                      <div className="relative flex flex-col gap-2 w-full h-full">
                        <div className=" w-full h-full ">
                          <img
                            src={card.image}
                            alt="flashcard image"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>

                        <Button
                          isIconOnly
                          size="sm"
                          onClick={() => {
                            handleCardChange(index, "image", null);
                          }}
                          color="danger"
                          className="absolute top-2 right-2"
                        >
                          <Trash2 size={18} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          color="secondary"
                          className="absolute bottom-2 right-2"
                          aria-label="View Image"
                          onPress={() => {
                            onImageViewOpen();
                            setCurrentIndex(index);
                          }}
                        >
                          <ScanSearch size={18} />
                        </Button>
                        <Modal
                          isOpen={isImageViewOpen}
                          onOpenChange={onImageViewOpenChange}
                        >
                          <ModalContent>
                            {(onClose) => (
                              <>
                                <ModalHeader>Image Preview</ModalHeader>
                                <ModalBody>
                                  <div className="w-full h-full">
                                    <img
                                      src={card.image}
                                      alt="flashcard image"
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  </div>
                                </ModalBody>
                                <ModalFooter>
                                  <Button
                                    radius="sm"
                                    variant="flat"
                                    color="danger"
                                    onPress={onClose}
                                  >
                                    Close
                                  </Button>
                                </ModalFooter>
                              </>
                            )}
                          </ModalContent>
                        </Modal>
                      </div>
                    ) : (
                      <Button
                        id="upload-image-btn"
                        radius="sm"
                        color="secondary"
                        className="border-1 "
                        onClick={() => {
                          const newCards = [...cards];
                          newCards[index].isUploadModalOpen = true;
                          setCards(newCards);
                          setCurrentIndex(index);
                        }}
                      >
                        <Upload size={20} />
                        Upload Image
                      </Button>
                    )}
                  </div>
                </div>
                {/* <div className="flex shrink-0 items-center justify-center border-dashed border-2 border-gray-300 w-[150px] h-[150px] max-sm:w-[150px] max-sm:h-[150px]">
                  {card.image && (
                    <div className=" w-[150px] h-[150px] max-sm:w-[100px] max-sm:h-[100px]">
                      <img
                        src={card.image}
                        alt="Crop preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div> */}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <Button
        id="add-card-btn"
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
