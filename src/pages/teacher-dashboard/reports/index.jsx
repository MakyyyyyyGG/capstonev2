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
  Tabs,
  Tab,
  Button,
} from "@nextui-org/react";
import { useRouter } from "next/router";
import SampleReport from "./samplereport";
const index = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTab, setSelectedTab] = useState("select-room");
  const rowsPerPage = 10;
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const roomDetails = {
    roomName: null,
    gameType: null,
    roomId: null,
  };
  const [reportDetails, setReportDetails] = useState(roomDetails);
  const router = useRouter();

  const fetchRooms = async () => {
    if (session?.user?.id) {
      try {
        const res = await fetch(
          `/api/accounts_teacher/room/create_room?account_id=${session.user.id}`
        );
        const data = await res.json();
        setRooms(data.roomsData);
        setFilteredRooms(data.roomsData);
        console.log(data.roomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [session?.user?.id]);

  useEffect(() => {
    if (selectedDifficulty === "all") {
      setFilteredRooms(rooms);
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

  const handleCellClick = (roomId) => {
    // console.log(roomId, selectedGameType);
  };

  const handleDifficultyChange = (value) => {
    setSelectedDifficulty(value);
    // console.log(value);
  };

  const handleTabChange = (key) => {
    setSelectedTab(key);
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <Card>
        <CardHeader>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            disabledKeys={selectedTab === "select-room" ? ["select-game"] : []}
          >
            <Tab key="select-room" title="Step 1: Select Room" />
            <Tab key="select-game" title="Step 2: Select Game" />
          </Tabs>
        </CardHeader>
        <CardBody>
          {selectedTab === "select-room" && (
            <>
              <Select
                label="Filter by Difficulty"
                className="mb-4"
                onChange={(e) => handleDifficultyChange(e.target.value)}
              >
                <SelectItem key="all" value="all">
                  All
                </SelectItem>
                <SelectItem key="Easy" value="Easy">
                  Easy
                </SelectItem>
                <SelectItem key="Moderate" value="Moderate">
                  Moderate
                </SelectItem>
                <SelectItem key="Hard" value="Hard">
                  Hard
                </SelectItem>
              </Select>
              <Table
                aria-label="Example table with client-side pagination"
                bottomContent={
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="secondary"
                      page={page}
                      total={pages}
                      onChange={(page) => setPage(page)}
                    />
                  </div>
                }
                selectionMode="single"
                classNames={{
                  tr: "cursor-pointer hover:bg-gray-100",
                }}
              >
                <TableHeader>
                  <TableColumn>Room Name</TableColumn>
                  <TableColumn>Difficulty</TableColumn>
                  <TableColumn>Room Code</TableColumn>
                  <TableColumn>Action</TableColumn>
                </TableHeader>

                <TableBody emptyContent={"No rows to display."}>
                  {items.map((room) => (
                    <TableRow
                      key={room.room_id}
                      onClick={() => {
                        setSelectedTab("select-game");
                        handleCellClick(room.room_id);
                        setSelectedRoomName(room.room_name);
                        setReportDetails({
                          ...reportDetails,
                          roomId: room.room_id,
                          roomName: room.room_name,
                        });
                      }}
                    >
                      <TableCell>{room.room_name}</TableCell>
                      <TableCell>{room.room_difficulty}</TableCell>
                      <TableCell>{room.room_code}</TableCell>
                      <TableCell>
                        <Button
                          onClick={(e) => {
                            setSelectedTab("select-game");
                            handleCellClick(room.room_id);
                            setSelectedRoomName(room.room_name);
                            setReportDetails({
                              ...reportDetails,
                              roomId: room.room_id,
                              roomName: room.room_name,
                            });
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {selectedTab === "select-game" && (
            <div>
              <h2>Select Game Content</h2>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant={
                    selectedGameType === "ThinkPic" ? "solid" : "bordered"
                  }
                  onClick={() => {
                    setSelectedGameType("ThinkPic");
                    setReportDetails({
                      ...reportDetails,
                      gameType: "ThinkPic",
                    });
                  }}
                >
                  ThinkPic
                </Button>
                <Button
                  variant={
                    selectedGameType === "ThinkPic+" ? "solid" : "bordered"
                  }
                  onClick={() => {
                    setSelectedGameType("ThinkPic+");
                    setReportDetails({
                      ...reportDetails,
                      gameType: "ThinkPic+",
                    });
                  }}
                >
                  ThinkPic +
                </Button>
                <Button
                  variant={
                    selectedGameType === "Color Game" ? "solid" : "bordered"
                  }
                  onClick={() => {
                    setSelectedGameType("ColorGame");
                    setReportDetails({
                      ...reportDetails,
                      gameType: "Color Game",
                    });
                  }}
                >
                  Color Game
                </Button>
                <Button
                  variant={
                    selectedGameType === "ColorGame+" ? "solid" : "bordered"
                  }
                  onClick={() => {
                    setSelectedGameType("ColorGame+");
                    setReportDetails({
                      ...reportDetails,
                      gameType: "ColorGame+",
                    });
                  }}
                >
                  Color Game +
                </Button>
                <Button
                  variant={
                    selectedGameType === "Decision Maker" ? "solid" : "bordered"
                  }
                  onClick={() => {
                    setSelectedGameType("Decision Maker");
                    setReportDetails({
                      ...reportDetails,
                      gameType: "Decision Maker",
                    });
                  }}
                >
                  Decision Maker
                </Button>
              </div>
              {selectedRoomName && selectedGameType && (
                <Card className="mt-4">
                  <CardHeader>
                    <h2>Selected Report</h2>
                  </CardHeader>
                  <CardBody>
                    <h1>Room: {selectedRoomName}</h1>
                    <h1>Game: {selectedGameType}</h1>
                  </CardBody>
                </Card>
              )}
              <SampleReport {...reportDetails} />
              <Button
                onClick={() => console.log(reportDetails)}
                className="my-4"
              >
                View Reports
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default index;
