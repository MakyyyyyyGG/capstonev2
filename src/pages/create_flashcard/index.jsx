import React, { useState, useEffect, useRef } from "react";
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
  modal,
} from "@nextui-org/react";
import { Mic, Disc2, Image, Plus, Volume2 } from "lucide-react";
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
      <div>
        <h1>room_code: {room_code}</h1>
        <h1>session: {session?.user?.id}</h1>
        <h1>Create a new flashcard set</h1>
        <div className="w-80">
          <Input
            label="Flashcard Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          {flashcards.map((flashcard, index) => (
            <Card
              key={index}
              className="w-[600px] border border-slate-800 rounded-md p-4 flex flex-col gap-2"
            >
              <Input
                type="text"
                label={`Flashcard Term ${index + 1}`}
                value={flashcard.term}
                onChange={(e) =>
                  handleFlashcardChange(index, "term", e.target.value)
                }
              />
              {flashcard.term && (
                <Button
                  color="secondary"
                  onPress={() => handleTextToSpeech(flashcard.term)}
                >
                  <Volume2 />
                </Button>
              )}
              <Input
                type="text"
                label={`Flashcard Description ${index + 1}`}
                value={flashcard.description}
                onChange={(e) =>
                  handleFlashcardChange(index, "description", e.target.value)
                }
              />
              <div className="flex gap-2 items-center">
                <Button
                  color="secondary"
                  onPress={() => {
                    onOpen();
                    setCurrentIndex(index);
                  }}
                >
                  <Image />
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
                                    style={{ transform: `scale(${zoom})` }}
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
                <Button
                  color="secondary"
                  onPress={() => {
                    onRecordingOpen();
                    setCurrentIndex(index);
                  }}
                >
                  <Mic />
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
                            <Button color="secondary" onClick={startRecording}>
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
                              <audio
                                controls
                                src={URL.createObjectURL(audioBlob)}
                              ></audio>
                              <div className="flex gap-2">
                                <Button onClick={removeAudio} color="danger">
                                  Remove Audio
                                </Button>
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
              <div className="flex gap-2 flex-col">
                {flashcard.image && (
                  <div className="flex flex-col gap-2">
                    <div className="w-[500px] h-[500px]">
                      <img
                        src={flashcard.image}
                        alt="flashcard image"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <Button
                      onClick={() =>
                        handleFlashcardChange(index, "image", null)
                      }
                      color="danger"
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
                {flashcard.audio && (
                  <div>
                    <audio controls src={flashcard.audio}></audio>
                    <Button
                      onClick={() =>
                        handleFlashcardChange(index, "audio", null)
                      }
                      color="danger"
                      className="mt-2"
                    >
                      Remove Audio
                    </Button>
                  </div>
                )}
              </div>
              <Button
                color="danger"
                onClick={() => removeFlashcard(index)}
                className="mt-2"
              >
                Remove Flashcard
              </Button>
            </Card>
          ))}
        </div>
        <Button color="secondary" className="my-4" onClick={addFlashcard}>
          Add Flashcard
        </Button>
        <div>
          <Button
            color="secondary"
            className="my-4"
            isDisabled={!title}
            onClick={handleCreateFlashcard}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
