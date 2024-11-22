import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
} from "@nextui-org/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Trash2, NotebookPen } from "lucide-react";
import toast from "react-hot-toast";
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

const AssignmentList = ({ assignments, onDelete }) => {
  // console.log("assignments", assignments);
  const { data: session } = useSession();
  const [roleRedirect, setRoleRedirect] = useState("");
  const [alertStates, setAlertStates] = useState({});

  // Handle case where assignments is not an array
  const assignmentArray = Array.isArray(assignments) ? assignments : [];

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
    e.preventDefault(); // Prevent Link navigation

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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Assignments</h1>
      {assignmentArray.map((assignment) => (
        <Card
          key={assignment.assignment_id}
          isPressable
          radius="sm"
          className=" shadow-none border-gray-300 border flex flex-row items-center w-full py-4 px-6 hover:bg-gray-200   hover:border-purple-700 max-sm:px-4 max-sm:py-3"
          shadow="sm"
        >
          <Link
            href={`${roleRedirect}/${assignment.room_code}/assignment/${assignment.assignment_id}`}
            className="w-full flex items-center gap-4"
          >
            <div className="font-bold text-xl flex justify-between items-center">
              <div className="flex items-center justify-center w-[60px] h-[60px] rounded-xl">
                <div className="flex items-center justify-center w-[60px] h-[60px] bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl">
                  <NotebookPen className="text-3xl" />
                </div>
              </div>
            </div>
            <div className="flex flex-col text-left">
              <div className="font-bold mb-1">{assignment.title}</div>
              <div>
                <p className="truncate text-sm mb-1">
                  {assignment.instruction}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                Created:{" "}
                {new Date(assignment.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </Link>
          {session?.user?.role === "teacher" && (
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
                    This action cannot be undone. This will permanently delete
                    the assignment.
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
          )}
        </Card>
      ))}
    </div>
  );
};

export default AssignmentList;
