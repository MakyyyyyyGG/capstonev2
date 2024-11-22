import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
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
  Input,
} from "@nextui-org/react";
import { parseZonedDateTime, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Pencil, Youtube, Upload, Trash } from "lucide-react";
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
    <div className="p-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8">
        Assignment id: {assignment_id}
      </h1>
      <Card className="w-full mb-8">
        <CardHeader className="flex flex-col items-start">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <p className="text-gray-500">
            Due:{" "}
            {dueDate
              ? formatter.format(dueDate.toDate(getLocalTimeZone()))
              : "No due date"}
          </p>
        </CardHeader>
        <CardBody>
          <p className="text-lg mb-8">{assignment.instruction}</p>

          <div className="flex items-center space-x-4 mb-4">
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mt-4 mb-8"
          >
            <h3>Uploaded Media:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediaList.map((media, index) => (
                <li key={index} className="relative">
                  {media.type === "video" || media.name?.includes("mp4") ? (
                    <ReactPlayer url={media.content} controls width="100%" />
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
                        <video src={media.content} controls width="100%" />
                      ) : (
                        <img
                          src={media.content}
                          alt={media.name}
                          className="w-full h-auto rounded-lg"
                        />
                      )}
                    </div>
                  ) : null}
                  <Button
                    isIconOnly
                    startContent={<Trash />}
                    onClick={() => handleDeleteMedia(index)}
                    className="absolute top-2 right-2"
                  />
                </li>
              ))}
            </ul>
            {isPastDue ? (
              <div className="text-red-500 mt-4">
                Assignment submission is closed as the due date has passed.
              </div>
            ) : submittedAssignment?.assignmentResult?.grade ? (
              <div className="text-gray-500 mt-4">
                Assignment has already been graded
                <h1 className="text-xl font-bold mb-4">
                  Grade: {submittedAssignment?.assignmentResult?.grade}
                </h1>
              </div>
            ) : (
              <Button type="submit">Submit</Button>
            )}
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {media.map((item) => {
              if (item.url.includes("youtu")) {
                return (
                  <div key={item.assignment_media_id} className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={item.url.replace("youtu.be/", "youtube.com/embed/")}
                      title="YouTube video"
                      allowFullScreen
                    />
                  </div>
                );
              } else if (item.url.includes(".mp4")) {
                return (
                  <video
                    key={item.assignment_media_id}
                    controls
                    className="w-full"
                  >
                    <source src={item.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                );
              } else {
                return (
                  <img
                    key={item.assignment_media_id}
                    src={item.url}
                    alt="Assignment media"
                    className="w-full h-auto rounded-lg"
                  />
                );
              }
            })}
          </div>

          {submittedAssignment?.assignmentResult?.media && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Submitted Assignment:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(submittedAssignment.assignmentResult.media).map(
                  (url, index) => {
                    if (url.includes("youtu")) {
                      return (
                        <div key={index} className="relative aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={url.replace("youtu.be/", "youtube.com/embed/")}
                            title="YouTube video"
                            allowFullScreen
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                isIconOnly
                                startContent={<Trash />}
                                className="absolute top-2 right-2"
                              />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
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
                        <div key={index} className="relative">
                          <video controls className="w-full">
                            <source src={url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                isIconOnly
                                startContent={<Trash />}
                                className="absolute top-2 right-2"
                              />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
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
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt="Submitted assignment media"
                            className="w-full h-auto rounded-lg"
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                isIconOnly
                                startContent={<Trash />}
                                className="absolute top-2 right-2"
                              />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
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
                    }
                  }
                )}
              </div>
            </div>
          )}
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

export default index;
