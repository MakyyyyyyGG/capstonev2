import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
} from "@nextui-org/react";
const index = ({ ...reportDetails }) => {
  console.log("Report Details", reportDetails);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [studentData, setStudentData] = useState([]);

  const fetchStudentData = async () => {
    const response = await fetch(
      `/api/reports/reports?room_code=${reportDetails.roomCode}`
    );
    const data = await response.json();
    setStudentData(data.studentData);
    console.log("Student Data", data.studentData);
  };

  useEffect(() => {
    fetchStudentData();
  }, [reportDetails.roomId]);
  return (
    <div>
      <Button onPress={onOpen}>Open Modal</Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Game Report for {reportDetails.roomName} -
                {reportDetails.gameType} - {reportDetails.roomId}
              </ModalHeader>
              <ModalBody>
                <Table>
                  <TableHeader>
                    <TableColumn>Student</TableColumn>
                    <TableColumn>Email</TableColumn>
                    <TableColumn>Profile Image</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {studentData.map((student) => (
                      <TableRow key={student.account_id}>
                        <TableCell>{student.profile_image}</TableCell>
                        <TableCell>
                          {student.first_name} {student.last_name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default index;
