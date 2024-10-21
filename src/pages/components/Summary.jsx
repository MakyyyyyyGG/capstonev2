import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const Summary = ({ gameRecord, questions }) => {
  const currentMonth = new Date().toLocaleString("default", { month: "short" });
  const currentYear = new Date().getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Prepare data for the LineChart
  const chartData = gameRecord
    .filter((record) => {
      const date = new Date(record.created_at);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear().toString();
      const monthMatch = selectedMonth === "All" || month === selectedMonth;
      const yearMatch = selectedYear === "All" || year === selectedYear;
      return monthMatch && yearMatch;
    })
    .map((record, index) => {
      const date = new Date(record.created_at);
      const month = date.toLocaleString("default", { month: "short" });
      return {
        name: `Attempt ${index + 1} (${month})`,
        Score: ((record.score / questions) * 100).toFixed(2), // Convert to percentage and limit to 2 decimals
      };
    });

  // Get unique months and years from gameRecord
  const uniqueMonths = [
    ...new Set(
      gameRecord.map((record) =>
        new Date(record.created_at).toLocaleString("default", {
          month: "short",
        })
      )
    ),
  ];

  const uniqueYears = [
    ...new Set(
      gameRecord.map((record) =>
        new Date(record.created_at).getFullYear().toString()
      )
    ),
  ];

  return (
    <div>
      <h3>Game Performance Summary</h3>
      <div>
        <label htmlFor="monthFilter">Filter by Month: </label>
        <select
          id="monthFilter"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="All">All</option>
          {uniqueMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="yearFilter">Filter by Year: </label>
        <select
          id="yearFilter"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="All">All</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <LineChart
        width={500}
        height={300}
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="Score"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </div>
  );
};

export default Summary;
