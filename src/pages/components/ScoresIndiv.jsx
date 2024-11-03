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
    if (studentRecords) {
      const processedData = processStudentRecords(studentRecords.data);
      setProcessedData(processedData);
      const { months, years } = getAvailableMonthsAndYears(studentRecords.data);
      setAvailableMonths(months);
      setAvailableYears(years);
    }
  }, [studentRecords, selectedMonth, selectedYear]);

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

  const processStudentRecords = (records) => {
    if (!records || !Array.isArray(records)) {
      return [];
    }

    // Filter records by selected month and year
    const filteredRecords = records.filter((record) => {
      const recordDate = new Date(record.created_at);
      return (
        (selectedMonth === "all" ||
          recordDate.getMonth() + 1 === selectedMonth) &&
        (selectedYear === "all" || recordDate.getFullYear() === selectedYear)
      );
    });

    // Group records by account_id and game_type
    const groupedRecords = filteredRecords.reduce((acc, record) => {
      if (record && record.account_id && record.game_type) {
        const key = `${record.account_id}-${record.game_type}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(record);
      }
      return acc;
    }, {});

    // Process each group of records
    return Object.entries(groupedRecords).map(([key, records]) => {
      const [accountId, gameType] = key.split("-");

      // Filter and sort the scores, take up to 8 attempts
      const scores = records
        .filter((r) => r && r.score !== undefined)
        .map((r) => (r.score !== undefined ? r.score : "TBA"))
        .slice(0, 8);

      // Calculate the average score as a percentage based on set_length
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

      return {
        accountId: parseInt(accountId),
        gameType: gameType || "Unknown",
        date:
          records[0] && records[0].created_at
            ? new Date(records[0].created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "Unknown",
        scores: scores.map((score) =>
          score !== "TBA"
            ? Math.min((score / records[0].set_length) * 100, 100).toFixed(2)
            : "TBA"
        ),
        average: average.toFixed(2),
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

  const sortedData = getSortedData();
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );
  const totalPages = Math.ceil(sortedData.length / recordsPerPage);

  return (
    <Card className="shadow-none border-gray-300 w-full rounded-lg bg-white ">
      <CardContent className="p-6">
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

        <ScrollArea className="h-[400px] rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead onClick={() => sortData("gameType")}>
                  Game Type
                </TableHead>
                <TableHead onClick={() => sortData("date")}>Date</TableHead>
                <TableHead onClick={() => sortData("average")}>
                  Average (%)
                </TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((row, index) => (
                <React.Fragment key={index}>
                  <TableRow className="group hover:bg-gray-100">
                    <TableCell>{row.gameType}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(row.average).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {row.scores.length}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => toggleViewChart(index)}
                      >
                        {viewChart[index] ? "View Less" : "View More"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {viewChart[index] && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={row.scores.map((score, i) => ({
                              name: `Attempt ${i + 1}`,
                              score: score === "TBA" ? null : parseFloat(score),
                            }))}
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
            Showing {currentRecords.length} of {processedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <Button
                key={i + 1}
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
                className={
                  currentPage === i + 1
                    ? "bg-secondary text-primary-foreground"
                    : ""
                }
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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
