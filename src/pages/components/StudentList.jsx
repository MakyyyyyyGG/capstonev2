import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Chip, Divider, Avatar } from "@nextui-org/react";

const fetchStudents = async (room_code, setStudents) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/students_list?room_code=${room_code}`
    );
    const data = await res.json();
    setStudents(data.studentsData);
  } catch (error) {
    console.error("Error fetching students:", error);
  }
};

const StudentList = ({ room_code }) => {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState([]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  useEffect(() => {
    if (room_code) {
      fetchStudents(room_code, setStudents);
    }
  }, [room_code]);

  return (
    <div className="w-full">
      <div className="text-xl font-bold my-4">
        <h1>Students List</h1>
        <Divider className="mt-3" />
      </div>

      <ul>
        {students.map((student) => (
          <li key={student.account_id} className="mb-4">
            <div className="flex items-center gap-6 items-center p-2">
              <div className="flex items-center pl-2">
                <div className="px-4">
                  <Avatar size="md" src="" />
                </div>
                <div>
                  <p className="font-bold">
                    Name: {student.first_name} {student.last_name}
                  </p>
                  <p>Account ID: {student.account_id}</p>
                </div>
              </div>
              {student.account_id === session?.user?.id && (
                <Chip color="secondary" variant="flat">
                  You
                </Chip>
              )}
            </div>
            <Divider className="mt-2" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
