import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardBody } from "@nextui-org/react";

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
      <Card className="max-w-4xl mx-auto p-6 space-y-6 my-4">
        <h1 className="text-3xl font-bold text-center mb-4">
          Game Performance Summary
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-emerald-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h1 className="text-sm font-medium">Correct</h1>
              </CardHeader>
              <CardBody>
                <div className="text-4xl font-bold">10</div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-rose-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h1 className="text-sm font-medium">Incorrect</h1>
              </CardHeader>
              <CardBody>
                <div className="text-4xl font-bold">10</div>
              </CardBody>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-violet-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h1 className="text-sm font-medium">Total Score</h1>
              </CardHeader>
              <CardBody>
                <div className="text-4xl font-bold">10</div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
        <Card className="flex flex-col gap-4 py-4">
          <h3 className="text-lg font-bold text-center">Accuracy</h3>
          <div className="flex justify-center gap-4">
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
          </div>
          <div className="flex justify-center ">
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
        </Card>
      </Card>
    </div>
  );
};

export default Summary;
