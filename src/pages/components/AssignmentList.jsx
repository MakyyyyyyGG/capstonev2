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
import { Trash } from "lucide-react";
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
        <Card key={assignment.assignment_id} className="w-full" shadow="sm">
          <Link
            href={`${roleRedirect}/${assignment.room_code}/assignment/${assignment.assignment_id}`}
            className="w-full"
          >
            <CardHeader className="font-bold text-xl flex justify-between items-center">
              {assignment.title}
            </CardHeader>
            <CardBody>
              <p>{assignment.instruction}</p>
            </CardBody>
            <CardFooter className="text-sm text-gray-500">
              Created:{" "}
              {new Date(assignment.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </CardFooter>
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
                  startContent={<Trash size={20} />}
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
