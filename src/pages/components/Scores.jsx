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

const Scores = ({ studentRecords, students }) => {
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    if (studentRecords && students) {
      const processedData = processStudentRecords(studentRecords, students);
      console.log("Processed Data:", processedData); // Debugging undefined issue
      setProcessedData(processedData);
    }
  }, [studentRecords, students]);

  const processStudentRecords = (records, studentList) => {
    if (!records || !studentList) {
      return [];
    }

    // Create a map for easy access to student details by account_id
    const studentMap = new Map(
      studentList.map((student) => [student.account_id, student])
    );

    // Group records by account_id and game_type
    const groupedRecords = records.reduce((acc, record) => {
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
      const student = studentMap.get(parseInt(accountId));

      // Filter and sort the scores, take up to 8 attempts
      const scores = records
        .filter((r) => r && r.score !== undefined)
        .map((r) => (r.score !== undefined ? r.score : "TBA"))
        .sort((a, b) => {
          if (a === "TBA" && b === "TBA") return 0;
          if (a === "TBA") return 1;
          if (b === "TBA") return -1;
          return b - a;
        })
        .slice(0, 8);

      // Calculate the average score
      const average =
        scores.filter((score) => score !== "TBA").length > 0
          ? scores.reduce(
              (sum, score) => sum + (score !== "TBA" ? score : 0),
              0
            ) / scores.filter((score) => score !== "TBA").length
          : 0;

      return {
        name: student
          ? `${student.first_name} ${student.last_name}`
          : "Unknown",
        gameType: gameType || "Unknown",
        date:
          records[0] && records[0].created_at
            ? new Date(records[0].created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "Unknown",
        scores,
        average: average.toFixed(2),
      };
    });
  };

  return (
    <div className="w-full">
      {processedData && processedData.length > 0 ? (
        <Table className="w-full bg-white rounded-lg">
          <TableCaption>Student Scores</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Game Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Attempt 1</TableHead>
              <TableHead>Attempt 2</TableHead>
              <TableHead>Attempt 3</TableHead>
              <TableHead>Attempt 4</TableHead>
              <TableHead>Attempt 5</TableHead>
              <TableHead>Attempt 6</TableHead>
              <TableHead>Attempt 7</TableHead>
              <TableHead>Attempt 8</TableHead>
              <TableHead>Average</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.gameType}</TableCell>
                <TableCell>{row.date}</TableCell>
                {Array.isArray(row.scores) && row.scores.length > 0 ? (
                  row.scores.map((score, i) => (
                    <TableCell key={i}>{score}</TableCell>
                  ))
                ) : (
                  <TableCell colSpan={8}>No Scores</TableCell>
                )}
                {[...Array(8 - row.scores.length)].map((_, i) => (
                  <TableCell key={i + row.scores.length}>-</TableCell>
                ))}
                <TableCell>{row.average}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default Scores;
