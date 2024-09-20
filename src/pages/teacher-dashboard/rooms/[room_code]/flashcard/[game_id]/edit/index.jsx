import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  Card,
  CardBody,
  Input,
  Textarea,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Mic, Disc2, Image, Pencil, Trash, Volume2 } from "lucide-react";
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

  const fetchFlashcards = async () => {
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
    try {
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
          console.error(`Error updating flashcard ${flashcard.flashcard_id}`);
        }
      }
      alert("Flashcards updated successfully");
    } catch (error) {
      console.error("Error updating flashcards:", error);
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
      term: "",
      description: "",
      image: null,
      audio: null,
      isNew: true,
    };
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

  return (
    <div>
      <h1>Edit Flashcards Page</h1>
      <div className="flex flex-wrap gap-4">
        {flashcardData.map((flashcard, index) => (
          <div key={flashcard.flashcard_id} className="w-[500px]">
            <Card className="w-full">
              <CardBody className="flex flex-col gap-4">
                <div>
                  <img
                    src={flashcard.image}
                    alt={flashcard.term}
                    className="w-full h-auto"
                  />

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
                                  handleFlashcardImageChange(currentIndex, e)
                                }
                              />
                              <label htmlFor="imageUpload" className="block">
                                Drag or upload your image here
                              </label>
                            </div>
                            {/* <Input
                              type="file"
                              accept="image/*"
                              label="Image"
                              onChange={(e) => handleImageChange(e)}
                            /> */}
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
                            <Button color="danger" onPress={onClose}>
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
                </div>

                <div className="flex gap-2">
                  <Button
                    color="secondary"
                    onPress={() => {
                      setIsImageModalOpen(true);
                      setCurrentIndex(index);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      removeImage(index);
                    }}
                  >
                    <Trash />
                  </Button>
                </div>
                <h1>flashcard ID: {flashcard.flashcard_id}</h1>
                <Input
                  label="Term"
                  value={flashcard.term}
                  onChange={(e) =>
                    handleInputChange(index, "term", e.target.value)
                  }
                />
                {flashcard.term ? (
                  <Button
                    color="secondary"
                    onPress={() => handleTextToSpeech(flashcard.term)}
                  >
                    <Volume2 />
                  </Button>
                ) : null}
                <Textarea
                  label="Description"
                  value={flashcard.description}
                  onChange={(e) =>
                    handleInputChange(index, "description", e.target.value)
                  }
                />
                {flashcard.audio && (
                  <audio src={flashcard.audio} controls className="w-full" />
                )}
                <div className="flex gap-2 items-center">
                  <Button
                    color="secondary"
                    onPress={() => {
                      setIsAudioModalOpen(true);
                      setCurrentIndex(index);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      removeAudio(index);
                    }}
                  >
                    <Trash />
                  </Button>
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
                                  <p>{formatTime(recordingTime)}/01:00</p>
                                </div>
                              </Button>
                            )}
                            {tempAudioBlob && (
                              <>
                                <audio
                                  controls
                                  src={URL.createObjectURL(tempAudioBlob)}
                                ></audio>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={removeTempAudio}
                                    color="danger"
                                  >
                                    Remove Temporary Audio
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
                <Button color="danger" onPress={() => removeFlashcard(index)}>
                  <h1>Remove Flashcard</h1>
                </Button>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
      <Button onClick={addFlashcard} color="primary" className="mb-5">
        Add Flashcard
      </Button>
      <Button onClick={handleSave} color="primary" className="mt-5">
        Save Changes
      </Button>
    </div>
  );
};

export default Index;