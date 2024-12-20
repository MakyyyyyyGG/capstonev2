import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@nextui-org/react";
import { ScanSearch } from "lucide-react";

const StudentSubmissions = ({ submittedStudents = [], dueDate }) => {
  const router = useRouter();
  // console.log("due date", dueDate); // Updated console log message
  const { assignment_id } = router.query;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState({});
  const [selectedForExport, setSelectedForExport] = useState({});
  const [modalImage, setModalImage] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    if (submittedStudents?.students?.length > 0) {
      const initialGrades = {};
      const initialSelected = {};
      submittedStudents.students.forEach((student) => {
        if (student.grade) {
          initialGrades[student.account_id] = student.grade;
        }
        initialSelected[student.account_id] = false;
      });
      setGrades(initialGrades);
      setSelectedForExport(initialSelected);
    }
  }, [submittedStudents]);

  const handleGradeSubmit = async (studentId) => {
    try {
      const response = await fetch("/api/assignment/submittedAssignments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id,
          account_id: studentId,
          grade: grades[studentId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update grade");
      }

      const data = await response.json();
      toast.success("Grade updated successfully");
    } catch (error) {
      console.error("Error submitting grade:", error);
      toast.error("Failed to update grade");
    }
  };

  const handleGradeChange = (studentId, value) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedForExport((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const exportToExcel = () => {
    if (!submittedStudents?.students?.length) {
      toast.error("No data to export");
      return;
    }

    const selectedStudents = submittedStudents.students.filter(
      (student) => selectedForExport[student.account_id] === true
    );

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student to export");
      return;
    }

    const exportData = selectedStudents.map((student) => {
      const submissionDate = new Date(student.submitted_at);
      const isPastDue = submissionDate > new Date(dueDate);
      return {
        "Assignment Title": student.assignment_title,
        "Student Name": `${student.first_name} ${student.last_name}`,
        Grade: grades[student.account_id] || "Not graded",
        "Submission Date": submissionDate.toLocaleString(),
        "Submission Status": isPastDue ? "Past Due" : "On Time", // Updated logic for submission status
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Grades");

    const fileName = `student_grades_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Grades exported successfully");
  };

  const openImageModal = (url) => {
    setModalImage(url);
    onOpen();
  };

  return (
    <div className="">
      <div className="grid grid-cols-6 gap-4 max-md:grid-cols-1">
        <div className="col-span-4 max-md:col-span-1">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Students Grades</h2>
              <Button color="secondary" radius="sm" onClick={exportToExcel}>
                Export to Excel
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Export</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead> Title</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Submission Status</TableHead>{" "}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittedStudents?.students?.map((student) => (
                    <TableRow
                      key={student.account_id}
                      className={
                        selectedStudent?.account_id === student.account_id
                          ? "bg-muted/50"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          isSelected={selectedForExport[student.account_id]}
                          onChange={() =>
                            toggleStudentSelection(student.account_id)
                          }
                        />
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.assignment_title}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="0-100"
                          value={grades[student.account_id] || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              student.account_id,
                              e.target.value.slice(0, 3) // Limit to 3 digits
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleGradeSubmit(student.account_id)}
                          className="px-3 py-1 bg-primary text-white rounded-lg text-sm"
                          isDisabled={!grades[student.account_id]}
                        >
                          Save Grade
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(student.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={
                          new Date(student.submitted_at) > new Date(dueDate)
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {new Date(student.submitted_at) > new Date(dueDate)
                          ? "Past Due"
                          : "On Time"}{" "}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Media display */}
        <Card className="col-span-2 max-md:col-span-1">
          <CardHeader>
            <h2 className="text-2xl font-semibold">Submitted Media</h2>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <div className="grid grid-cols-1 gap-4">
                {Object.values(selectedStudent.media).map((url, index) => {
                  if (url.includes("youtu")) {
                    return (
                      <div key={index}>
                        <iframe
                          width="100%"
                          height="200px"
                          src={url.replace("youtu.be/", "youtube.com/embed/")}
                          title="YouTube video"
                          className="rounded-lg"
                          allowFullScreen
                        />
                      </div>
                    );
                  } else if (url.includes(".mp4")) {
                    return (
                      <div className="bg-black h-[200px] rounded-lg flex items-center justify-center">
                        <video
                          key={index}
                          controls
                          className="w-full h-[200px] rounded-lg"
                        >
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else {
                    return (
                      <div className="relative bg-black object-contain w-full h-[200px] rounded-lg">
                        <img
                          key={index}
                          src={url}
                          alt={`Submission ${index + 1}`}
                          className="object-contain w-full h-[200px] rounded-lg"
                        />
                        <Button
                          isIconOnly
                          size="sm"
                          color="secondary"
                          className="absolute top-2 right-2"
                          onPress={() => openImageModal(url)}
                        >
                          <ScanSearch size={18} />
                        </Button>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <p className="w-full text-center text-gray-500">
                Select a student to view their submission
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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

export default StudentSubmissions;
