import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Chip,
  Divider,
  Avatar,
  Button,
  Card,
  CardBody,
} from "@nextui-org/react";
import { useRouter } from "next/router";
import { UserX, ArrowUpDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const StudentList = ({ students: initialStudents }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { room_code } = router.query;
  const [students, setStudents] = useState(initialStudents);
  const [sortOrder, setSortOrder] = useState("asc");

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const handleRemoveStudent = async (account_id) => {
    if (confirm("Are you sure you want to remove this student?")) {
      const removeStudentPromise = async () => {
        const res = await fetch(`/api/accounts_teacher/room/students_list`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ account_id, room_code }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to remove student");
        }

        setStudents((prevStudents) =>
          prevStudents.filter((student) => student.account_id !== account_id)
        );

        return data;
      };

      toast.promise(removeStudentPromise(), {
        loading: "Removing student...",
        success: "Student removed successfully",
        error: (err) => `Error: ${err.message}`,
      });
    }
  };

  const handleSort = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sortedStudents = [...students].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      if (newSortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    setStudents(sortedStudents);
  };

  return (
    <div className="w-full mx-auto ">
      <Toaster />
      <Card
        radius="sm"
        className="mb-6 p-4  h-[700px] shadow-none border-gray-300 border"
      >
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Students List</h1>
              <Button
                isIconOnly
                radius="sm"
                color="secondary"
                variant="light"
                onClick={handleSort}
                className="ml-2"
              >
                <ArrowUpDown size={20} />
              </Button>
            </div>
            <Chip color="secondary" variant="flat">
              {students.length} Students
            </Chip>
          </div>

          <div className="space-y-4">
            {students.map((student) => (
              <Card
                radius="sm"
                key={student.account_id}
                className="w-full p-2 shadow-none border border-gray-300 "
              >
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        color="secondary"
                        size="lg"
                        src={student.profile_image}
                      />
                      <div>
                        <h3 className="text-lg font-semibold">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {student.account_id}
                        </p>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      radius="sm"
                      color="transparent"
                      variant="flat"
                      onClick={() => handleRemoveStudent(student.account_id)}
                    >
                      <UserX size={22} color="red" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}

            {students.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students in this room yet
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default StudentList;
