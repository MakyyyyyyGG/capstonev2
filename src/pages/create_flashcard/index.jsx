import React, { useState, useEffect, useRef } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Divider,
  Tooltip,
  Spinner,
  Textarea,
  Tab,
  Tabs,
} from "@nextui-org/react";
import {
  Mic,
  Disc2,
  Image,
  Plus,
  Volume2,
  VolumeX,
  Trash2,
  ScanSearch,
  Upload,
} from "lucide-react";
import { message } from "antd";
import toast, { Toaster } from "react-hot-toast";

import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Loader from "@/pages/components/Loader";
const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [voice, setVoice] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [audioBlob, setAudioBlob] = useState(null);
  const [insertedAudio, setInsertedAudio] = useState(null);
  const { room_code } = router.query;
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(60); // 60 seconds = 1 minute
  const [flashcards, setFlashcards] = useState([
    {
      term: "",
      description: "",
      image: null,
      audio: null,
      imageUrl: "",
      isUploadModalOpen: false,
      isImagePreviewOpen: false,
      isRecordingModalOpen: false,
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const imgRef = useRef(null);

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  useEffect(() => {
    if (room_code) {
      console.log("room_code:", room_code);
    }
  }, [room_code]);

  useEffect(() => {
    let interval;
    if (isRecording && recordingTime > 0) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (recordingTime === 0) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime]);

  const handleCreateFlashcard = async () => {
    // console.log("Flashcards:", flashcards);
    if (!title || !room_code || !session?.user?.id) {
      console.error("Missing required fields");
      return;
    }
    if (flashcards.length < 2) {
      toast.error("You need to add at least 2 flashcards");
      return;
    }
    if (
      flashcards.some((flashcard) => !flashcard.term || !flashcard.description)
    ) {
      toast.error("All flashcards must have a term and description");
      return;
    }
    if (flashcards.some((flashcard) => !flashcard.image)) {
      toast.error("All flashcards must have an image");
      return;
    }

    toast
      .promise(
        (async () => {
          const response = await fetch("/api/flashcard/flashcard", {
            method: "POST",
            headers: {
              "Content-Type": "application/json", // Set the Content-Type header
            },
            body: JSON.stringify({
              title: title,
              room_code: room_code,
              account_id: session?.user?.id,
              flashcards: flashcards,
            }),
          });
          setIsLoading(true);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          // console.log("Flashcard created successfully");
          console.log("Flashcard created successfullyasjdhasjdasgh:", data);
          console.log("flashcard set id:", data.group_id);

          return data;
        })(),
        {
          loading: "Creating flashcard...",
          success: "Flashcard created successfully",
          error: "Error creating flashcard",
        }
      )
      .then((data) => {
        router.push(
          `/teacher-dashboard/rooms/${room_code}/flashcard/${data.gameId}`
        );
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error creating flashcard:", error.message);
        toast.error("Error creating flashcard");
      });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        setIsRecording(false);
        setRecordingTime(60); // Reset the recording time
      });

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setInsertedAudio(null);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setTempImage(reader.result); // Base64 string
    };

    if (file) {
      reader.readAsDataURL(file); // Convert to Base64
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
        const newFlashcards = [...flashcards];
        newFlashcards[index].image = base64data;
        newFlashcards[index].isUploadModalOpen = false;
        setFlashcards(newFlashcards);
        setTempImage(null);
      };
    }, "image/jpeg");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const insertAudio = () => {
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.replace(/^data:.+;base64,/, "");
        if (isValidBase64(base64String)) {
          handleFlashcardAudioChange(
            currentIndex,
            `data:audio/wav;base64,${base64String}`
          );
        } else {
          console.error("Invalid Base64 data for audio");
        }
      };
      reader.readAsDataURL(audioBlob);
    }
    const newFlashcards = [...flashcards];
    newFlashcards[currentIndex].isRecordingModalOpen = false;
    setFlashcards(newFlashcards);
  };

  const isValidBase64 = (str) => {
    try {
      atob(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleFlashcardChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
  };

  const handleFlashcardImageChange = (index, e) => {
    setCurrentIndex(index);
    handleImageChange(e);
  };

  const handleFlashcardAudioChange = (index, audioBlob) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index].audio = audioBlob;
    setFlashcards(newFlashcards);
  };

  const addFlashcard = () => {
    setFlashcards([
      ...flashcards,
      {
        term: "",
        description: "",
        image: null,
        audio: null,
        imageUrl: "",
        isUploadModalOpen: false,
        isImagePreviewOpen: false,
        isRecordingModalOpen: false,
      },
    ]);
    setTempImage(null);
    console.log("Flashcards:", flashcards);
  };

  const removeFlashcard = (index) => {
    const newFlashcards = flashcards.filter((_, i) => i !== index);
    setFlashcards(newFlashcards);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const newZoom = zoom + event.deltaY * -0.01;
    setZoom(Math.min(Math.max(1, newZoom), 3)); // Clamp zoom between 1 and 3
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
  const handleInsertImageFromUrl = (flashcard, index) => {
    const updatedCards = [...flashcards];
    updatedCards[index].image = flashcard.imageUrl;
    setFlashcards(updatedCards);
  };

  return (
    <div className="w-full">
      <Toaster />
      <div className="flex">
        <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
          {/* <h1>room_code: {room_code}</h1>
          <h1>session: {session?.user?.id}</h1> */}
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <h1 className="">Create a new flashcard set</h1>
            <div>
              {isLoading ? (
                <Button color="secondary" isDisabled isLoading radius="sm">
                  Create
                </Button>
              ) : (
                <Button
                  radius="sm"
                  color="secondary"
                  isDisabled={!title}
                  onClick={handleCreateFlashcard}
                >
                  Create
                </Button>
              )}
            </div>
          </div>
          <div className="items-center z-0">
            <Input
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.map((flashcard, index) => (
              <Card
                key={index}
                className="w-full  rounded-md flex m-auto p-2  border-1 border-[#7469B6]"
              >
                <CardHeader className="flex   items-center justify-between ">
                  <div className="pl-2 text-xl font-bold">
                    <h1>{index + 1}</h1>
                  </div>
                  <Button
                    radius="sm"
                    isIconOnly
                    color="danger"
                    onClick={() => removeFlashcard(index)}
                  >
                    <Trash2 size={20} />
                  </Button>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center justify-end gap-2">
                    <Modal
                      isOpen={flashcard.isUploadModalOpen}
                      onOpenChange={(isOpen) => {
                        const newFlashcards = [...flashcards];
                        newFlashcards[index].isUploadModalOpen = isOpen;
                        setFlashcards(newFlashcards);
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
                                      className="  rounded-lg border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer"
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file) {
                                          handleFlashcardImageChange(index, {
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
                                          handleFlashcardImageChange(index, e)
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
                                        value={flashcard.imageUrl || ""}
                                        onChange={(e) => {
                                          handleFlashcardChange(
                                            index,
                                            "imageUrl",
                                            e.target.value
                                          );
                                        }}
                                      />
                                      <Button
                                        radius="sm"
                                        color="secondary"
                                        isDisabled={!flashcard.imageUrl}
                                        onClick={() => {
                                          handleInsertImageFromUrl(
                                            flashcard,
                                            index
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

                              {tempImage && (
                                <div
                                  className="w-full h-full"
                                  onWheel={handleWheel}
                                >
                                  <ReactCrop
                                    className="w-full h-full"
                                    src={tempImage}
                                    crop={crop}
                                    onChange={(newCrop) => setCrop(newCrop)}
                                    aspect={1}
                                  >
                                    {tempImage && !flashcard.image && (
                                      <img
                                        src={tempImage}
                                        onLoad={onImageLoad}
                                        alt="Crop preview"
                                        className="w-full h-full object-contain"
                                        style={{
                                          transform: `scale(${zoom})`,
                                        }}
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
                                onClick={() => confirmImage(index)}
                              >
                                Insert
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                  </div>
                  <div className="flex flex-col w-full gap-4 justify-between">
                    <div className="aspect-square rounded-lg m-auto flex shrink-0 items-center justify-center border-dashed bg-gray-100 border-2 border-[#9183e2] w-full max-w-[300px] h-[300px]">
                      {flashcard.image ? (
                        <div className="relative flex flex-col gap-2 w-full h-full">
                          <div className="w-full h-full">
                            <img
                              src={flashcard.image}
                              alt="flashcard image"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            onClick={() => {
                              handleFlashcardChange(index, "image", null);
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
                            onClick={() => {
                              const newFlashcards = [...flashcards];
                              newFlashcards[index].isImagePreviewOpen = true;
                              setFlashcards(newFlashcards);
                              setCurrentIndex(index);
                            }}
                          >
                            <ScanSearch size={18} />
                          </Button>
                          <Modal
                            isOpen={flashcard.isImagePreviewOpen}
                            onOpenChange={(isOpen) => {
                              const newFlashcards = [...flashcards];
                              newFlashcards[index].isImagePreviewOpen = isOpen;
                              setFlashcards(newFlashcards);
                            }}
                          >
                            <ModalContent>
                              {(onClose) => (
                                <>
                                  <ModalHeader>Image Preview</ModalHeader>
                                  <ModalBody>
                                    <div className="w-full h-full">
                                      <img
                                        src={flashcard.image}
                                        alt="flashcard image"
                                        className=" w-full h-full object-cover rounded-lg"
                                      />
                                    </div>
                                  </ModalBody>
                                  <ModalFooter>
                                    <Button
                                      radius="sm"
                                      color="danger"
                                      onPress={onClose}
                                      variant="flat"
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
                          color="secondary"
                          className="border-1 "
                          onClick={() => {
                            const newFlashcards = [...flashcards];
                            newFlashcards[index].isUploadModalOpen = true;
                            setFlashcards(newFlashcards);
                            setCurrentIndex(index);
                          }}
                        >
                          <Upload size={20} />
                          Upload Image
                        </Button>
                      )}
                    </div>
                    <div className="m-auto w-full">
                      {flashcard.audio ? (
                        <div className="flex gap-3  w-full">
                          <div className="flex gap-2 w-full justify-between">
                            <Button
                              className="border-1 w-full"
                              radius="sm"
                              onClick={() => {
                                const audio = new Audio(flashcard.audio);
                                audio.play();
                              }}
                              color="secondary"
                            >
                              <Volume2 size={20} />
                              Play Audio
                            </Button>
                            <Button
                              isIconOnly
                              radius="sm"
                              onClick={() =>
                                handleFlashcardChange(index, "audio", null)
                              }
                              color="danger"
                            >
                              <Trash2 size={20} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          radius="sm"
                          color="secondary"
                          className="border-1 w-full"
                          onClick={() => {
                            const newFlashcards = [...flashcards];
                            newFlashcards[index].isRecordingModalOpen = true;
                            setFlashcards(newFlashcards);
                            setCurrentIndex(index);
                          }}
                        >
                          <Mic size={20} />
                          Record Audio
                        </Button>
                      )}
                    </div>
                    <div className="flex shrink flex-col w-full gap-2">
                      <Input
                        isClearable
                        onClear={() => handleFlashcardChange(index, "term", "")}
                        type="text"
                        radius="sm"
                        variant="bordered"
                        classNames={{
                          label: "",
                          inputWrapper: "border-1 border-[#7469B6]",
                        }}
                        label={`Term`}
                        value={flashcard.term}
                        onChange={(e) =>
                          handleFlashcardChange(index, "term", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex w-full gap-2">
                      <Textarea
                        rows={5}
                        radius="sm"
                        disableAnimation
                        disableAutosize
                        classNames={{
                          input: "resize-y min-h-[40px]",
                          inputWrapper: "border-1 border-[#7469B6]",
                        }}
                        type="text"
                        variant="bordered"
                        label={`Description`}
                        value={flashcard.description}
                        onChange={(e) =>
                          handleFlashcardChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardBody>
                <div>
                  {/* <Button onClick={() => message.success("Button clicked!")}>
                      Click me
                    </Button> */}
                  <Modal
                    isOpen={flashcard.isRecordingModalOpen}
                    onOpenChange={(isOpen) => {
                      const newFlashcards = [...flashcards];
                      newFlashcards[index].isRecordingModalOpen = isOpen;
                      setFlashcards(newFlashcards);
                      if (!isOpen) {
                        setAudioBlob(null);
                      }
                    }}
                    size="lg"
                  >
                    <ModalContent>
                      {(onClose) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            Record Audio
                          </ModalHeader>
                          <ModalBody>
                            {!isRecording ? (
                              <Button
                                radius="sm"
                                color="secondary"
                                onClick={startRecording}
                              >
                                Start Recording
                              </Button>
                            ) : (
                              <Button
                                onClick={stopRecording}
                                color="danger"
                                className="flex items-center gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Disc2 size={24} />
                                  <p>{formatTime(60 - recordingTime)}/01:00</p>
                                </div>
                              </Button>
                            )}
                            {audioBlob && (
                              <>
                                <div className="flex flex-col gap-3 p-3 border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                      Preview
                                    </span>

                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="light"
                                      onClick={removeAudio}
                                      className="min-w-0"
                                    >
                                      <VolumeX size={18} />
                                    </Button>
                                  </div>
                                  <audio
                                    controls
                                    className="w-full"
                                    src={URL.createObjectURL(audioBlob)}
                                  />
                                </div>
                              </>
                            )}
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              radius="sm"
                              color="danger"
                              onPress={onClose}
                              variant="flat"
                            >
                              Cancel
                            </Button>
                            <Button
                              radius="sm"
                              color="secondary"
                              onClick={() => {
                                insertAudio();
                                onClose();
                                setAudioBlob(null);
                              }}
                              isDisabled={!audioBlob}
                            >
                              Insert
                            </Button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                </div>
              </Card>
            ))}
          </div>
          <Button
            size="lg"
            radius="sm"
            color="secondary"
            className="my-4 text-sm"
            onClick={addFlashcard}
            startContent={<Plus size={22} />}
          >
            Add Flashcard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
