import React, { useState, useEffect } from "react";
import {
  Input,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tabs,
  Tab,
  DatePicker,
} from "@nextui-org/react";
import { Youtube, Upload, Trash2 } from "lucide-react";
import { now, getLocalTimeZone } from "@internationalized/date";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import ReactPlayer from "react-player";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";

const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;
  const [mediaList, setMediaList] = useState([]);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [showModal, setShowModal] = useState({
    video: false,
    image: false,
  });

  const driverObj = React.useRef(
    driver({
      showProgress: true,
      steps: [
        {
          element: "#assignment-title",
          popover: {
            title: "Assignment Title",
            description: "Enter a title for your assignment",
          },
        },
        {
          element: "#assignment-instruction",
          popover: {
            title: "Instructions",
            description: "Add instructions for your students (optional)",
          },
        },
        {
          element: "#due-date",
          popover: {
            title: "Due Date",
            description: "Set a due date for the assignment",
          },
        },
        {
          element: "#add-video-btn",
          popover: {
            title: "Add Video",
            description: "Click to add a video from YouTube or upload one",
          },
        },
        {
          element: "#add-image-btn",
          popover: {
            title: "Upload Image",
            description: "Click to add an image from URL or upload one",
          },
        },
        {
          element: "#create-assignment-btn",
          popover: {
            title: "Create Assignment",
            description: "Click to create and save your assignment",
          },
        },
      ],
    })
  );

  useEffect(() => {
    const isTutorialShown = !localStorage.getItem("create-assignment-tutorial");
    if (isTutorialShown) {
      setTimeout(() => {
        driverObj.current.drive();
        localStorage.setItem("create-assignment-tutorial", "true");
      }, 1000);
    }
  }, [room_code]);

  const handleAddMedia = (type, content, name = null) => {
    const newMediaList = [...mediaList, { type, content, name }];
    setMediaList(newMediaList);
    console.log("Uploaded Media:", newMediaList);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const base64File = await convertToBase64(file);
      handleAddMedia(type, base64File, file.name || null);
      setShowModal({ ...showModal, [type]: false });
    }
  };

  const handleAddUrl = (type, url) => {
    if (url) {
      handleAddMedia(type, url, url);
      setYoutubeUrl("");
      setUrlLink("");
      setShowModal({ ...showModal, [type]: false });
    }
  };

  const handleDeleteMedia = (index) => {
    const newMediaList = mediaList.filter((_, i) => i !== index);
    setMediaList(newMediaList);
    console.log("Deleted Media:", newMediaList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      title: e.target.elements[0].value,
      room_code: room_code,
      account_id: session?.user?.id,
      instruction: e.target.elements[1].value,
      due_date: e.target.elements[2].value,
      mediaList: mediaList,
    };
    console.log("Form Data:", formData);

    toast.promise(
      (async () => {
        const response = await fetch("/api/assignment/assignment", {
          method: "POST",
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error("Failed to create assignment");
        }
        router.push(
          `/teacher-dashboard/rooms/${room_code}/assignment/${data.assignmentId}`
        );
      })(),
      {
        loading: "Creating assignment...",
        success: "Assignment created successfully!",
        error: "Failed to create assignment",
      }
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Create Assignment</h1>
      </div>

      <Card className="w-full border border-[#7469B6] rounded-md flex p-4">
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <Input
                id="assignment-title"
                label="Title"
                radius="sm"
                variant="bordered"
                color="secondary"
                classNames={{
                  label: "",
                  inputWrapper: "border-1 border-[#7469B6]",
                }}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                id="assignment-instruction"
                label="Instruction (Optional)"
                radius="sm"
                variant="bordered"
                color="secondary"
                classNames={{
                  label: "",
                  inputWrapper: "border-1 border-[#7469B6]",
                }}
              />
              <DatePicker
                id="due-date"
                label="Due Date"
                variant="bordered"
                hideTimeZone
                showMonthAndYearPickers
                defaultValue={now(getLocalTimeZone())}
                radius="sm"
                color="secondary"
                classNames={{
                  inputWrapper: "border border-[#7469B6]",
                }}
              />
            </div>

            <div className="flex flex-col items-center space-x-4 mt-4 ">
              <h3 className="text-left bolder font-bold	 w-full">Attach</h3>
              <div className="flex space-x-3">
                <Button
                  id="add-video-btn"
                  auto
                  isIconOnly
                  size="lg"
                  radius="full"
                  color="secondary"
                  variant="bordered"
                  className="border-1 border-[#7469B6]"
                  startContent={<Youtube />}
                  onClick={() => setShowModal({ ...showModal, video: true })}
                />
                <Button
                  id="add-image-btn"
                  auto
                  isIconOnly
                  size="lg"
                  radius="full"
                  color="secondary"
                  variant="bordered"
                  className="border-1 border-[#7469B6]"
                  startContent={<Upload />}
                  onClick={() => setShowModal({ ...showModal, image: true })}
                />
              </div>
            </div>

            <div className="mt-8">
              <ul className="flex flex-col gap-2">
                {mediaList.map((media, index) => (
                  <li
                    key={index}
                    className="flex items-center relative border-1 border-gray-300 rounded-md pl-2"
                  >
                    {media.type === "video" || media.name?.includes("mp4") ? (
                      <div className="flex gap-4 items-center">
                        <ReactPlayer
                          url={media.content}
                          controls
                          width="200px"
                          height="100px"
                        />
                        <div className="capitalize text-[#6B7280]">
                          {media.type}
                        </div>
                      </div>
                    ) : media.type === "link" ? (
                      <div className="flex gap-4 items-center">
                        <a
                          href={media.content}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {media.content}
                        </a>
                        <div className="capitalize text-[#6B7280]">
                          {media.type}
                        </div>
                      </div>
                    ) : media.type === "image" ? (
                      <div className="flex gap-4 items-center">
                        {media.content?.endsWith(".mp4") ? (
                          <video
                            src={media.content}
                            controls
                            width="200px"
                            height="100px"
                          />
                        ) : (
                          <div>
                            <div className="bg-black object-contain w-[200px] h-[100px]">
                              <img
                                src={media.content}
                                alt={media.name}
                                className="object-contain w-[200px] h-[100px]"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <p>{media.name}</p>
                          <div className="capitalize text-[#6B7280]">
                            {media.type}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      startContent={<Trash2 />}
                      onClick={() => handleDeleteMedia(index)}
                      className="absolute right-4"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <Button
              id="create-assignment-btn"
              radius="sm"
              size="lg"
              type="submit"
              color="secondary"
              className="mt-4 w-full"
              isDisabled={!title}
            >
              Create Assignment
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Video Modal */}
      {showModal.video && (
        <Modal
          isOpen
          size="lg"
          onClose={() => setShowModal({ ...showModal, video: false })}
        >
          <ModalContent>
            <ModalHeader>Attach Video</ModalHeader>
            <ModalBody>
              <Tabs fullWidth>
                <Tab title="From URL">
                  <div className="flex gap-2 mt-4">
                    <Input
                      variant="bordered"
                      color="secondary"
                      isClearable
                      radius="sm"
                      size="lg"
                      placeholder="Enter YouTube URL"
                      classNames={{
                        label: "text-white",
                        inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                      }}
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                    <Button
                      onClick={() => handleAddUrl("video", youtubeUrl)}
                      radius="sm"
                      size="lg"
                      color="secondary"
                    >
                      Add
                    </Button>
                  </div>
                </Tab>
                <Tab title="Upload">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                    className="block w-full text-sm text-slate-500 mt-4 
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-md file:border-0
                    file:text-base 
                    file:bg-[#7828C8] file:text-white
                    hover:file:bg-[#9353D3]"
                  />
                </Tab>
              </Tabs>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Image Modal */}
      {showModal.image && (
        <Modal
          isOpen
          size="lg"
          onClose={() => setShowModal({ ...showModal, image: false })}
        >
          <ModalContent>
            <ModalHeader>Attach Image</ModalHeader>
            <ModalBody>
              <Tabs fullWidth>
                <Tab title="From URL">
                  <div className="flex gap-2 mt-4">
                    <Input
                      variant="bordered"
                      color="secondary"
                      isClearable
                      radius="sm"
                      size="lg"
                      placeholder="Enter Image URL"
                      classNames={{
                        label: "text-white",
                        inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                      }}
                      value={urlLink}
                      onChange={(e) => setUrlLink(e.target.value)}
                    />
                    <Button
                      onClick={() => handleAddUrl("image", urlLink)}
                      radius="sm"
                      size="lg"
                      color="secondary"
                    >
                      Add
                    </Button>
                  </div>
                </Tab>
                <Tab title="Upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "image")}
                    className="block w-full text-sm text-slate-500 mt-4 
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-md file:border-0
                    file:text-base 
                    file:bg-[#7828C8] file:text-white
                    hover:file:bg-[#9353D3]"
                  />
                </Tab>
              </Tabs>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default Index;
