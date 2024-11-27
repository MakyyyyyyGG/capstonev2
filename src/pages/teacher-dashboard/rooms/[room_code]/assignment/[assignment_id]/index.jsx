import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Button,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import { parseZonedDateTime, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import Link from "next/link";
import { Pencil, CalendarDays, ScanSearch } from "lucide-react";
import StudentSubmissions from "@/pages/components/StudentSubmissions";

const index = () => {
  const router = useRouter();
  const { room_code, assignment_id } = router.query;
  const [assignment, setAssignment] = useState(null);
  const [media, setMedia] = useState([]);
  const [dueDate, setDueDate] = useState(null);

  const formatter = useDateFormatter({
    dateStyle: "long",
    timeStyle: "short",
  });

  //get students that submitted assignment
  const [submittedStudents, setSubmittedStudents] = useState([]);

  const [modalImage, setModalImage] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const openImageModal = (url) => {
    setModalImage(url);
    onOpen();
  };

  const getStudentSubmissions = async () => {
    const res = await fetch(
      `/api/assignment/submittedAssignments?assignment_id=${assignment_id}`
    );
    const data = await res.json();
    setSubmittedStudents(data);
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
    };
    getAssignment();
    getStudentSubmissions();
  }, [assignment_id]);

  if (!assignment) return null;

  return (
    <div className="w-full flex flex-col gap-4 p-4 max-w-[80rem] mx-auto">
      <Tabs
        aria-label="Assignment tabs"
        fullWidth
        color="secondary"
        radius="sm"
        size="lg"
        classNames={{
          tabList: "mt-4  border-gray-300 border bg-white rounded-lg",
        }}
      >
        <Tab key="details" title="Assignment Details">
          <Card className="w-full mb-8 p-4">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex w-full items-center justify-between">
                <h1 className="text-3xl font-bold">{assignment.title}</h1>{" "}
                <Link
                  href={{
                    pathname: `/teacher-dashboard/rooms/${room_code}/assignment/${assignment_id}/edit`,
                  }}
                >
                  <Button radius="sm" color="secondary">
                    <Pencil size={20} /> Edit
                  </Button>
                </Link>
              </div>

              <div className="flex w-full items-center text-sm text-left text-gray-500">
                <CalendarDays className="mr-2 h-4 w-4" />
                <p>
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
                          src={item.url.replace(
                            "youtu.be/",
                            "youtube.com/embed/"
                          )}
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
                          size="sm"
                          color="secondary"
                          className="absolute top-2 right-2"
                          onPress={() => openImageModal(item.url)}
                        >
                          <ScanSearch size={18} />
                        </Button>
                      </div>
                    );
                  }
                })}
              </div>
            </CardBody>
          </Card>
        </Tab>
        <Tab key="submissions" title="Student Submissions">
          <StudentSubmissions submittedStudents={submittedStudents} />
        </Tab>
      </Tabs>

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
                  <p className="text-gray-500 text-center">
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
