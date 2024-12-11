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
  Tabs,
  Tab,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
} from "@nextui-org/react";
import {
  Mic,
  Disc2,
  Image,
  Pencil,
  Plus,
  VolumeX,
  Trash2,
  Volume2,
  Info,
  Video,
  ScanSearch,
  Upload,
  Trash,
  VideoOff,
} from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import toast, { Toaster } from "react-hot-toast";

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
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(true);
  const [difficulty, setDifficulty] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isRecordingOpen,
    onOpen: onRecordingOpen,
    onOpenChange: onRecordingOpenChange,
  } = useDisclosure();
  const {
    isOpen: isImageViewOpen,
    onOpen: onImageViewOpen,
    onOpenChange: onImageViewOpenChange,
  } = useDisclosure();
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
      setVideoURL(data[0].video);
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
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Add a slight delay to get the skeleton effect
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
    const toastId = toast.loading("Saving flashcards...");
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
      toast.success("Flashcards updated successfully", { id: toastId });
      const currentPath = router.asPath;
      const newPath = currentPath.replace("/edit", "");
      router.push(newPath);
    } catch (error) {
      console.error("Error updating flashcards:", error);
      toast.error("Error updating flashcards", { id: toastId });
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
    if (flashcardData.length <= 2) {
      alert("You cannot delete the last remaining sequence.");
      return;
    }

    const userConfirmed = confirm(
      "Are you sure you want to delete this card? This will be deleted permanently"
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

  // const handleAddVideo = (e) => {
  //   let embeddableVideoURL;
  //   let videoInput;

  //   // Check if the input is a file upload or URL
  //   if (e.target && e.target.files) {
  //     // Handle file upload
  //     const file = e.target.files[0];
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onloadend = () => {
  //         setVideo(reader.result);
  //       };
  //       reader.readAsDataURL(file);
  //       return;
  //     }
  //   } else {
  //     // Handle URL input
  //     videoInput = videoURL;
  //   }

  //   if (!videoInput) {
  //     console.error("No video input provided");
  //     return;
  //   }

  //   if (videoInput.includes("youtu.be")) {
  //     // Handle short YouTube URL
  //     const videoId = videoInput.split("/")[3].split("?")[0];
  //     const queryParams = videoInput.split("?")[1]
  //       ? `?${videoInput.split("?")[1]}`
  //       : "";
  //     embeddableVideoURL = `https://www.youtube.com/embed/${videoId}${queryParams}`;
  //   } else if (videoInput.includes("youtube.com/watch")) {
  //     // Handle standard YouTube URL
  //     const videoId = videoInput.split("v=")[1].split("&")[0];
  //     const queryParams = videoInput.split("&").slice(1).join("&")
  //       ? `?${videoInput.split("&").slice(1).join("&")}`
  //       : "";
  //     embeddableVideoURL = `https://www.youtube.com/embed/${videoId}${queryParams}`;
  //   } else {
  //     embeddableVideoURL = videoInput;
  //   }

  //   console.log("embeddableVideoURL:", embeddableVideoURL);
  //   setVideo(embeddableVideoURL);
  // };

  const handleAddVideo = (event) => {
    // Handle YouTube URL
    if (videoURL) {
      let embeddableVideoURL;

      if (videoURL.includes("youtu.be")) {
        // Handle short YouTube URL (e.g., https://youtu.be/<video-id>)
        const videoId = videoURL.split("/")[3].split("?")[0];
        const queryParams = videoURL.split("?")[1]
          ? `?${videoURL.split("?")[1]}`
          : "";
        embeddableVideoURL = `https://www.youtube.com/embed/${videoId}${queryParams}`;
      } else if (videoURL.includes("youtube.com/watch")) {
        // Handle standard YouTube URL (e.g., https://www.youtube.com/watch?v=<video-id>)
        const videoId = videoURL.split("v=")[1].split("&")[0];
        const queryParams = videoURL.split("&").slice(1).join("&")
          ? `?${videoURL.split("&").slice(1).join("&")}`
          : "";
        embeddableVideoURL = `https://www.youtube.com/embed/${videoId}${queryParams}`;
      }

      console.log("embeddableVideoURL:", embeddableVideoURL);
      setVideo(embeddableVideoURL);
    }

    // Handle file upload
    if (event?.target?.files) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result;
        setVideo(base64String);
        console.log("base64String:", base64String);
      };

      if (file) {
        reader.readAsDataURL(file);
      }
    }
  };

  const handleVideoChange = (e) => {
    const newVideo = e.target.value;
    setVideoURL(newVideo);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      {isLoading ? (
        Array.from({ length: flashcardData.length }).map((_, index) => (
          <Skeleton key={index} className="w-full h-[300px] rounded-md" />
        ))
      ) : (
        <>
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <div className="flex gap-4 items-center">
              <h1>Edit Sequence Game Page</h1>
              <h1>{flashcardData.length}</h1>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <Chip
                    endContent={<Info size={20} />}
                    variant="flat"
                    color={
                      flashcardData.length < 5
                        ? "success"
                        : flashcardData.length >= 10
                        ? "danger"
                        : "warning"
                    }
                    className="cursor-pointer"
                  >
                    <span>
                      {flashcardData.length < 5
                        ? "Easy"
                        : flashcardData.length >= 10
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
            <div>
              {isSaving ? (
                <Button isLoading isDisabled color="secondary" radius="sm">
                  Save Changes
                </Button>
              ) : (
                <Button radius="sm" color="secondary" onClick={handleSave}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>

          {flashcardData && flashcardData.length > 0 && (
            <>
              <div className="flex gap-4">
                <Input
                  size="lg"
                  radius="sm"
                  variant="bordered"
                  color="secondary"
                  value={title}
                  placeholder="Game Title"
                  onChange={(e) => setTitle(e.target.value)}
                  classNames={{
                    label: "text-white",
                    inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                  }}
                />
              </div>
              <div className="flex gap-2">
                {/* <Input
                  value={videoURL}
                  placeholder="Enter YouTube URL"
                  onChange={handleVideoChange}
                  variant="bordered"
                  color="secondary"
                  radius="sm"
                  size="lg"
                  isRequired
                  classNames={{
                    label: "text-white",
                    inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                  }}
                /> */}

                <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
                  <ModalContent>
                    {(onClose) => (
                      <>
                        <ModalHeader className="flex flex-col gap-1">
                          Add Video
                        </ModalHeader>
                        <ModalBody>
                          <Tabs aria-label="Video Options" fullWidth>
                            <Tab key="url" title="From URL">
                              <div className="flex gap-2 mt-4">
                                <Input
                                  variant="bordered"
                                  color="secondary"
                                  isClearable
                                  radius="sm"
                                  size="lg"
                                  isRequired
                                  onClear={() => setVideoURL("")}
                                  placeholder="Enter YouTube URL"
                                  classNames={{
                                    label: "text-white",
                                    inputWrapper:
                                      "bg-[#ffffff] border-1 border-[#7469B6]",
                                  }}
                                  value={videoURL}
                                  onChange={(e) => setVideoURL(e.target.value)}
                                />
                                <Button
                                  isDisabled={!videoURL}
                                  onClick={() => {
                                    handleAddVideo();
                                    onClose();
                                  }}
                                  radius="sm"
                                  size="lg"
                                  color="secondary"
                                >
                                  Add
                                </Button>
                              </div>
                            </Tab>
                            <Tab key="upload" title="Upload">
                              <div className="flex justify-end gap-2 mt-4">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleAddVideo}
                                  className="hidden"
                                  id="videoUpload"
                                />
                                <Button
                                  radius="sm"
                                  size="lg"
                                  color="secondary"
                                  onClick={() =>
                                    document
                                      .getElementById("videoUpload")
                                      .click()
                                  }
                                >
                                  <div className="flex gap-2 items-center">
                                    <Upload size={20} />
                                    Upload Video
                                  </div>
                                </Button>
                              </div>
                            </Tab>
                          </Tabs>
                        </ModalBody>
                      </>
                    )}
                  </ModalContent>
                </Modal>
              </div>

              <div className="relative border-2 border-dashed border-purple-700 bg-gray-100 rounded-md ">
                {video ? (
                  video.includes("youtube") ? (
                    <>
                      {" "}
                      <iframe
                        src={video}
                        frameBorder="0"
                        width="100%"
                        height={400}
                        allowFullScreen
                        title="Sequence Game Video"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        className="absolute top-2 right-2"
                        // onClick={() => setVideoURL(null)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <video src={video} width="100%" height={400} controls />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        className="absolute top-2 right-2"
                        // onClick={() => setVideo(null)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </>
                  )
                ) : (
                  <div className="text-center p-4 text-purple-700 h-[400px] flex items-center justify-center">
                    {/* No uploaded video */}
                    {!video ? (
                      <Button
                        radius="sm"
                        size="lg"
                        color="secondary"
                        onClick={onOpen}
                      >
                        <div className="flex gap-2 items-center">
                          <Video size={20} />
                          Add Video
                        </div>
                      </Button>
                    ) : (
                      <Button
                        radius="sm"
                        size="lg"
                        color="danger"
                        onClick={() => {
                          setVideoURL("");
                          setVideo("");
                        }}
                      >
                        <div className="flex gap-2 items-center">
                          <VideoOff size={20} />
                          Clear
                        </div>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <h1 className="bg-red-400 text-white font-semibold px-4 py-4 rounded-md ">
                NOTE: Make sure each image is unique
              </h1>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {flashcardData.map((flashcard, index) => (
              <div key={flashcard.flashcard_id} className="w-full">
                <Card className="w-full border  border-[#7469B6] rounded-md flex p-4">
                  <CardHeader className="flex px-3 justify-between items-center z-0">
                    <div className="pl-2 text-xl font-bold">
                      <h1>{index + 1}</h1>
                    </div>
                    <div className="flex">
                      <Button
                        radius="sm"
                        isIconOnly
                        color="danger"
                        onPress={() => removeFlashcard(index)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </CardHeader>

                  <div className="flex gap-2">
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
                              <Tabs aria-label="Options" fullWidth>
                                <Tab key="drag" title="Drag & Drop">
                                  <div
                                    className=" rounded-lg border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer"
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
                                      value={flashcard.imageUrl}
                                      onChange={(e) => {
                                        handleInputChange(
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
                              {/* <div
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
                              </div> */}
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
                                variant="flat"
                                radius="sm"
                              >
                                Cancel
                              </Button>
                              <Button
                                radius="sm"
                                color="secondary"
                                onClick={confirmImage}
                                isDisabled={!tempImage}
                              >
                                Insert
                              </Button>
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                    {/* <Button
                      radius="sm"
                      isIconOnly
                      color="danger"
                      onPress={() => removeFlashcard(index)}
                    >
                      <Trash2 size={22} />
                    </Button> */}
                  </div>
                  <CardBody className="flex flex-col gap-4">
                    <div className="flex w-full gap-4 justify-between">
                      <div className="flex w-full gap-2">
                        <div className="aspect-square rounded-lg m-auto flex shrink-0 items-center justify-center border-dashed bg-gray-100 border-2 border-[#9183e2] w-full max-w-[300px] h-[300px]">
                          {/* <div className="relative flex flex-col gap-2">
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
                          </div> */}

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
                                onPress={() => {
                                  removeImage(index);
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
                                  const newSequence = [...flashcardData];
                                  newSequence[index].isImageViewOpen = true;
                                  setFlashcardData(newSequence);
                                  setCurrentIndex(index);
                                }}
                              >
                                <ScanSearch size={18} />
                              </Button>
                              <Modal
                                isOpen={flashcard.isImageViewOpen}
                                onOpenChange={(isOpen) => {
                                  const newSequence = [...flashcardData];
                                  newSequence[index].isImageViewOpen = isOpen;
                                  setFlashcardData(newSequence);
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
                                            className="w-full h-full object-cover rounded-lg"
                                          />
                                        </div>
                                      </ModalBody>
                                      <ModalFooter>
                                        <Button
                                          radius="sm"
                                          color="danger"
                                          variant="flat"
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
                                setIsImageModalOpen(true);
                                setCurrentIndex(index);
                              }}
                            >
                              <Upload size={20} />
                              Upload Image
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                  <CardFooter className="flex flex-col gap-4 pt-1 items-center justify-between">
                    <div className="w-full">
                      {flashcard.audio ? (
                        <div className="flex gap-3  w-full ">
                          <div className="flex gap-2 w-full justify-between">
                            <Button
                              className="w-full"
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
                              color="danger"
                              radius="sm"
                              onPress={() => {
                                removeAudio(index);
                              }}
                            >
                              <Trash2 size={20} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          radius="sm"
                          color="secondary"
                          className="w-full"
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
                                    radius="sm"
                                    color="secondary"
                                    className="w-full"
                                    onClick={startRecording}
                                  >
                                    <Mic size={20} />
                                    Start Recording
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={stopRecording}
                                    color="danger"
                                    radius="sm"
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
                                    <div className="flex flex-col gap-3 p-3 border rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                          Preview
                                        </span>
                                        <Button
                                          size="sm"
                                          color="danger"
                                          variant="light"
                                          onClick={removeTempAudio}
                                          className="min-w-0"
                                        >
                                          <Trash2 size={18} />
                                        </Button>
                                      </div>

                                      <audio
                                        controls
                                        src={URL.createObjectURL(tempAudioBlob)}
                                      ></audio>
                                    </div>
                                  </>
                                )}
                              </ModalBody>
                              <ModalFooter>
                                <Button
                                  radius="sm"
                                  color="danger"
                                  variant="flat"
                                  onPress={onClose}
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
                    <div className="flex shrink flex-col gap-2 w-full">
                      <Textarea
                        rows={5}
                        radius="sm"
                        type="text"
                        variant="bordered"
                        color="secondary"
                        disableAnimation
                        disableAutosize
                        classNames={{
                          input: "resize-y min-h-[40px]",
                          inputWrapper: "border-1 border-[#7469B6]",
                        }}
                        label={`Describe Step ${index + 1}`}
                        value={flashcard.step}
                        onChange={(e) =>
                          handleInputChange(index, "step", e.target.value)
                        }
                      />
                    </div>
                  </CardFooter>
                </Card>
              </div>
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
        </>
      )}
    </div>
  );
};

export default Index;
