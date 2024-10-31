import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Button,
} from "@nextui-org/react";
import { useRouter } from "next/router";
import SampleReport from "./samplereport";
import Scores from "@/pages/components/Scores";
import Loader from "@/pages/components/Loader";
import { Users, Shapes } from "lucide-react";

const index = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const [reportDetails, setReportDetails] = useState({
    roomName: null,
    gameType: null,
    roomId: null,
  });
  const [studentData, setStudentData] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const rowsPerPage = 10;

  const fetchRooms = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch(
          `/api/accounts_teacher/room/create_room?account_id=${session.user.id}`
        );
        const data = await res.json();
        setRooms(data.roomsData);
        console.log("Rooms Data", data.roomsData);
        setFilteredRooms(data.roomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [session?.user?.id]);

  const fetchStudents = async (account_id) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/reports/getAllStudentsInRoom?account_id=${account_id}`
      );
      const data = await res.json();
      // console.log("Students in all rooms", data.studentsData);
      setStudents(data.studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/reports/reports?account_id=${session?.user?.id}`
      );
      const data = await response.json();
      setStudentData(data.studentData);
      // console.log("Student Data", data.studentData);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDifficulty === "all") {
      setFilteredRooms(rooms);
      fetchStudentData();
      fetchStudents(session?.user?.id);
    } else {
      setFilteredRooms(
        rooms.filter((room) => room.room_difficulty === selectedDifficulty)
      );
    }
    setPage(1);
  }, [selectedDifficulty, rooms]);

  const pages = Math.ceil(filteredRooms.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRooms.slice(start, end);
  }, [page, filteredRooms]);

  const handleDifficultyChange = (value) => {
    setSelectedDifficulty(value);
  };

  const handleRoomSelect = (room) => {
    console.log("Room", room);
    setSelectedRoomId(room.room_id);
    setSelectedRoomName(room.room_name);
    setReportDetails({
      ...reportDetails,
      roomId: room.room_id,
      roomCode: room.room_code,
      roomName: room.room_name,
    });
    fetchStudentData(room.room_code);
  };

  const handleGameSelect = (gameType) => {
    setSelectedGameType(gameType);
    setReportDetails({
      ...reportDetails,
      gameType: gameType,
    });
  };

  return (
    <div className="w-full m-4 p-4 max-w-[80rem] mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card
              radius="sm"
              className="shadow-none border-gray-300 border p-4"
            >
              <CardBody>
                <div className="flex flex-col ">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={24} />
                    <h3 className="text-xl font-semibold ">Total Students</h3>
                  </div>
                  <p className="text-3xl font-bold">{students.length}</p>
                </div>
              </CardBody>
            </Card>
            <Card
              radius="sm"
              className="shadow-none border-gray-300 border p-4"
            >
              <CardBody>
                <div className="flex flex-col ">
                  <div className="flex items-center gap-2 mb-4">
                    <Shapes size={24} />
                    <h3 className="text-xl font-semibold ">Total Rooms</h3>
                  </div>
                  <p className="text-3xl font-bold">{rooms.length}</p>
                </div>
              </CardBody>
            </Card>
          </div>
          <Scores studentRecords={studentData} students={students} />
        </>
      )}
    </div>
  );
};

export default index;
