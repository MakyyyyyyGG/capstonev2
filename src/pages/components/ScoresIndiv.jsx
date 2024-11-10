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
import { ChevronLeft, ChevronRight } from "lucide-react";

const ScoresIndiv = ({ studentRecords }) => {
  const [processedData, setProcessedData] = useState([]);
  const [viewChart, setViewChart] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const recordsPerPage = 10;

  useEffect(() => {
    if (studentRecords?.data) {
      // Process all records regardless of selected month/year
      const allProcessedData = processStudentRecords(studentRecords.data, true);
      setProcessedData(allProcessedData);
      const { months, years } = getAvailableMonthsAndYears(studentRecords.data);
      setAvailableMonths(months);
      setAvailableYears(years);
      setCurrentPage(1);
    }
  }, [studentRecords]);

  const getAvailableMonthsAndYears = (records) => {
    const months = new Set();
    const years = new Set();
    records.forEach((record) => {
      const recordDate = new Date(record.created_at);
      months.add(recordDate.getMonth() + 1);
      years.add(recordDate.getFullYear());
    });
    return {
      months: ["all", ...Array.from(months).sort((a, b) => a - b)],
      years: ["all", ...Array.from(years).sort((a, b) => a - b)],
    };
  };

  const processStudentRecords = (records, includeAll = false) => {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    // Filter records based on selected month and year if not including all
    let filteredRecords = records;
    if (!includeAll) {
      filteredRecords = records.filter((record) => {
        const recordDate = new Date(record.created_at);
        return (
          (selectedMonth === "all" ||
            recordDate.getMonth() + 1 === parseInt(selectedMonth)) &&
          (selectedYear === "all" ||
            recordDate.getFullYear() === parseInt(selectedYear))
        );
      });
    }

    // Group records by game title and month/year
    const groupedByTitleAndDate = filteredRecords.reduce((acc, record) => {
      const date = new Date(record.created_at);
      const key = `${record.title}-${
        date.getMonth() + 1
      }-${date.getFullYear()}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {});

    // Process each group
    const processedRecords = [];
    Object.entries(groupedByTitleAndDate).forEach(([key, records]) => {
      const [title, month, year] = key.split("-");

      const scores = records
        .filter((r) => r && r.score !== undefined)
        .map((r) => (r.score !== undefined ? r.score : "TBA"))
        .slice(0, 8)
        .reverse();

      const average =
        scores.filter((score) => score !== "TBA").length > 0
          ? Math.min(
              (scores.reduce(
                (sum, score) => sum + (score !== "TBA" ? score : 0),
                0
              ) /
                scores.filter((score) => score !== "TBA").length /
                records[0].set_length) *
                100,
              100
            )
          : 0;

      processedRecords.push({
        gameId: records[0].game_id,
        gameType: records[0].game_type || "Unknown",
        gameTitle: title,
        date: new Date(year, month - 1).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
        scores: scores.map((score) =>
          score !== "TBA"
            ? Math.min((score / records[0].set_length) * 100, 100).toFixed(2)
            : "TBA"
        ),
        average: average.toFixed(2),
        month: parseInt(month),
        year: parseInt(year),
      });
    });

    return processedRecords;
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

    let filteredData = processedData;
    if (selectedMonth !== "all" || selectedYear !== "all") {
      filteredData = processedData.filter((record) => {
        return (
          (selectedMonth === "all" ||
            record.month === parseInt(selectedMonth)) &&
          (selectedYear === "all" || record.year === parseInt(selectedYear))
        );
      });
    }

    const sortableData = [...filteredData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (sortConfig.key === "average") {
          return sortConfig.direction === "ascending"
            ? parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key])
            : parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);
        }
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

  const sortedData = getSortedData();
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Card className="shadow-none border-gray-300 w-full rounded-lg bg-white ">
      <CardContent className="p-6">
        {/* <h1 className="text-2xl font-bold">{sortedData.length} Records</h1> */}
        <div className="flex items-center gap-4 pb-4 flex-wrap">
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
        </div>

        <ScrollArea className="h-[500px] rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead onClick={() => sortData("gameType")}>
                  Game Type
                </TableHead>
                <TableHead onClick={() => sortData("gameTitle")}>
                  Game Title
                </TableHead>
                <TableHead onClick={() => sortData("date")}>Date</TableHead>
                <TableHead
                  onClick={() => sortData("average")}
                  className="text-center"
                >
                  Average (%)
                </TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((row, index) => (
                <React.Fragment key={index}>
                  <TableRow className="group hover:bg-gray-100">
                    <TableCell>{row.gameType}</TableCell>
                    <TableCell>{row.gameTitle}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-center">
                      {parseFloat(row.average).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {row.scores.length}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className=" group-hover:opacity-100"
                        onClick={() => toggleViewChart(index)}
                      >
                        {viewChart[index] ? "View Less" : "View More"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {viewChart[index] && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={row.scores.map((score, i) => ({
                              name: `Attempt ${i + 1}`,
                              score: score === "TBA" ? null : parseFloat(score),
                            }))}
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
            Showing {indexOfFirstRecord + 1} to{" "}
            {Math.min(indexOfLastRecord, sortedData.length)} of{" "}
            {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={
                      currentPage === page
                        ? "bg-secondary text-primary-foreground"
                        : ""
                    }
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoresIndiv;
