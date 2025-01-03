import React, { useState, useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
  Tabs,
  Tab,
  Textarea,
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
  Info,
  Video,
  Upload,
  VideoOff,
} from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import toast, { Toaster } from "react-hot-toast";
// import PreviewSequenceGame from "@/pages/components/PreviewSequenceGame";

const Index = () => {
  const {
    isOpen: isVideoModalOpen,
    onOpen: onVideoOpen,
    onOpenChange: onVideoOpenChange,
  } = useDisclosure();
  const {
    isOpen: isRecordingOpen,
    onOpen: onRecordingOpen,
    onOpenChange: onRecordingOpenChange,
  } = useDisclosure();
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
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
  const [videoURL, setVideoURL] = useState("");
  const [video, setVideo] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [audioBlob, setAudioBlob] = useState(null);
  const [insertedAudio, setInsertedAudio] = useState(null);
  const { room_code } = router.query;
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(60); // 60 seconds = 1 minute
  const [sequence, setSequence] = useState([
    { step: "", image: null, audio: null, imageUrl: "" },
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
    console.log("Sequence:", sequence);
    if (!title || !room_code || !session?.user?.id) {
      console.error("Missing required fields");
      return;
    }
    if (sequence.length < 2) {
      toast.error("You need to add at least 2 sequence");
      return;
    }
    if (sequence.some((flashcard) => !flashcard.step)) {
      toast.error("All card must have a step");
      return;
    }
    if (sequence.some((flashcard) => !flashcard.image)) {
      toast.error("All card must have an image");
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading("Creating flashcard...");
    try {
      const response = await fetch("/api/sequence_game/sequence_game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Set the Content-Type header
        },
        body: JSON.stringify({
          title: title,
          video: video,
          room_code: room_code,
          account_id: session?.user?.id,
          sequence: sequence,
          difficulty: difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Game created successfully:", data);
      router.push(
        `/teacher-dashboard/rooms/${room_code}/sequence_game/${data.gameId}`
      );
      toast.success("Game created successfully", { id: toastId });
    } catch (error) {
      console.error("Error creating game:", error.message);
      toast.error("Error creating game", { id: toastId });
    } finally {
      setIsLoading(false);
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
    const newSequence = [...sequence];
    newSequence[index][field] = value;
    setSequence(newSequence);
  };

  const handleFlashcardAudioChange = (index, audioBlob) => {
    const newSequence = [...sequence];
    newSequence[index].audio = audioBlob;
    setSequence(newSequence);
  };

  const addFlashcard = () => {
    setSequence([
      ...sequence,
      { step: "", image: null, audio: null, imageUrl: "" },
    ]);
    setTempImage(null);
    if (sequence.length >= 10) {
      setDifficulty("hard");
    } else if (sequence.length >= 5) {
      setDifficulty("medium");
    } else {
      setDifficulty("easy");
    }
  };

  const removeFlashcard = (index) => {
    const newSequence = sequence.filter((_, i) => i !== index);
    setSequence(newSequence);
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
    const updatedCards = [...sequence];
    updatedCards[index].image = flashcard.imageUrl;
    setSequence(updatedCards);
  };

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

  // Convert video to base64 and store in localStorage
  const convertVideoToBase64 = (video) => {
    if (!video) return null;

    // If video is already base64, return it
    if (video.startsWith("data:video")) {
      return video;
    }

    // Get video from localStorage if exists
    const storedVideo = localStorage.getItem("uploadedVideo");
    if (storedVideo) {
      return storedVideo;
    }

    return video;
  };

  const [openModalIndices, setOpenModalIndices] = useState({
    cardIndex: null,
    imageIndex: null,
  });

  const handleWheel = (e) => {
    e.preventDefault();
    const newZoom = zoom + (e.deltaY > 0 ? -0.1 : 0.1);
    setZoom(Math.min(Math.max(0.1, newZoom), 3));
  };

  const handleFlashcardImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
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
        const newSequence = [...sequence];
        newSequence[currentIndex].image = base64data;
        setSequence(newSequence);
        setTempImage(null);
        // onOpenChange(false);
      };
    }, "image/jpeg");
  };

  const driverObj = useRef(
    driver({
      showProgress: true,
      steps: [
        {
          element: "#title",
          popover: {
            title: "Set Title",
            description: "Enter a descriptive title for your sequence set",
          },
        },
        {
          element: "#add-video-btn",
          popover: {
            title: "Add Sequence Video",
            description:
              "Add a video to demonstrate the sequence of steps. You can upload a video file or paste a YouTube/Vimeo URL. The video will help students understand the correct order of steps.",
          },
        },
        {
          element: "#remove-card-btn",
          popover: {
            title: "Remove Step",
            description: "Click here to remove this step from the sequence",
          },
        },
        {
          element: "#upload-image-btn",
          popover: {
            title: "Upload Image",
            description: "Add an image to illustrate this step in the sequence",
          },
        },
        {
          element: "#add-audio-btn",
          popover: {
            title: "Add Audio",
            description:
              "Record audio instructions or explanations for this step",
          },
        },
        {
          element: "#sequence-description",
          popover: {
            title: "Step Description",
            description:
              "Write detailed instructions for completing this step in the sequence",
          },
        },
        {
          element: "#add-card-btn",
          popover: {
            title: "Add New Step",
            description: "Click here to add another step to your sequence",
          },
        },
        {
          element: "#create-btn",
          popover: {
            title: "Create Sequence Set",
            description:
              "When you've added all your steps, click here to create your sequence set",
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
    <div className="w-full">
      <Toaster />
      <div className="flex ">
        <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
          {/* <h1>room_code: {room_code}</h1>
          <h1>session: {session?.user?.id}</h1> */}
          <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
            <div className="flex gap-4 items-center">
              <h1 className="">Create a new sequence set</h1>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <Chip
                    endContent={<Info size={20} />}
                    variant="flat"
                    color={
                      sequence.length < 5
                        ? "success"
                        : sequence.length >= 10
                        ? "danger"
                        : "warning"
                    }
                    className="cursor-pointer"
                  >
                    <span>
                      {sequence.length < 5
                        ? "Easy"
                        : sequence.length >= 10
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
            <div className="flex gap-2 items-center">
              {/* <PreviewSequenceGame /> */}
              <div>
                {isLoading ? (
                  <Button isLoading isDisabled color="secondary" radius="sm">
                    Create
                  </Button>
                ) : (
                  <Button
                    id="create-btn"
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
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                id="title"
                size="lg"
                radius="sm"
                placeholder="Enter title"
                classNames={{
                  label: "text-white",
                  inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                }}
                variant="bordered"
                color="secondary"
                isClearable
                onChange={(e) => setTitle(e.target.value)}
              />
              {/* {!video && (
                <Button
                  radius="sm"
                  size="lg"
                  color="secondary"
                  onClick={onVideoOpen}
                >
                  <div className="flex gap-2 items-center">
                    <Video size={20} />
                    Add Video
                  </div>
                </Button>
              )} */}
            </div>
            <div className="flex gap-2"></div>
            <Modal
              isOpen={isVideoModalOpen}
              onOpenChange={onVideoOpenChange}
              size="lg"
            >
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
                                document.getElementById("videoUpload").click()
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
            <div className="relative border-2 border-dashed bg-gray-100 border-purple-700 rounded-md ">
              {videoURL ? (
                <>
                  <iframe
                    src={video}
                    height={400}
                    width="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    className="absolute top-2 right-2"
                    onClick={() => setVideoURL(null)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </>
              ) : video ? (
                <>
                  <video src={video} height={400} width="100%" controls />
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    className="absolute top-2 right-2"
                    onClick={() => setVideo(null)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </>
              ) : (
                <div className="text-center p-4 text-purple-700 h-[400px] flex items-center justify-center">
                  {/* No uploaded video */}
                  {!video ? (
                    <Button
                      id="add-video-btn"
                      radius="sm"
                      size="lg"
                      color="secondary"
                      onClick={onVideoOpen}
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
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sequence.map((flashcard, index) => (
              <Card
                key={index}
                className="w-full border  border-[#7469B6] rounded-md flex p-4"
              >
                <CardHeader className="flex px-3 justify-between items-center z-0">
                  <div className="pl-2 text-xl font-bold">
                    <h1>Step {index + 1}</h1>
                  </div>
                  <div className="flex">
                    <Button
                      id="remove-card-btn"
                      radius="sm"
                      isIconOnly
                      color="danger"
                      onPress={() => removeFlashcard(index)}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                    <Modal
                      isOpen={flashcard.isUploadModalOpen}
                      onOpenChange={(isOpen) => {
                        const newSequence = [...sequence];
                        newSequence[index].isUploadModalOpen = isOpen;
                        setSequence(newSequence);
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
                    <div className="flex w-full gap-2">
                      {/* <Input
                        type="text"
                        variant="underlined"
                        color="secondary"
                        className="text-[#7469B6] z-0"
                        label={`Flashcard Description ${index + 1}`}
                        value={flashcard.description}
                        onChange={(e) =>
                          handleFlashcardChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                      /> */}
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
                              onPress={() => {
                                const newSequence = [...sequence];
                                newSequence[index].isImageViewOpen = true;
                                setSequence(newSequence);
                                setCurrentIndex(index);
                              }}
                            >
                              <ScanSearch size={18} />
                            </Button>
                            <Modal
                              isOpen={flashcard.isImageViewOpen}
                              onOpenChange={(isOpen) => {
                                const newSequence = [...sequence];
                                newSequence[index].isImageViewOpen = isOpen;
                                setSequence(newSequence);
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
                            id="upload-image-btn"
                            radius="sm"
                            color="secondary"
                            className="border-1 "
                            onClick={() => {
                              const newSequence = [...sequence];
                              newSequence[index].isUploadModalOpen = true;
                              setSequence(newSequence);
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
                    {/* <Button
                      color="secondary"
                      className="my-2"
                      onPress={() => {
                        onRecordingOpen();
                        setCurrentIndex(index);
                      }}
                    >
                      <Mic />
                      Record Audio
                    </Button> */}
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
                        id="add-audio-btn"
                        radius="sm"
                        color="secondary"
                        className=" w-full"
                        onPress={() => {
                          onRecordingOpen();
                          setCurrentIndex(index);
                        }}
                      >
                        <Mic size={20} />
                        Record Audio
                      </Button>
                    )}
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
                                  radius="sm"
                                  color="secondary"
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
                                    <p>
                                      {formatTime(60 - recordingTime)}/01:00
                                    </p>
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
                                        <Trash2 size={18} />
                                      </Button>
                                    </div>
                                    <audio
                                      controls
                                      src={URL.createObjectURL(audioBlob)}
                                    ></audio>
                                  </div>
                                </>
                              )}
                            </ModalBody>
                            <ModalFooter>
                              <Button
                                color="danger"
                                radius="sm"
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
                  {/* <div>
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
                  </div> */}
                  <div className="flex w-full gap-2">
                    <Textarea
                      id="sequence-description"
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
                        handleFlashcardChange(index, "step", e.target.value)
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
                </CardFooter>
              </Card>
            ))}
          </div>
          <Button
            id="add-card-btn"
            size="lg"
            radius="sm"
            color="secondary"
            className="my-4 text-sm"
            onClick={addFlashcard}
            startContent={<Plus size={22} />}
          >
            Add Sequence
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
