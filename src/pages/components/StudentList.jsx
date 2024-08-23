import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Chip } from "@nextui-org/react";

const fetchStudents = async (room_code, setStudents) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/students_list?room_code=${room_code}`
    );
    const data = await res.json();
    setStudents(data.studentsData);
    console.log(data);
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
    <div>
      <h1>Student List</h1>
      <ul>
        {students.map((student) => (
          <li key={student.account_id} className="mb-4 flex gap-6">
            <p>First Name: {student.first_name}</p>
            <p>Last Name: {student.last_name}</p>
            <p>Account ID: {student.account_id}</p>
            {student.account_id === session?.user?.id && (
              <Chip color="secondary" variant="flat">
                You
              </Chip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
