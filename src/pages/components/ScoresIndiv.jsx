import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
    <div className="w-full">
      <div className="mb-4">
        <label htmlFor="month-select">Select Month: </label>
        <select
          id="month-select"
          value={selectedMonth}
          onChange={(e) =>
            setSelectedMonth(
              e.target.value === "all" ? "all" : parseInt(e.target.value)
            )
          }
        >
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {month === "all"
                ? "All"
                : new Date(0, month - 1).toLocaleString("en-US", {
                    month: "long",
                  })}
            </option>
          ))}
        </select>
        <label htmlFor="year-select">Select Year: </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(
              e.target.value === "all" ? "all" : parseInt(e.target.value)
            )
          }
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year === "all" ? "All" : year}
            </option>
          ))}
        </select>
      </div>
      {processedData && processedData.length > 0 ? (
        <>
          <Table className="w-full bg-white rounded-lg">
            <TableCaption>Student Scores</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => sortData("gameType")}>
                    Game Type{" "}
                    {sortConfig.key === "gameType" &&
                      (sortConfig.direction === "ascending" ? "↑" : "↓")}
                  </button>
                </TableHead>
                <TableHead onClick={() => sortData("date")}>
                  Date
                  {sortConfig.key === "date" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </TableHead>
                <TableHead onClick={() => sortData("average")}>
                  Average (%)
                  {sortConfig.key === "average" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map((row, index) => (
                <React.Fragment key={index}>
                  <TableRow>
                    <TableCell>{row.gameType}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.average} % </TableCell>
                    <TableCell>{row.scores.length}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleViewChart(index)}>
                        {viewChart[index] ? "View Less" : "View More"}
                      </button>
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
                            <YAxis />
                            <Tooltip />
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
          <Pagination>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationPrevious>
            <PaginationContent>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  active={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationItem>
              ))}
            </PaginationContent>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationNext>
          </Pagination>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ScoresIndiv;
