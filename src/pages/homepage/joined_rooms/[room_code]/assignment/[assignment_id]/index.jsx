import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tabs,
  Tab,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import { parseZonedDateTime, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Youtube,
  Upload,
  Trash2,
  ScanSearch,
} from "lucide-react";
import ReactPlayer from "react-player";
import toast, { Toaster } from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const index = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { room_code, assignment_id } = router.query;
  const [assignment, setAssignment] = useState(null);
  const [submittedAssignment, setSubmittedAssignment] = useState({});
  const [media, setMedia] = useState([]);
  const [dueDate, setDueDate] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [showModal, setShowModal] = useState({
    video: false,
    image: false,
  });
  const [isPastDue, setIsPastDue] = useState(false);

  const formatter = useDateFormatter({
    dateStyle: "long",
    timeStyle: "short",
  });

  const [modalImage, setModalImage] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const openImageModal = (url) => {
    setModalImage(url);
    onOpen();
  };

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
      console.log("File uploaded:", {
        type: type,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      });
    }
  };

  const handleAddUrl = (type, url) => {
    if (url) {
      handleAddMedia(type, url, url);
      setYoutubeUrl("");
      setUrlLink("");
      setShowModal({ ...showModal, [type]: false });
      console.log("URL added:", {
        type: type,
        url: url,
      });
    }
  };

  const handleDeleteMedia = (index) => {
    const deletedMedia = mediaList[index];
    const newMediaList = mediaList.filter((_, i) => i !== index);
    setMediaList(newMediaList);
    console.log("Deleted Media:", deletedMedia);
    console.log("Updated Media List:", newMediaList);
  };

  const handleDeleteSubmittedMedia = async (index) => {
    const media = submittedAssignment?.assignmentResult?.media || {};
    const mediaUrls = Object.values(media);
    const deletedMediaURL = mediaUrls[index];

    const newMediaUrls = mediaUrls.filter((_, i) => i !== index);
    const newMedia = newMediaUrls.reduce((acc, url, i) => {
      acc[i] = url;
      return acc;
    }, {});

    setSubmittedAssignment({
      ...submittedAssignment,
      assignmentResult: {
        ...submittedAssignment.assignmentResult,
        media: newMedia,
      },
    });

    return toast.promise(
      (async () => {
        const res = await fetch(
          `/api/assignment/submitAssignment?deletedMediaURL=${deletedMediaURL}&assignment_id=${assignment_id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              deletedMediaURL: deletedMediaURL,
              assignment_id: assignment_id,
            }),
          }
        );
        if (!res.ok) {
          throw new Error("Failed to delete submitted media");
        }
        console.log("Deleted Submitted Media:", deletedMediaURL);
      })(),
      {
        loading: "Deleting media...",
        success: "Media deleted successfully!",
        error: "Failed to delete media",
      }
    );
  };

  const handleSubmit = async () => {
    return toast.promise(
      (async () => {
        const res = await fetch(
          `/api/assignment/submitAssignment?assignment_id=${assignment_id}`,
          {
            method: "POST",
            body: JSON.stringify({
              account_id: session?.user?.id,
              mediaList: mediaList,
              account_id: session?.user?.id,
              assignment_id: assignment_id,
            }),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          if (res.status === 400) {
            // Handle case where student already submitted
            throw data.error;
          }
          throw "Failed to submit assignment";
        }

        await getSubmittedAssignment();
        return res;
      })(),
      {
        loading: "Submitting assignment...",
        success: "Assignment submitted successfully!",
        error: (err) => err, // Display the actual error message
      }
    );
  };

  const getSubmittedAssignment = async () => {
    const res = await fetch(
      `/api/assignment/submitAssignment?assignment_id=${assignment_id}&account_id=${session?.user?.id}  `
    );
    const data = await res.json();
    setSubmittedAssignment(data);
    console.log("Submitted Assignment:", data);
  };

  useEffect(() => {
    const getAssignment = async () => {
      if (!assignment_id) return;
      const res = await fetch(
        `/api/assignment/indivAssignment?assignment_id=${assignment_id}`
      );
      const data = await res.json();
      setAssignment(data.assignment);

      setMedia(data.media);
      const parsedDate = parseZonedDateTime(data.assignment.due_date);
      setDueDate(parsedDate);

      // Check if due date has passed
      const now = new Date();
      const dueDateTime = parsedDate.toDate(getLocalTimeZone());
      setIsPastDue(now > dueDateTime);
    };
    getAssignment();
    getSubmittedAssignment();
  }, [assignment_id]);

  if (!assignment) return null;

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Toaster />
      {/* <h1 className="text-3xl font-bold mb-8">
        Assignment id: {assignment_id}
      </h1> */}
      <Card className="w-full mb-2 p-4">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex w-full items-center">
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
          </div>
          <div className="flex w-full items-center text-sm text-left text-gray-500">
            <CalendarDays className="mr-2 h-4 w-4" />
            <p className="text-gray-500">
              Due:{" "}
              {dueDate
                ? formatter.format(dueDate.toDate(getLocalTimeZone()))
                : "No due date"}
            </p>
          </div>
        </CardHeader>
        <Divider className="my-4 mx-3" />
        <CardBody>
          <p className="text-lg mb-8">{assignment.instruction}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {media.map((item) => {
              if (item.url.includes("youtu")) {
                return (
                  <div key={item.assignment_media_id}>
                    <iframe
                      width="100%"
                      height="300px"
                      src={item.url.replace("youtu.be/", "youtube.com/embed/")}
                      title="YouTube video"
                      className="rounded-lg"
                      allowFullScreen
                    />
                  </div>
                );
              } else if (item.url.includes(".mp4")) {
                return (
                  <div className="bg-black h-[300px] rounded-lg flex items-center justify-center">
                    <video
                      key={item.assignment_media_id}
                      controls
                      className="w-full h-[300px] rounded-lg"
                    >
                      <source src={item.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                );
              } else {
                return (
                  <div className="relative bg-black object-contain w-full h-[300px] rounded-lg">
                    <img
                      key={item.assignment_media_id}
                      src={item.url}
                      alt="Assignment media"
                      className="object-contain w-full h-[300px] rounded-lg"
                    />
                    <Button
                      isIconOnly
                      color="secondary"
                      className="absolute bottom-2 right-2"
                      onPress={() => openImageModal(item.url)}
                    >
                      <ScanSearch size={22} />
                    </Button>
                  </div>
                );
              }
            })}
          </div>
        </CardBody>

        {submittedAssignment?.assignmentResult?.media && (
          <div className="w-full p-3 pt-0">
            <Divider className="my-4" />
            <h3 className="w-full text-2xl text-left mb-4">
              Submitted Assignments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(submittedAssignment.assignmentResult.media).map(
                (url, index) => {
                  if (url.includes("youtu")) {
                    return (
                      <div key={index} className="relative">
                        <iframe
                          width="100%"
                          height="300px"
                          src={url.replace("youtu.be/", "youtube.com/embed/")}
                          title="YouTube video"
                          className="rounded-lg"
                          allowFullScreen
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              isIconOnly
                              color="danger"
                              startContent={<Trash2 size={22} />}
                              className="absolute top-2 right-2"
                            />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your submitted media.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteSubmittedMedia(index)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    );
                  } else if (url.includes(".mp4")) {
                    return (
                      <div
                        key={index}
                        className="relative bg-black h-[300px] rounded-lg flex items-center justify-center"
                      >
                        <video controls className="w-full h-[300px] rounded-lg">
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              isIconOnly
                              color="danger"
                              startContent={<Trash2 size={22} />}
                              className="absolute top-2 right-2"
                            />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your submitted media.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteSubmittedMedia(index)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={index}
                        className="relative bg-black object-contain w-full h-[300px] rounded-lg"
                      >
                        <img
                          src={url}
                          alt="Submitted assignment media"
                          className="object-contain w-full h-[300px] rounded-lg"
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              isIconOnly
                              color="danger"
                              startContent={<Trash2 size={22} />}
                              className="absolute top-2 right-2"
                            />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your submitted media.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteSubmittedMedia(index)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          isIconOnly
                          color="secondary"
                          className="absolute bottom-2 right-2"
                          onPress={() => openImageModal(url)}
                        >
                          <ScanSearch size={22} />
                        </Button>
                      </div>
                    );
                  }
                }
              )}
            </div>
          </div>
        )}
      </Card>
      <Card className="w-full mb-8 p-4">
        <CardHeader className="flex flex-col gap-2">
          <h3 className="text-2xl text-left w-full">Submit Assignment</h3>
          <div className="flex w-full flex-col items-center space-x-4">
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
        </CardHeader>
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className=""
          >
            {/* <h3>Uploaded Media:</h3> */}
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
                      {media.content.endsWith(".mp4") ? (
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
            {isPastDue ? (
              <div className="w-full text-center text-sm text-red-500 mt-4">
                Assignment submission is closed as the due date has passed.
              </div>
            ) : submittedAssignment?.assignmentResult?.grade ? (
              <div className="mt-4 flex justify-between">
                <p className="text-sm text-gray-500">
                  Assignment has already been graded
                </p>
                <h1 className="text-lg font-bold">
                  Grade: {submittedAssignment?.assignmentResult?.grade}
                </h1>
              </div>
            ) : (
              <Button
                radius="sm"
                size="lg"
                type="submit"
                color="secondary"
                className="mt-4 w-full"
              >
                Submit
              </Button>
            )}
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
                      Add
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

      {/* Enlarged Image */}
      <Modal size="5xl" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="pb-0">Image</ModalHeader>
              <ModalBody className="p-4">
                {modalImage ? (
                  <div className="bg-black object-contain w-full rounded-lg">
                    <img
                      src={modalImage}
                      alt="Enlarged"
                      className="object-contain w-full max-h-[560px] rounded-lg"
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 h-[560px] text-center">
                    No image to display
                  </p>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default index;
