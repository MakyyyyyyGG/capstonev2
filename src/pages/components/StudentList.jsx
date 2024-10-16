import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Chip, Divider, Avatar, Button } from "@nextui-org/react";
import { useRouter } from "next/router";

const StudentList = ({ students: initialStudents }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { room_code } = router.query;

  // Maintain students in the local state
  const [students, setStudents] = useState(initialStudents);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  const handleRemoveStudent = async (account_id) => {
    if (confirm("Are you sure you want to remove this student?")) {
      try {
        const res = await fetch(`/api/accounts_teacher/room/students_list`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ account_id, room_code }),
        });
        const data = await res.json();
        if (res.ok) {
          // Remove the student from the state after successful deletion
          setStudents((prevStudents) =>
            prevStudents.filter((student) => student.account_id !== account_id)
          );
          // alert("Student removed successfully");
        } else {
          console.error(data.error || "Failed to remove student");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="text-xl font-bold my-4">
        <h1>Students List</h1>
        <Divider className="mt-3" />
      </div>

      <ul>
        {students.map((student) => (
          <li key={student.account_id} className="mb-4">
            <div className="flex gap-6 items-center justify-between p-2">
              <div className="flex items-center pl-2">
                <div className="px-4">
                  <Avatar size="md" src={student.profile_image} />
                </div>
                <div>
                  <p className="font-bold">
                    Name: {student.first_name} {student.last_name}
                  </p>
                  <p>Account ID: {student.account_id}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  color="danger"
                  onClick={() => handleRemoveStudent(student.account_id)}
                >
                  Remove
                </Button>
              </div>
            </div>
            <Divider className="mt-2" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
