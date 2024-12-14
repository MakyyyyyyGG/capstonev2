import React, { useState, useEffect } from "react";
import {
  Chip,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Divider,
} from "@nextui-org/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Trash2, NotebookPen, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
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
import { parseZonedDateTime, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";

const AssignmentList = ({ assignments, onDelete }) => {
  // Removed setPendingCount from props
  const { data: session } = useSession();
  const [roleRedirect, setRoleRedirect] = useState("");
  const [alertStates, setAlertStates] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dueDates, setDueDates] = useState({});
  const [isPastDue, setIsPastDue] = useState({});
  const [submittedAssignments, setSubmittedAssignments] = useState({});
  const [pendingCount, setPendingCount] = useState(0); // Added local state for pending count

  const formatter = useDateFormatter({
    dateStyle: "long",
    timeStyle: "short",
  });

  const assignmentArray = Array.isArray(assignments) ? assignments : [];

  const filteredAssignments = assignmentArray.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.instruction.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    getSubmittedAssignments();
    const newDueDates = {};
    const newIsPastDue = {};
    let count = 0; // Initialize local pending count

    assignmentArray.forEach((assignment) => {
      if (assignment.due_date) {
        const parsedDate = parseZonedDateTime(assignment.due_date);
        newDueDates[assignment.assignment_id] = parsedDate;

        const now = new Date();
        const dueDateTime = parsedDate.toDate(getLocalTimeZone());
        newIsPastDue[assignment.assignment_id] = now > dueDateTime;
      }
    });

    setDueDates(newDueDates);
    setIsPastDue(newIsPastDue);
    console.log(`Pending assignments count: ${count}`); // Log the pending assignment count
  }, [assignments]);

  useEffect(() => {
    if (session) {
      if (session.user.role === "teacher") {
        setRoleRedirect("/teacher-dashboard/rooms");
      } else if (session.user.role === "student") {
        setRoleRedirect("/homepage/joined_rooms");
      }
    }
  }, [session]);

  const handleDeleteAssignment = async (assignmentId, e) => {
    e.preventDefault();

    return toast.promise(
      (async () => {
        const res = await fetch(
          `/api/assignment/assignment?assignment_id=${assignmentId}`,
          {
            method: "DELETE",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to delete assignment");
        }

        onDelete();
      })(),
      {
        loading: "Deleting assignment...",
        success: "Assignment deleted successfully!",
        error: "Failed to delete assignment",
      }
    );
  };

  const getSubmittedAssignments = async () => {
    const promises = assignmentArray.map(async (assignment) => {
      const res = await fetch(
        `/api/assignment/submitAssignment?assignment_id=${assignment.assignment_id}&account_id=${session.user.id}`
      );
      if (!res.ok) {
        // Instead of throwing an error, set status to "pending"
        return {
          assignmentId: assignment.assignment_id,
          status: "pending",
        };
      }
      const data = await res.json();

      const hasSubmittedMedia = data.assignmentResult?.media;
      const grade = data.assignmentResult?.grade;

      const status =
        grade && hasSubmittedMedia
          ? "graded"
          : hasSubmittedMedia
          ? "submitted"
          : "pending";

      console.log(
        `Assignment ID: ${assignment.assignment_id}, Status: ${status}`
      );

      // Set pending status for assignments that are pending and not past due
      if (status === "pending" && !isPastDue[assignment.assignment_id]) {
        setPending((prev) => ({
          ...prev,
          [assignment.assignment_id]: true,
        }));
      }

      return {
        assignmentId: assignment.assignment_id,
        status: status,
      };
    });

    try {
      const results = await Promise.all(promises);
      const submittedStatus = results.reduce(
        (acc, { assignmentId, status }) => {
          acc[assignmentId] = status;
          return acc;
        },
        {}
      );

      setSubmittedAssignments(submittedStatus);

      // Log the number of pending assignments
      const pendingCount = results.filter(
        (result) =>
          result.status === "pending" && !isPastDue[result.assignmentId]
      ).length;
      console.log(`Number of pending assignments: ${pendingCount}`);
    } catch (error) {
      console.error("Error fetching submitted assignments:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <div className="w-full z-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mx-2" />
            <Input
              placeholder="Search Assignments"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white h-[50px] border-gray-300"
            />
          </div>
        </div>
      </div>
      <div className="w-full gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.map((assignment) => (
          <Card
            key={assignment.assignment_id}
            isPressable
            radius="sm"
            className="relative shadow-lg min-h-[210px] border-gray-300 border flex flex-col items-center w-full hover:bg-gray-200 hover:border-purple-700"
            shadow="sm"
          >
            <Link
              href={`${roleRedirect}/${assignment.room_code}/assignment/${assignment.assignment_id}`}
              className="w-full flex items-center flex-col justify-between grow"
            >
              <CardHeader className="w-full px-5 pt-5">
                <div className="font-bold text-xl flex justify-start items-center w-full">
                  <div className="flex items-center justify-center w-[60px] h-[60px] rounded-xl">
                    <div className="flex items-center justify-center w-[60px] h-[60px] bg-gradient-to-r from-purple-400 to-purple-600 rounded-full">
                      <NotebookPen className="text-3xl text-white" />
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between text-left ml-4">
                    <div className="font-bold">{assignment.title}</div>
                    {session?.user?.role === "student" && (
                      <div className="text-xs">
                        {submittedAssignments[assignment.assignment_id] ===
                          "submitted" && (
                          <Chip
                            size="sm"
                            className="flex items-center justify-center bg-blue-100 rounded-full pt-[1px] px-2"
                          >
                            <span className="text-xs text-blue-500">
                              Submitted
                            </span>
                          </Chip>
                        )}
                        {submittedAssignments[assignment.assignment_id] ===
                          "graded" && (
                          <Chip
                            size="sm"
                            className="flex items-center justify-center bg-green-100 rounded-full pt-[1px] px-2"
                          >
                            <span className="text-xs text-green-500 ">
                              Graded
                            </span>
                          </Chip>
                        )}
                        {!isPastDue[assignment.assignment_id] &&
                          submittedAssignments[assignment.assignment_id] ===
                            "pending" && (
                            <Chip
                              size="sm"
                              className="flex items-center justify-center bg-yellow-100 rounded-full pt-[1px] px-2"
                            >
                              <span className="text-xs text-yellow-500">
                                Pending
                              </span>
                            </Chip>
                          )}
                        {isPastDue[assignment.assignment_id] &&
                          submittedAssignments[assignment.assignment_id] !==
                            "submitted" &&
                          submittedAssignments[assignment.assignment_id] !==
                            "graded" && (
                            <Chip
                              size="sm"
                              className="flex items-center justify-center bg-red-100 rounded-full pt-[1px] px-2"
                            >
                              <span className="text-xs text-red-500">
                                Past Due
                              </span>
                            </Chip>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody className="text-sm text-left px-5">
                <p>{assignment.instruction}</p>
              </CardBody>

              <Divider className="my-1" />

              <CardFooter className="w-full flex text-left px-5 pb-5">
                <div className="text-xs text-gray-500 mt-1">
                  <p
                    className={`${
                      isPastDue[assignment.assignment_id]
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    Due:{" "}
                    {dueDates[assignment.assignment_id]
                      ? formatter.format(
                          dueDates[assignment.assignment_id].toDate(
                            getLocalTimeZone()
                          )
                        )
                      : "No due date"}
                  </p>
                </div>
              </CardFooter>
            </Link>
            {session?.user?.role === "teacher" && (
              <div className="absolute top-4 right-4 z-10">
                <AlertDialog
                  open={alertStates[assignment.assignment_id]}
                  onOpenChange={(isOpen) => {
                    setAlertStates((prev) => ({
                      ...prev,
                      [assignment.assignment_id]: isOpen,
                    }));
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      isIconOnly
                      startContent={<Trash2 size={20} />}
                      color="danger"
                      variant="light"
                      onClick={(e) => {
                        e.preventDefault();
                        setAlertStates((prev) => ({
                          ...prev,
                          [assignment.assignment_id]: true,
                        }));
                      }}
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the assignment.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setAlertStates((prev) => ({
                            ...prev,
                            [assignment.assignment_id]: false,
                          }));
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          handleDeleteAssignment(assignment.assignment_id, e);
                          setAlertStates((prev) => ({
                            ...prev,
                            [assignment.assignment_id]: false,
                          }));
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssignmentList;
