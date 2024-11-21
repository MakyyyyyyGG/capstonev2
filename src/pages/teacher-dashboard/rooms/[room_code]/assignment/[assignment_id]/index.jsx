import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Tabs,
  Tab,
} from "@nextui-org/react";
import { parseZonedDateTime, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import Link from "next/link";
import { Pencil } from "lucide-react";
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
    <div className="p-8">
      <Tabs aria-label="Assignment tabs">
        <Tab key="details" title="Assignment Details">
          <Card className="w-full mb-8">
            <CardHeader className="flex flex-col items-start">
              <Link
                href={{
                  pathname: `/teacher-dashboard/rooms/${room_code}/assignment/${assignment_id}/edit`,
                }}
              >
                <Button radius="sm" color="secondary">
                  <Pencil size={20} /> Edit
                </Button>
              </Link>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {media.map((item) => {
                  if (item.url.includes("youtu")) {
                    return (
                      <div
                        key={item.assignment_media_id}
                        className="aspect-video"
                      >
                        <iframe
                          width="100%"
                          height="100%"
                          src={item.url.replace(
                            "youtu.be/",
                            "youtube.com/embed/"
                          )}
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
            </CardBody>
          </Card>
        </Tab>
        <Tab key="submissions" title="Student Submissions">
          <StudentSubmissions submittedStudents={submittedStudents} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default index;
