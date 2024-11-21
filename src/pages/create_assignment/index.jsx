import React, { useState } from "react";
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
import { Youtube, Upload, Trash } from "lucide-react";
import { now, getLocalTimeZone } from "@internationalized/date";

import ReactPlayer from "react-player";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code } = router.query;
  const [mediaList, setMediaList] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [showModal, setShowModal] = useState({
    video: false,
    image: false,
  });

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
        if (!response.ok) {
          throw new Error("Failed to create assignment");
        }
        router.push(`/assignment/${room_code}`);
      })(),
      {
        loading: "Creating assignment...",
        success: "Assignment created successfully!",
        error: "Failed to create assignment",
      }
    );
  };

  return (
    <div className="min-w-[80rem]">
      <Toaster />
      <h1>Create Assignment</h1>
      <Card>
        <CardHeader>
          <h1>Create Assignment</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <Input label="Title" />
            <Textarea label="Instruction (Optional)" />
            <DatePicker
              label="Due Date"
              variant="bordered"
              hideTimeZone
              showMonthAndYearPickers
              defaultValue={now(getLocalTimeZone())}
            />
            <div className="flex items-center space-x-4">
              <h3>Attach</h3>
              <Button
                auto
                isIconOnly
                startContent={<Youtube />}
                onClick={() => setShowModal({ ...showModal, video: true })}
              />
              <Button
                auto
                isIconOnly
                startContent={<Upload />}
                onClick={() => setShowModal({ ...showModal, image: true })}
              />
            </div>

            <div className="mt-4">
              <h3>Uploaded Media:</h3>
              <ul>
                {mediaList.map((media, index) => (
                  <li key={index}>
                    {media.type === "video" || media.name.includes("mp4") ? (
                      <ReactPlayer url={media.content} controls width="200px" />
                    ) : media.type === "link" ? (
                      <a
                        href={media.content}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {media.content}
                      </a>
                    ) : media.type === "image" ? (
                      <div>
                        <p>{media.name}</p>
                        {media.content.endsWith(".mp4") ? (
                          <video src={media.content} controls width="200px" />
                        ) : (
                          <img
                            src={media.content}
                            alt={media.name}
                            width="200px"
                          />
                        )}
                      </div>
                    ) : null}
                    <Button
                      isIconOnly
                      startContent={<Trash />}
                      onClick={() => handleDeleteMedia(index)}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <Button type="submit">Create</Button>
          </form>
        </CardBody>
      </Card>

      {/* Video Modal */}
      {showModal.video && (
        <Modal
          isOpen
          onClose={() => setShowModal({ ...showModal, video: false })}
        >
          <ModalContent>
            <ModalHeader>Attach Video</ModalHeader>
            <ModalBody>
              <Tabs>
                <Tab title="Upload">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                  />
                </Tab>
                <Tab title="URL">
                  <Input
                    label="Video URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <Button onClick={() => handleAddUrl("video", youtubeUrl)}>
                    Confirm
                  </Button>
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
          onClose={() => setShowModal({ ...showModal, image: false })}
        >
          <ModalContent>
            <ModalHeader>Attach Image</ModalHeader>
            <ModalBody>
              <Tabs>
                <Tab title="Upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "image")}
                  />
                </Tab>
                <Tab title="URL">
                  <Input
                    label="Image URL"
                    value={urlLink}
                    onChange={(e) => setUrlLink(e.target.value)}
                  />
                  <Button onClick={() => handleAddUrl("image", urlLink)}>
                    Confirm
                  </Button>
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
