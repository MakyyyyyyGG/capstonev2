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
  Textarea,
  Button,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  useDisclosure,
} from "@nextui-org/react";
import {
  Mic,
  Disc2,
  Image,
  Pencil,
  Plus,
  Trash2,
  Volume2,
  ScanSearch,
} from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const Index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const { data: session } = useSession();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flashcardData, setFlashcardData] = useState([]);
  const [newFlashcards, setNewFlashcards] = useState([]);
  const [videoURL, setVideoURL] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
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
  const [tempAudioBlob, setTempAudioBlob] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const imgRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [difficulty, setDifficulty] = useState("");

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }
  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/sequence_game/sequence_game?game_id=${game_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      // Add imageUrl property to each flashcard, initialized with the image value
      const flashcardsWithImageUrl = data.map((flashcard) => ({
        ...flashcard,
        imageUrl: flashcard.image || "",
      }));
      setFlashcardData(flashcardsWithImageUrl);
      setTitle(data[0].title);
      setVideo(data[0].video);
      if (data.length >= 10) {
        setDifficulty("hard");
      } else if (data.length >= 5) {
        setDifficulty("medium");
      } else {
        setDifficulty("easy");
      }

      if (res.ok) {
        console.log("Flashcards fetched successfully");
        console.log("data:", data);
      } else {
        console.error("Error fetching flashcards:", data.error);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (game_id) {
      fetchFlashcards();
    }
  }, [game_id]);

  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcardData];
    newFlashcards[index][field] = value;
    setFlashcardData(newFlashcards);
  };

  const setupNewFlashcards = async (flashcardData) => {
    const newFlashcards = flashcardData.filter((f) => f.isNew === true);
    console.log("setup fucntion newFlashcards", newFlashcards);
    if (newFlashcards.length > 0) {
      for (const flashcard of newFlashcards) {
        flashcard.sequence_game_set_id = flashcardData[0].sequence_game_set_id;
        flashcard.step;
        flashcard.image || null;
        flashcard.audio || null;

        try {
          const response = await fetch(
            "/api/sequence_game/update_sequence_game",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ sequences: [flashcard] }), // Wrap in an array
            }
          );
          if (response.ok) {
            console.log("Sequence created successfully");
            const data = await response.json();
            console.log("Sequence data:", data);
          } else {
            console.error("Error creating sequence");
          }
        } catch (error) {
          console.error("Error creating sequence:", error);
        }
      }
      console.log("newFlashcards", newFlashcards);
    }
    return newFlashcards;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setupNewFlashcards(flashcardData);

      // Filter out flashcards with 'isNew' as true, so they are not updated via PUT request
      const flashcardsToUpdate = flashcardData.filter((f) => !f.isNew);

      // Set difficulty based on flashcard length
      let newDifficulty;
      if (flashcardData.length >= 10) {
        newDifficulty = "hard";
      } else if (flashcardData.length >= 5) {
        newDifficulty = "medium";
      } else {
        newDifficulty = "easy";
      }

      for (const flashcard of flashcardsToUpdate) {
        const response = await fetch(
          `/api/sequence_game/sequence_game?sequence_id=${flashcard.sequence_game_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sequence: flashcard,
              title: title,
              game_id: game_id,
              video: video,
              difficulty: newDifficulty,
            }),
          }
        );

        if (response.ok) {
          console.log(
            `Flashcard ${flashcard.flashcard_id} updated successfully`
          );
        } else {
          console.error(`Error updating flashcard ${flashcard.flashcard_id}`);
        }
      }
      alert("Flashcards updated successfully");
    } catch (error) {
      console.error("Error updating flashcards:", error);
    } finally {
      setIsSaving(false);
    }
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
        const newFlashcards = [...flashcardData];
        newFlashcards[currentIndex].image = base64data;
        setFlashcardData(newFlashcards);
        setTempImage(null);
        setIsImageModalOpen(false);
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
        setTempAudioBlob(audioBlob);
        setIsRecording(false);
        setRecordingTime(0); // Reset the recording time
        clearInterval(recordingIntervalRef.current);
      });

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= 60) {
            clearInterval(recordingIntervalRef.current);
            recorder.stop();
            return 60;
          }
          return prevTime + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const removeAudio = (index) => {
    const newFlashcards = [...flashcardData];
    newFlashcards[index].audio = null;
    setFlashcardData(newFlashcards);
    setAudioBlob(null);
  };

  const removeTempAudio = () => {
    setTempAudioBlob(null);
  };

  const removeImage = (index) => {
    const newFlashcards = [...flashcardData];
    newFlashcards[index].image = null;
    setFlashcardData(newFlashcards);
    setTempImage(null);
    setCurrentIndex(index); // Ensure the current index is set for the modal
  };

  const insertAudio = () => {
    if (tempAudioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.replace(/^data:.+;base64,/, "");
        if (isValidBase64(base64String)) {
          handleInputChange(
            currentIndex,
            "audio",
            `data:audio/wav;base64,${base64String}`
          );
        } else {
          console.error("Invalid Base64 data for audio");
        }
      };
      reader.readAsDataURL(tempAudioBlob);
    }
    setIsAudioModalOpen(false);
  };

  const isValidBase64 = (str) => {
    try {
      atob(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const newZoom = zoom + event.deltaY * -0.01;
    setZoom(Math.min(Math.max(1, newZoom), 3)); // Clamp zoom between 1 and 3
  };

  const removeFlashcard = async (index) => {
    const userConfirmed = confirm(
      "Are you sure you want to delete this flashcard?"
    );
    if (userConfirmed) {
      console.log("Removing flashcard at index:", index);
      const newFlashcards = flashcardData.filter((_, i) => i !== index);
      setFlashcardData(newFlashcards);
      console.log(
        "removed flashcard id:",
        flashcardData[index].sequence_game_id
      );
      try {
        const response = await fetch(
          `/api/sequence_game/update_sequence_game?sequence_game_id=${flashcardData[index].sequence_game_id}`,
          {
            method: "DELETE",
          }
        );
        if (response.ok) {
          console.log("Flashcard deleted successfully");
          if (flashcardData.length + 1 >= 10) {
            setDifficulty("hard");
          } else if (flashcardData.length + 1 >= 5) {
            setDifficulty("medium");
          } else {
            setDifficulty("easy");
          }
        } else {
          console.error("Error deleting flashcard");
        }
      } catch (error) {
        console.error("Error deleting flashcard:", error);
      }
    } else {
      console.log("Flashcard deletion cancelled");
    }
  };

  const addFlashcard = () => {
    const newFlashcard = {
      flashcard_id: Date.now(),
      step: "",
      image: null,
      imageUrl: "", // Add imageUrl property
      audio: null,
      isNew: true,
    };
    if (flashcardData.length + 1 >= 10) {
      setDifficulty("hard");
    } else if (flashcardData.length + 1 >= 5) {
      setDifficulty("medium");
    } else {
      setDifficulty("easy");
    }
    setFlashcardData([...flashcardData, newFlashcard]);
  };

  const handleTextToSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const synth = window.speechSynthesis;

    let voices = synth.getVoices();

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
  const handleFlashcardImageChange = (index, e) => {
    setCurrentIndex(index);
    handleImageChange(e);
  };
  const handleInsertImageFromUrl = (flashcard, index) => {
    const updatedCards = [...flashcardData];
    updatedCards[index].image = flashcard.imageUrl;
    setFlashcardData(updatedCards);
  };

  const handleAddVideo = (video) => {
    let embeddableVideoURL;

    if (video.includes("youtu.be")) {
      // Handle short YouTube URL (e.g., https://youtu.be/<video-id>)
      const videoId = video.split("/")[3].split("?")[0];
      const queryParams = video.split("?")[1] ? `?${video.split("?")[1]}` : "";
      embeddableVideoURL = `https://www.youtube.com/embed/${videoId}${queryParams}`;
    } else if (video.includes("youtube.com/watch")) {
      // Handle standard YouTube URL (e.g., https://www.youtube.com/watch?v=<video-id>)
      const videoId = video.split("v=")[1].split("&")[0];
      const queryParams = video.split("&").slice(1).join("&")
        ? `?${video.split("&").slice(1).join("&")}`
        : "";
      embeddableVideoURL = `https://www.youtube.com/embed/${videoId}${queryParams}`;
    } else {
      embeddableVideoURL = video;
    }

    console.log("embeddableVideoURL:", embeddableVideoURL);
    setVideo(embeddableVideoURL);
  };

  const handleVideoChange = (e) => {
    const newVideo = e.target.value;
    setVideo(newVideo);
    handleAddVideo(newVideo);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      {isLoading ? (
        <Skeleton className="w-full h-[900px] rounded-md" />
      ) : (
        <>
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <h1>Edit Sequence Game Page</h1>
          </div>
          <div className="flex flex-col gap-4 justify-between items-center">
            <div>
              {isSaving ? (
                <Button isLoading isDisabled>
                  Save Changes
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  className="mt-5 bg-[#7469B6] text-white border-0"
                >
                  Save Changes
                </Button>
              )}
            </div>
            {flashcardData && flashcardData.length > 0 && (
              <>
                <Input
                  value={title}
                  label="Game Title"
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-[#7469B6] z-0"
                />
                <Input
                  value={video}
                  placeholder={video}
                  label="Video URL"
                  onChange={handleVideoChange}
                  variant="underlined"
                  color="secondary"
                  className="text-[#7469B6] z-0"
                />
                {/* {videoURL && (
              <iframe
                src={videoURL}
                frameBorder="0"
                width="100%"
                height="400"
                allowFullScreen
                title="Sequence Game Video"
              />
            )} */}
                <iframe
                  src={video}
                  frameBorder="0"
                  width="100%"
                  height="400"
                  allowFullScreen
                  title="Sequence Game Video"
                />
                <h1 className="text-2xl font-bold">{title}</h1>
                <h1 className="text-2xl font-bold">Difficulty: {difficulty}</h1>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {flashcardData.map((flashcard, index) => (
              <div key={flashcard.flashcard_id} className="w-full">
                <Card className="w-full border border-slate-800 rounded-md flex">
                  <CardHeader className="flex px-3 justify-between items-center z-0">
                    <div className="pl-2 text-xl font-bold">
                      <h1>{index + 1}</h1>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        label="Image"
                        variant="underlined"
                        color="secondary"
                        className="text-[#7469B6] z-0"
                        value={flashcard.imageUrl}
                        onChange={(e) => {
                          handleInputChange(index, "imageUrl", e.target.value);
                        }}
                      />
                      <Button
                        className="bg-[#7469B6] text-white border-0"
                        onClick={() =>
                          handleInsertImageFromUrl(flashcard, index)
                        }
                      >
                        Replace
                      </Button>
                      <Button
                        className="bg-[#7469B6] text-white border-0"
                        onPress={() => {
                          setIsImageModalOpen(true);
                          setCurrentIndex(index);
                        }}
                      >
                        <Pencil size={22} /> Edit Image
                      </Button>
                      <Modal
                        isDismissable={false}
                        isOpen={isImageModalOpen && currentIndex === index}
                        onOpenChange={() => setIsImageModalOpen(false)}
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
                                      handleFlashcardImageChange(
                                        currentIndex,
                                        e
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor="imageUpload"
                                    className="block"
                                  >
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
                                <Button color="danger" onPress={onClose}>
                                  Cancel
                                </Button>
                                <Button
                                  className="bg-[#7469B6] text-white border-0"
                                  onPress={confirmImage}
                                >
                                  Insert
                                </Button>
                              </ModalFooter>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                      <Button
                        isIconOnly
                        color="danger"
                        onPress={() => removeFlashcard(index)}
                      >
                        <Trash2 size={22} />
                      </Button>
                    </div>
                  </CardHeader>
                  <Divider className="m-0 h-0.5 bg-slate-300" />
                  <CardBody className="flex flex-col gap-4">
                    <div className="flex w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                      <div className="flex shrink flex-col w-[45%] gap-2 max-sm:w-full">
                        <Input
                          label="Step"
                          variant="underlined"
                          color="secondary"
                          className="text-[#7469B6] z-0"
                          value={flashcard.step}
                          onChange={(e) =>
                            handleInputChange(index, "step", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex w-[55%] gap-2 max-sm:w-full">
                        <div className="flex shrink-0 items-center justify-center border-dashed border-2 border-gray-300 w-[100px] h-[100px] max-sm:w-[70px] max-sm:h-[70px]">
                          <div className="relative flex flex-col gap-2">
                            <div className=" w-[100px] h-[100px] max-sm:w-[70px] max-sm:h-[70px]">
                              <img
                                src={flashcard.image}
                                alt={flashcard.step}
                                className="w-full h-auto"
                              />
                            </div>
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              className="absolute top-2 right-2 max-sm:top-0 max-sm:right-0"
                              onPress={() => {
                                removeImage(index);
                              }}
                            >
                              <Trash2 size={18} />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              className="absolute bg-[#7469B6] text-white border-0 bottom-2 right-2 max-sm:bottom-0 max-sm:right-0"
                              onPress={() => {
                                setIsImageViewOpen(true);
                                setCurrentIndex(index);
                              }}
                            >
                              <ScanSearch size={18} />
                            </Button>
                            <Modal
                              isOpen={isImageViewOpen && currentIndex === index}
                              onOpenChange={() => setIsImageViewOpen(false)}
                              size="lg"
                            >
                              <ModalContent>
                                <ModalHeader>Image Preview</ModalHeader>
                                <ModalBody>
                                  <img
                                    src={flashcard.image}
                                    alt={flashcard.step}
                                    className="w-full h-auto"
                                  />
                                </ModalBody>
                              </ModalContent>
                            </Modal>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                  <Divider className="m-0 h-0.5 bg-slate-300" />
                  <CardFooter className="flex px-3 gap-2 items-center justify-between">
                    <div className="flex gap-2 w-full items-center max-sm:flex-col">
                      {flashcard.audio ? (
                        <div className="flex gap-2">
                          <Button
                            className="bg-[#7469B6] text-white border-0"
                            onPress={() => {
                              setIsAudioModalOpen(true);
                              setCurrentIndex(index);
                            }}
                          >
                            <Mic size={22} /> Edit Audio
                          </Button>
                          <Button
                            color="danger"
                            onPress={() => {
                              removeAudio(index);
                            }}
                          >
                            <Trash2 size={22} /> Delete Audio
                          </Button>
                          <audio
                            src={flashcard.audio}
                            controls
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <Button
                          className="bg-[#7469B6] text-white border-0"
                          onPress={() => {
                            setIsAudioModalOpen(true);
                            setCurrentIndex(index);
                          }}
                        >
                          <Mic size={22} /> Record Audio
                        </Button>
                      )}
                      <Modal
                        isOpen={isAudioModalOpen && currentIndex === index}
                        onOpenChange={() => setIsAudioModalOpen(false)}
                        size="lg"
                        onClose={() => {
                          setTempAudioBlob(null);
                        }}
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
                                    className="bg-[#7469B6] text-white border-0"
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
                                      <p>{formatTime(recordingTime)}/01:00</p>
                                    </div>
                                  </Button>
                                )}
                                {tempAudioBlob && (
                                  <>
                                    <div className="flex gap-2 items-center justify-between">
                                      <audio
                                        controls
                                        src={URL.createObjectURL(tempAudioBlob)}
                                      ></audio>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={removeTempAudio}
                                          color="danger"
                                        >
                                          <Trash2 size={22} />
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
                                  className="bg-[#7469B6] text-white border-0"
                                  onClick={() => {
                                    insertAudio();
                                    onClose();
                                    setAudioBlob(null);
                                  }}
                                  isDisabled={!tempAudioBlob}
                                >
                                  Insert
                                </Button>
                              </ModalFooter>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
          <Button
            size="lg"
            radius="sm"
            className="my-4 text-sm bg-[#7469B6] text-white border-0"
            onClick={addFlashcard}
            startContent={<Plus size={22} />}
          >
            Add Flashcard
          </Button>
        </>
      )}
    </div>
  );
};

export default Index;
