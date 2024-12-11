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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  now,
  getLocalTimeZone,
  parseZonedDateTime,
} from "@internationalized/date";
import ReactPlayer from "react-player";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";

const index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { room_code, assignment_id } = router.query;
  const [assignment, setAssignment] = useState(null);
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [showModal, setShowModal] = useState({
    video: false,
    image: false,
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);

  useEffect(() => {
    const getAssignment = async () => {
      if (!assignment_id) return;
      const res = await fetch(
        `/api/assignment/indivAssignment?assignment_id=${assignment_id}`
      );
      const data = await res.json();
      console.log("assignment data", data);
      setAssignment(data.assignment);
      setTitle(data.assignment.title);
      setInstruction(data.assignment.instruction);

      // Transform media data to match expected format
      const transformedMedia = data.media.map((item) => {
        const isVideo =
          item.url.includes("youtu.be") || item.url.endsWith(".mp4");
        const isImage =
          !item.url.endsWith(".mp4") && !item.url.includes("youtu.be");

        return {
          type: isVideo ? "video" : isImage ? "image" : "link",
          content: item.url,
          name: item.url,
          assignment_media_id: item.assignment_media_id,
        };
      });

      setMediaList(transformedMedia);
      const parsedDate = parseZonedDateTime(data.assignment.due_date);
      setDueDate(parsedDate);
    };
    getAssignment();
  }, [assignment_id]);

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
    setMediaToDelete(index);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    const deletedMedia = mediaList[mediaToDelete];
    const newMediaList = mediaList.filter((_, i) => i !== mediaToDelete);
    setMediaList(newMediaList);

    toast.promise(
      (async () => {
        const res = await fetch(
          `/api/assignment/indivAssignment?assignment_id=${deletedMedia.assignment_media_id}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) {
          throw new Error("Failed to delete media");
        }
        console.log("Updated Media List:", newMediaList);
        setShowDeleteAlert(false);
      })(),
      {
        loading: "Deleting media...",
        success: "Media deleted successfully!",
        error: "Failed to delete media",
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      title: title,
      instruction: instruction,
      due_date: dueDate.toString(),
      mediaList: mediaList,
      assignment_id: assignment_id,
    };

    console.log("formData", formData);
    toast.promise(
      (async () => {
        const response = await fetch(
          `/api/assignment/assignment?assignment_id=${assignment_id}`,
          {
            method: "PUT",
            body: JSON.stringify(formData),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to update assignment");
        }
        const currentPath = router.asPath;
        const newPath = currentPath.replace("/edit", "");
        router.push(newPath);
      })(),
      {
        loading: "Updating assignment...",
        success: "Assignment updated successfully!",
        error: "Failed to update assignment",
      }
    );
  };

  if (!assignment) return null;

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      <div className="flex my-5 justify-between items-center text-3xl font-extrabold">
        <h1>Edit Assignment</h1>
      </div>
      <Card className="w-full border border-[#7469B6] rounded-md flex p-4">
        {/* <CardHeader>
          <h1>Edit Assignment</h1>
        </CardHeader> */}
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <Input
                label="Title"
                radius="sm"
                variant="bordered"
                color="secondary"
                classNames={{
                  label: "",
                  inputWrapper: "border-1 border-[#7469B6]",
                }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                label="Instruction (Optional)"
                radius="sm"
                variant="bordered"
                color="secondary"
                classNames={{
                  label: "",
                  inputWrapper: "border-1 border-[#7469B6]",
                }}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <DatePicker
                label="Due Date"
                variant="bordered"
                hideTimeZone
                showMonthAndYearPickers
                value={dueDate}
                onChange={setDueDate}
                radius="sm"
                color="secondary"
                classNames={{
                  inputWrapper: "border border-[#7469B6]",
                }}
              />
            </div>

            <div className="flex flex-col items-center space-x-4 mt-4 ">
              <h3 className="text-left w-full">Attach</h3>
              <div className="flex space-x-3">
                <Button
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
                    {media.type === "video" ||
                    media.content.includes(".mp4") ? (
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
                    ) : (
                      <div className="flex gap-4 items-center">
                        <div className="bg-black object-contain w-[200px] h-[100px]">
                          <img
                            src={media.content}
                            // alt={media.name}
                            className="object-contain w-[200px] h-[100px]"
                          />
                        </div>
                        <div>
                          <p>{media.name}</p>
                          <div className="capitalize text-[#6B7280]">
                            {media.type}
                          </div>
                        </div>
                      </div>
                    )}
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
              radius="sm"
              size="lg"
              type="submit"
              color="secondary"
              className="mt-4 w-full"
            >
              Update Assignment
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                      Confirm
                    </Button>
                  </div>
                </Tab>
                <Tab title="Upload">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                    class="block w-full text-sm text-slate-500 mt-4 
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
                      Confirm
                    </Button>
                  </div>
                </Tab>
                <Tab title="Upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "image")}
                    class="block w-full text-sm text-slate-500 mt-4 
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

export default index;
