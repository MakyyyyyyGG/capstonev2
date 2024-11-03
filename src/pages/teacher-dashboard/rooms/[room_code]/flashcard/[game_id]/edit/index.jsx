import React, { useState, useEffect, useRef } from "react";
import Header from "@/pages/components/Header";
import Sidebar from "@/pages/components/Sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
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
  useDisclosure,
  Spinner,
  Skeleton,
  Tab,
  Tabs,
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
  Upload,
  VolumeX,
} from "lucide-react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Loader from "@/pages/components/Loader";
import { message } from "antd";
import WaveSurfer from "wavesurfer.js";

const Index = () => {
  const router = useRouter();
  const { game_id } = router.query;
  const { data: session } = useSession();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [flashcardData, setFlashcardData] = useState([]);
  const [newFlashcards, setNewFlashcards] = useState([]);
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
  const waveformRef = useRef(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/flashcard/flashcard?game_id=${game_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setFlashcardData(data);
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

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleInputChange = (index, field, value) => {
    const newFlashcards = [...flashcardData];
    newFlashcards[index][field] = value;
    setFlashcardData(newFlashcards);
    setHasUnsavedChanges(true);
  };

  const setupNewFlashcards = async (flashcardData) => {
    const newFlashcards = flashcardData.filter((f) => f.isNew === true);
    console.log("ins etup fucntion newFlashcards", newFlashcards);
    if (newFlashcards.length > 0) {
      for (const flashcard of newFlashcards) {
        flashcard.flashcard_set_id = flashcardData[0].flashcard_set_id;
        flashcard.term;
        flashcard.description;
        flashcard.image || null;
        flashcard.audio || null;

        try {
          const response = await fetch(
            "/api/flashcard/update_flashcard/update_flashcard",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ flashcards: [flashcard] }), // Wrap in an array
            }
          );
          if (response.ok) {
            console.log("Flashcard created successfully");
            const data = await response.json();
            console.log("Flashcard data:", data);
          } else {
            console.error("Error creating flashcard");
          }
        } catch (error) {
          console.error("Error creating flashcard:", error);
        }
      }
      console.log("newFlashcards", newFlashcards);
    }
    return newFlashcards;
  };

  const handleSave = async () => {
    setIsSaving(true);
    toast
      .promise(
        (async () => {
          await setupNewFlashcards(flashcardData);
          // Filter out flashcards with 'isNew' as true, so they are not updated via PUT request
          const flashcardsToUpdate = flashcardData.filter((f) => !f.isNew);

          for (const flashcard of flashcardsToUpdate) {
            const response = await fetch(
              `/api/flashcard/flashcard?flashcard_id=${flashcard.flashcard_id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ flashcards: flashcard }),
              }
            );

            if (response.ok) {
              console.log(
                `Flashcard ${flashcard.flashcard_id} updated successfully`
              );
            } else {
              console.error(
                `Error updating flashcard ${flashcard.flashcard_id}`
              );
              throw new Error(
                `Error updating flashcard ${flashcard.flashcard_id}`
              );
            }
          }
          setHasUnsavedChanges(false);
        })(),
        {
          loading: "Saving flashcards...",
          success: "Flashcards updated successfully",
          error: "Error updating flashcards",
        }
      )
      .finally(() => {
        setIsSaving(false);
      });
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
        setIsUploadModalOpen(false);
        setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
      console.log("removed flashcard id:", flashcardData[index].flashcard_id);
      try {
        const response = await fetch(
          `/api/flashcard/flashcard?flashcard_id=${flashcardData[index].flashcard_id}`,
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
      setHasUnsavedChanges(true);
    } else {
      console.log("Flashcard deletion cancelled");
      return;
    }
  };

  const addFlashcard = () => {
    const newFlashcard = {
      flashcard_id: Date.now(),
      term: "",
      description: "",
      image: null,
      audio: null,
      isNew: true,
    };
    setFlashcardData([...flashcardData, newFlashcard]);
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const notify = (message, type) => {
    toast(message, {
      type: type,
    });
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <>
        <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
          <h1>Edit Flashcards Page</h1>
          <div>
            {isSaving ? (
              <Button
                isDisabled
                isLoading
                radius="sm"
                onClick={handleSave}
                className="mt-5 bg-[#7469B6] text-white border-0"
              >
                Save Changes
              </Button>
            ) : (
              <Button radius="sm" color="secondary" onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: flashcardData.length }).map((_, index) => (
                <Skeleton key={index} className="w-full h-[300px] rounded-md" />
              ))
            : flashcardData.map((flashcard, index) => (
                <div key={flashcard.flashcard_id} className="w-full">
                  <Card className="w-full  rounded-md flex m-auto p-2  border-1 border-[#7469B6]">
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
                    <Divider className="m-0 h-0.5 bg-slate-300" />
                    <CardBody className="flex flex-col gap-4">
                      <div className="flex items-center justify-end gap-2">
                        <Modal
                          isOpen={isUploadModalOpen && currentIndex === index}
                          onOpenChange={(isOpen) => {
                            setIsUploadModalOpen(isOpen);
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
                                            const file =
                                              e.dataTransfer.files[0];
                                            if (file) {
                                              handleFlashcardImageChange(
                                                index,
                                                {
                                                  target: { files: [file] },
                                                }
                                              );
                                            }
                                          }}
                                        >
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id={`imageUpload-${index}`}
                                            onChange={(e) =>
                                              handleFlashcardImageChange(
                                                index,
                                                e
                                              )
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
                      <div className="flex flex-col w-full gap-4 justify-between max-sm:items-center max-sm:flex-col">
                        <div className="rounded-lg m-auto flex shrink-0 items-center justify-center border-dashed bg-gray-100 border-2 border-[#9183e2] w-full h-[300px] max-sm:w-[70px] max-sm:h-[70px]">
                          {flashcard.image ? (
                            <div className="relative flex flex-col gap-2 w-full h-full">
                              <div className=" w-full h-full ">
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
                                  removeImage(index);
                                }}
                                color="danger"
                                className="absolute top-2 right-2 max-sm:top-0 max-sm:right-0"
                              >
                                <Trash2 size={18} />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                color="secondary"
                                className="absolute bottom-2 right-2 max-sm:bottom-0 max-sm:right-0"
                                aria-label="View Image"
                                onClick={() => {
                                  setIsImageViewOpen(true);
                                  setCurrentIndex(index);
                                }}
                              >
                                <ScanSearch size={18} />
                              </Button>
                              <Modal
                                isOpen={
                                  isImageViewOpen && currentIndex === index
                                }
                                onOpenChange={(isOpen) => {
                                  setIsImageViewOpen(isOpen);
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
                                setIsUploadModalOpen(true);
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
                                  onPress={() => {
                                    removeAudio(index);
                                  }}
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
                              onPress={() => {
                                setIsAudioModalOpen(true);
                                setCurrentIndex(index);
                              }}
                            >
                              <Mic size={20} />
                              Record Audio
                            </Button>
                          )}
                        </div>
                        <div className="flex shrink flex-col gap-2 max-sm:w-full">
                          <Input
                            label={`Term`}
                            isClearable
                            onClear={() => handleInputChange(index, "term", "")}
                            type="text"
                            radius="sm"
                            variant="bordered"
                            classNames={{
                              label: "",
                              inputWrapper: "border-1 border-[#7469B6]",
                            }}
                            color="secondary"
                            value={flashcard.term}
                            onChange={(e) =>
                              handleInputChange(index, "term", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex w-full gap-2 max-sm:w-full">
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
                              handleInputChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <Modal
                        isOpen={isAudioModalOpen && currentIndex === index}
                        onOpenChange={() => {
                          setIsAudioModalOpen(false);
                          setTempAudioBlob(null);
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
                                <div className="flex flex-col gap-4">
                                  {!isRecording ? (
                                    <Button
                                      radius="sm"
                                      color="secondary"
                                      onClick={startRecording}
                                      className="flex items-center gap-2"
                                    >
                                      <Mic size={20} />
                                      Start Recording
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={stopRecording}
                                      color="danger"
                                      className="flex items-center justify-center gap-2"
                                    >
                                      <Disc2
                                        size={20}
                                        className="animate-spin"
                                      />
                                      <span>
                                        {formatTime(recordingTime)}/01:00
                                      </span>
                                    </Button>
                                  )}

                                  {tempAudioBlob && (
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
                                          <VolumeX size={18} />
                                        </Button>
                                      </div>
                                      <audio
                                        controls
                                        className="w-full"
                                        src={URL.createObjectURL(tempAudioBlob)}
                                      />
                                    </div>
                                  )}
                                </div>
                              </ModalBody>
                              <ModalFooter>
                                <Button
                                  radius="sm"
                                  color="danger"
                                  variant="light"
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
                                  }}
                                  isDisabled={!tempAudioBlob}
                                >
                                  Insert Audio
                                </Button>
                              </ModalFooter>
                            </>
                          )}
                        </ModalContent>
                      </Modal>
                    </CardBody>

                    {/* <CardFooter className="flex px-3 gap-2 items-center justify-between">
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
                      </div>
                    </CardFooter> */}
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
    </div>
  );
};

export default Index;
