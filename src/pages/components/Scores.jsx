import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Scores = ({ studentRecords, students, height }) => {
  const { data: session } = useSession();
  const [processedData, setProcessedData] = useState([]);
  const [viewChart, setViewChart] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableDifficulties, setAvailableDifficulties] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    if (studentRecords && students) {
      const processedData = processStudentRecords(studentRecords, students);
      setProcessedData(processedData);
      const { months, years, rooms, difficulties } =
        getAvailableFilters(studentRecords);
      setAvailableMonths(months);
      setAvailableYears(years);
      setAvailableRooms(rooms);
      setAvailableDifficulties(difficulties);
    }
  }, [
    studentRecords,
    students,
    selectedMonth,
    selectedYear,
    selectedRoom,
    selectedDifficulty,
    dateRange,
  ]);

  const getAvailableFilters = (records) => {
    const months = new Set();
    const years = new Set();
    const rooms = new Set();
    const difficulties = new Set();

    records.forEach((record) => {
      const recordDate = new Date(record.created_at);
      months.add(recordDate.getMonth() + 1);
      years.add(recordDate.getFullYear());
      if (record.room_name) rooms.add(record.room_name);
      if (record.room_difficulty) difficulties.add(record.room_difficulty);
    });

    return {
      months: ["all", ...Array.from(months).sort((a, b) => a - b)],
      years: ["all", ...Array.from(years).sort((a, b) => a - b)],
      rooms: ["all", ...Array.from(rooms).sort()],
      difficulties: ["all", ...Array.from(difficulties).sort()],
    };
  };

  const processStudentRecords = (records, studentList) => {
    if (!records || !studentList) {
      return [];
    }

    const studentMap = new Map(
      studentList.map((student) => [student.account_id, student])
    );

    const filteredRecords = records.filter((record) => {
      const recordDate = new Date(record.created_at);
      const isWithinDateRange =
        (!dateRange.from || recordDate >= dateRange.from) &&
        (!dateRange.to || recordDate <= dateRange.to);

      return (
        (selectedMonth === "all" ||
          recordDate.getMonth() + 1 === selectedMonth) &&
        (selectedYear === "all" || recordDate.getFullYear() === selectedYear) &&
        (selectedRoom === "all" || record.room_name === selectedRoom) &&
        (selectedDifficulty === "all" ||
          record.room_difficulty === selectedDifficulty) &&
        isWithinDateRange
      );
    });

    const groupedRecords = filteredRecords.reduce((acc, record) => {
      if (record && record.account_id && record.game_type) {
        const key = `${record.account_id}-${record.game_type}-${
          new Date(record.created_at).getMonth() + 1
        }-${new Date(record.created_at).getFullYear()}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(record);
      }
      return acc;
    }, {});

    return Object.entries(groupedRecords).map(([key, records]) => {
      const [accountId, gameType, month, year] = key.split("-");
      const student = studentMap.get(parseInt(accountId));

      const scores = records
        .filter((r) => r && r.score !== undefined)
        .map((r) =>
          r.score !== undefined ? (r.score / r.set_length) * 100 : "TBA"
        )
        .slice(0, 13);

      while (scores.length < 13) {
        scores.push("TBA");
      }

      const average =
        scores.filter((score) => score !== "TBA").length > 0
          ? scores.reduce(
              (sum, score) => sum + (score !== "TBA" ? score : 0),
              0
            ) / scores.filter((score) => score !== "TBA").length
          : 0;

      const status =
        average >= 90
          ? "Outstanding Progress"
          : average >= 75
          ? "Satisfactory Progress"
          : "Needs Improvement";

      return {
        name: student
          ? `${student.first_name} ${student.last_name}`
          : "Unknown",
        gameType: gameType || "Unknown",
        roomName: records[0]?.room_name || "N/A",
        roomDifficulty: records[0]?.room_difficulty || records[0]?.difficulty,
        date:
          records[0] && records[0].created_at
            ? new Date(records[0].created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "Unknown",
        title: records[0]?.title || "N/A",
        scores: scores.map((score) =>
          score === "TBA" ? "TBA" : parseFloat(score.toFixed(2))
        ),
        average: parseFloat(average.toFixed(2)),
        status: status,
      };
    });
  };

  const toggleViewChart = (index) => {
    setViewChart((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const sortData = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!processedData) return [];
    const sortableData = [...processedData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  };

  const sortedData = getSortedData().filter((row) =>
    row.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const hasRoomData = processedData.some(
    (data) => data.roomName !== "N/A" || data.roomDifficulty !== "N/A"
  );

  const handleSelectRecord = (index) => {
    setSelectedRecords((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const exportToExcel = async () => {
    try {
      const teacherFirstName = session.user.first_name;
      const teacherLastName = session.user.last_name;

      // Calculate the overall average of all averages
      const overallAverage =
        selectedRecords.reduce(
          (acc, index) => acc + sortedData[index].average,
          0
        ) / selectedRecords.length;

      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

      const newWorksheetData = [
        ["Liwanag Student Data Sheet"],
        [" "],
        ["Teacher Name", teacherFirstName, teacherLastName],
        [" "],
        ["Date Exported", formattedDate],
        [" "],
        [
          "Name",
          "Game Type",
          "Room",
          "Difficulty",
          "Date",
          "Title",
          ...Array.from({ length: 13 }, (_, i) => `Attempt ${i + 1}`),
          "Average",
          "Remarks", // Added Status column
        ],
        ...selectedRecords.map((index) => {
          const record = sortedData[index];
          const row = [
            record.name,
            record.gameType,
            record.roomName,
            record.roomDifficulty,
            record.date,
            record.title,
            ...record.scores.map((score) => (score === null ? "TBA" : score)),
            record.average,
            record.status, // Added Status to the row
          ];
          return row;
        }),
        [" "],
        ["Overall Average", overallAverage.toFixed(2)],
      ];

      const newWorksheet = XLSX.utils.aoa_to_sheet(newWorksheetData);
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        newWorkbook,
        newWorksheet,
        "Selected Records"
      );

      const excelBuffer = XLSX.write(newWorkbook, {
        bookType: "xlsx",
        type: "array",
      });
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        `Liwanag_${formattedDate}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <ArrowUp className="inline-block ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="inline-block ml-1 h-4 w-4" />
      );
    }
    return (
      <>
        <ChevronsUpDown className="inline-block ml-1 h-4 w-4 opacity-50" />
      </>
    );
  };

  return (
    <Card className="shadow-none border-gray-300 w-full rounded-lg bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 pb-4 flex-wrap justify-between">
          <div className="flex gap-4 items-center">
            <Input
              type="text"
              placeholder="Search by name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="border rounded p-2"
            />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month === "all"
                      ? "All Months"
                      : new Date(0, month - 1).toLocaleString("en-US", {
                          month: "long",
                        })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year === "all" ? "All Years" : year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasRoomData && (
              <>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select Room" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availableRooms.map((room) => (
                      <SelectItem key={room} value={room}>
                        {room === "all" ? "All Rooms" : room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Select Difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availableDifficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty === "all" ? "All Difficulties" : difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <div>
            <Button
              variant="outline"
              className="bg-purple-700 text-white"
              color="secondary"
              size="lg"
              onClick={exportToExcel}
            >
              Export to Excel
            </Button>
          </div>
        </div>

        <ScrollArea className={`h-[${height}px] rounded-lg border`}>
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRecords(sortedData.map((_, i) => i));
                      } else {
                        setSelectedRecords([]);
                      }
                    }}
                    checked={selectedRecords.length === sortedData.length}
                  />
                </TableHead>
                <TableHead onClick={() => sortData("name")}>
                  Name {renderSortIcon("name")}
                </TableHead>
                <TableHead onClick={() => sortData("title")}>
                  Title {renderSortIcon("title")}
                </TableHead>
                <TableHead onClick={() => sortData("gameType")}>
                  Game Type {renderSortIcon("gameType")}
                </TableHead>
                {hasRoomData && (
                  <>
                    <TableHead onClick={() => sortData("roomName")}>
                      Room {renderSortIcon("roomName")}
                    </TableHead>
                    <TableHead onClick={() => sortData("roomDifficulty")}>
                      Difficulty {renderSortIcon("roomDifficulty")}
                    </TableHead>
                  </>
                )}
                <TableHead onClick={() => sortData("date")}>
                  Date {renderSortIcon("date")}
                </TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead
                  className="text-center"
                  onClick={() => sortData("average")}
                >
                  Average {renderSortIcon("average")}
                </TableHead>
                <TableHead className="text-center">Remarks</TableHead>{" "}
                {/* Added Status Head */}
                <TableHead className="text-center">Teacher</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => (
                <React.Fragment key={index}>
                  <TableRow className="group hover:bg-gray-100">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(index)}
                        onChange={() => handleSelectRecord(index)}
                      />
                    </TableCell>
                    <TableCell>{row.name} </TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {row.gameType}
                      </Badge>
                    </TableCell>
                    {hasRoomData && (
                      <>
                        <TableCell>{row.roomName}</TableCell>
                        <TableCell>{row.roomDifficulty}</TableCell>
                      </>
                    )}
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-center">
                      {row.scores.filter((score) => score !== "TBA").length}
                    </TableCell>
                    <TableCell className="text-center">
                      {parseFloat(row.average).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {row.status} {/* Added Status Display */}
                    </TableCell>
                    <TableCell className="text-center">
                      {session.user.first_name} {session.user.last_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group-hover:opacity-100"
                        onClick={() => toggleViewChart(index)}
                      >
                        {viewChart[index] ? "View Less" : "View More"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {viewChart[index] && (
                    <TableRow>
                      <TableCell colSpan={hasRoomData ? 13 : 13}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={row.scores
                              .map((score, i) => ({
                                name: `Try ${i + 1}`,
                                score:
                                  score === "TBA"
                                    ? null
                                    : parseFloat(score.toFixed(2)),
                              }))
                              .slice(0, 13)} // Ensure only 13 attempts are shown
                            margin={{ top: 30, right: 20, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#8884d8"
                              label={{
                                position: "top",
                                offset: 10,
                                formatter: (value) => `${value}%`,
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {sortedData.length} entries
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Scores;
