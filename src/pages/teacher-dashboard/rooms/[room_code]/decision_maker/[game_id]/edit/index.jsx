import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardFooter,
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
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
  Tabs,
  Tab,
  Skeleton,
  useDisclosure,
} from "@nextui-org/react";
import { Info, Pencil, Trash2, ScanSearch, Upload, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Link from "next/link";
const index = () => {
  const router = useRouter();
  const { game_id, room_code } = router.query;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isImageViewOpen,
    onOpen: onImageViewOpen,
    onOpenChange: onImageViewOpenChange,
  } = useDisclosure();
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(null);
  const [imageURL, setImageURL] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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
    const newCards = [
      ...cards,
      {
        word: "",
        image: null,
        correct_answer: "",
        imageBlob: null,
        isNew: true,
      },
    ];
    setCards(newCards);

    // Update difficulty based on new card count
    if (newCards.length >= 10) {
      setDifficulty("hard");
    } else if (newCards.length >= 5) {
      setDifficulty("medium");
    } else {
      setDifficulty("easy");
    }
  };

  const removeCard = async (index) => {
    const userConfirmed = confirm(
      "Are you sure you want to delete this color game advanced card?"
    );
    if (userConfirmed) {
      const newCards = cards.filter((_, i) => i !== index);
      handleDeleteCard(index);
      setCards(newCards);

      // Update difficulty based on remaining cards
      if (newCards.length >= 10) {
        setDifficulty("hard");
      } else if (newCards.length >= 5) {
        setDifficulty("medium");
      } else {
        setDifficulty("easy");
      }
    }
  };

  const handleDeleteCard = async (cardIndex) => {
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
    console.log("difficulty", difficulty);
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
    await setupNewCards(cards);

    const cardsToUpdate = cards.filter((c) => !c.isNew); // Filter out new cards
    setIsSaving(true);

    toast.promise(
      (async () => {
        try {
          // Update difficulty based on current cards length
          console.log("difficulty before updating cards:", difficulty);
          for (const card of cardsToUpdate) {
            const body = JSON.stringify({
              title: title,
              cards: card,
              game_id: game_id,
              image: card.image,
              updated_image: card.image,
              difficulty: difficulty, // Ensure difficulty is included in the body
            });
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
            }
          }

          // Only alert and fetch once after all updates succeed
          fetchCards();
        } catch (error) {
          console.error("Error submitting form:", error);
          throw error;
        } finally {
          setIsSaving(false);
        }
      })(),
      {
        loading: "Saving...",
        success: "Decision maker updated successfully",
        error: "Error submitting form",
      }
    );
  };

  const fetchCards = async () => {
    setIsLoading(true);
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

      if (data.length >= 10) {
        setDifficulty("hard");
      } else if (data.length >= 5) {
        setDifficulty("medium");
      } else {
        setDifficulty("easy");
      }
      console.log("transformedData", transformedData);

      if (res.ok) {
        console.log("Cards fetched successfully");
        console.log(data);
      } else {
        console.error("Error fetching cards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Add a slight delay to get the skeleton effect
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
    newCards[index].imageBlob = newCards[index].imageUrl;
    setCards(newCards);
  };
  return (
    <div className="w-full flex flex-col gap-4 p-4 mx-auto max-w-[80rem]">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold ">
        <div className="flex gap-4 items-center ">
          <h1 className="">Edit Decision Maker</h1>
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
        {isSaving ? (
          <Button
            onPress={handleSubmit}
            color="secondary"
            isLoading
            isDisabled
            radius="sm"
          >
            Save Changes
          </Button>
        ) : (
          <Button onPress={handleSubmit} color="secondary" radius="sm">
            Save Changes
          </Button>
        )}
      </div>
      <Input
        isRequired
        placeholder="Title"
        classNames={{
          label: "text-white",
          inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
        }}
        variant="bordered"
        color="secondary"
        radius="sm"
        size="lg"
        onClear={() => setTitle("")}
        isClearable
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: cards.length }).map((_, index) => (
              <Skeleton key={index} className="w-full h-[300px] rounded-md" />
            ))
          : cards.map((card, index) => (
              <div key={index} className="flex flex-col gap-4">
                <Card className="w-full border  border-[#7469B6]  flex p-4 rounded-lg">
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
                    <div className="flex w-full flex-col gap-4">
                      <Input
                        size="lg"
                        radius="sm"
                        placeholder="Enter Description"
                        classNames={{
                          label: "text-white",
                          inputWrapper:
                            "bg-[#ffffff] border-1 border-[#7469B6]",
                        }}
                        variant="bordered"
                        color="secondary"
                        value={card.word}
                        onChange={(e) =>
                          handleCardChange(index, "word", e.target.value)
                        }
                      />
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

                      <Modal
                        size="lg"
                        isOpen={isOpen && currentIndex === index}
                        onOpenChange={onOpenChange}
                      >
                        <ModalContent>
                          {(onClose) => (
                            <>
                              <ModalHeader>
                                <h1>Upload Image</h1>
                              </ModalHeader>
                              <ModalBody>
                                <div className="w-full">
                                  {" "}
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
                                              .getElementById(
                                                `imageUpload-${index}`
                                              )
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
                                            handleInsertImageFromUrl(index);
                                            onClose();
                                          }}
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    </Tab>
                                  </Tabs>
                                </div>
                                {/* <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleCardImageChange(index, e)
                                  }
                                /> */}
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
                                      />
                                    </ReactCrop>
                                  </div>
                                )}
                              </ModalBody>
                              <ModalFooter>
                                <Button
                                  onClick={() => {
                                    confirmImage(currentIndex);
                                    onClose();
                                  }}
                                >
                                  Confirm Image
                                </Button>
                              </ModalFooter>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                      <div className="rounded-lg m-auto flex shrink-0 items-center justify-center border-dashed bg-gray-100 border-2 border-[#9183e2] w-full h-[300px]">
                        {card.image ? (
                          <div className="relative flex flex-col gap-2 w-full h-full">
                            <div className=" w-full h-full ">
                              <img
                                src={card.imageBlob || card.image}
                                alt="Crop preview"
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
                            radius="sm"
                            variant="bordered"
                            color="secondary"
                            className="border-1 "
                            onPress={() => {
                              setCurrentIndex(index);
                              onOpen();
                            }}
                          >
                            <Upload size={20} />
                            Upload Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
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
