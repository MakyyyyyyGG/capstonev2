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
  modal,
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
} from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const Index = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isRecordingOpen,
    onOpen: onRecordingOpen,
    onOpenChange: onRecordingOpenChange,
  } = useDisclosure();
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

  const [zoom, setZoom] = useState(1);
  const [audioBlob, setAudioBlob] = useState(null);
  const [insertedAudio, setInsertedAudio] = useState(null);
  const { room_code } = router.query;
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(60); // 60 seconds = 1 minute
  const [flashcards, setFlashcards] = useState([
    { term: "", description: "", image: null, audio: null },
  ]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const imgRef = useRef(null);

  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);

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
    console.log("Flashcards:", flashcards);
    if (!title || !room_code || !session?.user?.id) {
      console.error("Missing required fields");
      return;
    }
    if (flashcards.length < 2) {
      alert("You need to add at least 2 flashcards");
      return;
    }
    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Flashcard created successfully");
      console.log("Flashcard created successfully:", data);
      console.log("Flashcards data:", flashcards);
      alert("Flashcard created successfully");
    } catch (error) {
      console.error("Error creating flashcard:", error.message);
    }
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
  const confirmImage = () => {
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
        newFlashcards[currentIndex].image = base64data;
        setFlashcards(newFlashcards);
        setTempImage(null);
        onOpenChange(false);
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
    onRecordingOpenChange(false);
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
      { term: "", description: "", image: null, audio: null },
    ]);
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
        <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
          {/* <h1>room_code: {room_code}</h1>
          <h1>session: {session?.user?.id}</h1> */}
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <h1 className="">Create a new flashcard set</h1>
            <div>
              <Button
                color="secondary"
                isDisabled={!title}
                onClick={handleCreateFlashcard}
              >
                Create
              </Button>
            </div>
          </div>
          <div className="items-center">
            <Input
              label="Flashcard Title"
              value={title}
              variant="faded"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {flashcards.map((flashcard, index) => (
              <Card
                key={index}
                className="w-full border border-slate-800 rounded-md flex"
              >
                <CardHeader className="flex px-5 justify-between items-center">
                  <div className="text-xl font-bold">
                    <h1>{index + 1}</h1>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      color="secondary"
                      onPress={() => {
                        onOpen();
                        setCurrentIndex(index);
                      }}
                    >
                      <Image />
                      Add Image
                    </Button>
                    <Modal
                      isOpen={isOpen}
                      onOpenChange={onOpenChange}
                      size="lg"
                      onClose={() => {
                        setTempImage(null);
                      }}
                    >
                      <ModalContent>
                        {(onClose) => (
                          <>
                            <ModalHeader className="flex flex-col gap-1">
                              Upload Image
                            </ModalHeader>
                            <ModalBody>
                              <div
                                className="border-2 border-dashed border-gray-400 rounded-md p-8 text-center cursor-pointer"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files[0];
                                  if (file) {
                                    handleFlashcardImageChange(currentIndex, {
                                      target: { files: [file] },
                                    });
                                  }
                                }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="imageUpload"
                                  onChange={(e) =>
                                    handleFlashcardImageChange(currentIndex, e)
                                  }
                                />
                                <label htmlFor="imageUpload" className="block">
                                  Drag or upload your image here
                                </label>
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
                                    {tempImage && (
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
                                color="danger"
                                onPress={onClose}
                                onClick={() => {
                                  setTempImage(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button color="secondary" onPress={confirmImage}>
                                Insert
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                    <Tooltip
                      showArrow={true}
                      placement="bottom"
                      content="Delete Flashcard"
                      color="danger"
                    >
                      <Button
                        isIconOnly
                        color="danger"
                        onClick={() => removeFlashcard(index)}
                      >
                        <Trash2 size={22} />
                      </Button>
                    </Tooltip>
                  </div>
                </CardHeader>
                <Divider className="m-0 h-0.5 bg-slate-300" />
                <CardBody>
                  <div className="flex w-full gap-4">
                    <div className="flex flex-col w-[45%] gap-2">
                      <Input
                        type="text"
                        variant="underlined"
                        color="secondary"
                        className="text-[#7469B6]"
                        label={`Flashcard Term ${index + 1}`}
                        value={flashcard.term}
                        onChange={(e) =>
                          handleFlashcardChange(index, "term", e.target.value)
                        }
                      />
                      {/* {flashcard.term && (
                        <Button
                          color="secondary"
                          onPress={() => handleTextToSpeech(flashcard.term)}
                        >
                          <Volume2 /> Play Term
                        </Button>
                      )} */}
                    </div>
                    <div className="flex w-[45%]">
                      <Input
                        type="text"
                        variant="underlined"
                        color="secondary"
                        className="text-[#7469B6]"
                        label={`Flashcard Description ${index + 1}`}
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
                    <div className="flex items-center justify-center border-dashed border-2 border-gray-300 w-[100px] h-[100px]">
                      {flashcard.image && (
                        <div className="relative flex flex-col gap-2">
                          <div className=" w-[100px] h-[100px]">
                            <img
                              src={flashcard.image}
                              alt="flashcard image"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Tooltip
                            showArrow={true}
                            placement="left"
                            content="Delete Image"
                            color="danger"
                          >
                            <Button
                              isIconOnly
                              size="sm"
                              onClick={() =>
                                handleFlashcardChange(index, "image", null)
                              }
                              color="danger"
                              className="absolute top-2 right-2"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </Tooltip>
                          <Tooltip
                            showArrow={true}
                            placement="left"
                            content="Show Image"
                            color="secondary"
                          >
                            <Button
                              isIconOnly
                              size="sm"
                              color="secondary"
                              className="absolute bottom-2 right-2"
                            >
                              <ScanSearch size={18} />
                            </Button>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
                <Divider className="m-0 h-0.5 bg-slate-300" />
                <CardFooter className="flex px-5 gap-2 items-center justify-between">
                  <div>
                    <Button
                      color="secondary"
                      className="my-2"
                      onPress={() => {
                        onRecordingOpen();
                        setCurrentIndex(index);
                      }}
                    >
                      <Mic />
                      Record Audio
                    </Button>
                    <Modal
                      isOpen={isRecordingOpen}
                      onOpenChange={(isOpen) => {
                        onRecordingOpenChange(isOpen);
                        if (!isOpen) {
                          setAudioBlob(null);
                          // handleFlashcardChange(index, "image", null);
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
                                    <p>
                                      {formatTime(60 - recordingTime)}/01:00
                                    </p>
                                  </div>
                                </Button>
                              )}
                              {audioBlob && (
                                <>
                                  <div className="flex items-center justify-between gap-3">
                                    <audio
                                      controls
                                      src={URL.createObjectURL(audioBlob)}
                                    ></audio>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={removeAudio}
                                        color="danger"
                                      >
                                        <VolumeX size={20} />
                                        Remove Audio
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </ModalBody>
                            <ModalFooter>
                              <Button color="danger" onPress={onClose}>
                                Cancel
                              </Button>
                              <Button
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
                  <div>
                    {flashcard.audio && (
                      <div className="flex gap-3">
                        <audio controls src={flashcard.audio}></audio>
                        <Button
                          onClick={() =>
                            handleFlashcardChange(index, "audio", null)
                          }
                          color="danger"
                          className="mt-2"
                        >
                          <VolumeX size={20} />
                          Remove Audio
                        </Button>
                      </div>
                    )}
                  </div>
                </CardFooter>
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
