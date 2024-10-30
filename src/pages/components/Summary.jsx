import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { Trophy, Home, BarChart3 } from "lucide-react";

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

  const [showEndScreen, setShowEndScreen] = useState(true); // State to toggle end screen visibility
  const [showSummary, setShowSummary] = useState(false); // State to toggle summary visibility

  return (
    <div>
      <AnimatePresence>
        {showEndScreen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
            >
              <Card className="p-6 border-0 shadow-lg">
                <CardHeader className="flex-col text-center space-y-4 pb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center"
                  >
                    <Trophy className="h-8 w-8 text-purple-600" />
                  </motion.div>
                  <h1 className="text-3xl font-bold">Game Over</h1>
                </CardHeader>

                <CardBody className="text-center space-y-6 pt-4">
                  <p className="text-muted-foreground">Thanks for playing!</p>

                  <div className="grid grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-emerald-50 p-4 rounded-md"
                    >
                      <div className="text-2xl font-bold text-emerald-600">
                        10
                      </div>
                      <div className="text-sm text-emerald-600">Correct</div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-rose-50 p-4 rounded-md"
                    >
                      <div className="text-2xl font-bold text-rose-600">10</div>
                      <div className="text-sm text-rose-600">Incorrect</div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-purple-50 p-4 rounded-md"
                    >
                      <div className="text-2xl font-bold text-purple-600">
                        10
                      </div>
                      <div className="text-sm text-purple-600">Total</div>
                    </motion.div>
                  </div>
                </CardBody>

                <CardFooter className="flex flex-col gap-3 pt-6">
                  <Button
                    // onClick={onViewSummary}
                    onClick={() => {
                      setShowEndScreen(false); // Hide end screen
                      setShowSummary(true); // Show summary
                    }}
                    radius="sm"
                    className="text-white w-full bg-purple-500 hover:bg-purple-600"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Summary
                  </Button>
                  <Button
                    // onClick={onReturnHome}
                    variant="outline"
                    radius="sm"
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Game Performance Summary */}
      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-[40rem] mx-auto p-6 space-y-6 my-4">
            <h1 className="text-2xl font-bold text-center">
              Game Performance Summary
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-emerald-500 text-white z-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                    <h1 className="text-xs font-medium">Correct</h1>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">10</div>
                  </CardBody>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-rose-500 text-white z-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                    <h1 className="text-xs font-medium">Incorrect</h1>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">10</div>
                  </CardBody>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-violet-500 text-white z-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
                    <h1 className="text-xs font-medium">Total Score</h1>
                  </CardHeader>
                  <CardBody>
                    <div className="text-2xl font-bold">10</div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
            <div className="flex flex-col gap-4 py-4 border shadow-inner rounded-xl">
              <h3 className="text-lg font-bold text-center">Accuracy</h3>
              <div className="flex justify-center gap-4 items-center max-sm:flex-col max-sm:gap-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="monthFilter" className="text-nowrap text-sm">
                    Filter by Month:
                  </label>
                  <Select
                    size="sm"
                    radius="sm"
                    variant="bordered"
                    id="monthFilter"
                    defaultSelectedKeys={["Oct"]}
                    className="w-[100px]"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <SelectItem value="All">All</SelectItem>
                    {uniqueMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <label htmlFor="yearFilter" className="text-nowrap text-sm">
                    Filter by Year:
                  </label>
                  <Select
                    size="sm"
                    radius="sm"
                    id="yearFilter"
                    variant="bordered"
                    defaultSelectedKeys={["2024"]}
                    className="w-[100px]"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <SelectItem value="All">All</SelectItem>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <LineChart
                  width={480}
                  height={250}
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
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Summary;
