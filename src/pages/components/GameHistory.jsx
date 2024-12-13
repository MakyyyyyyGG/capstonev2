import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const GameHistory = ({ gameRecord = [], cards }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const scrollBehavior = "inside";
  const [currentPage, setCurrentPage] = useState(1);
  const [viewChart, setViewChart] = useState({});

  const recordsPerPage = 10;

  const paginatedGameRecord = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return gameRecord?.slice(startIndex, endIndex) || [];
  }, [gameRecord, currentPage]);

  const toggleViewChart = (index) => {
    setViewChart((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        className="w-full"
      >
        <Button
          onClick={onOpen}
          variant="outline"
          className="w-full justify-center text-purple-700 bg-white border-4 border-purple-300"
          style={{
            filter: "drop-shadow(4px 4px 0px #7828C8",
          }}
        >
          <History size={20} />
        </Button>
      </motion.div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior={scrollBehavior}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Game History
              </ModalHeader>
              <ModalBody>
                <Card className="shadow-none border-gray-300 w-full rounded-lg bg-white">
                  <CardContent className="p-6">
                    <ScrollArea className="h-[400px] rounded-lg border">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedGameRecord.map((record, index) => (
                            <React.Fragment key={record.id}>
                              <TableRow className="group hover:bg-gray-100">
                                <TableCell>
                                  {new Date(
                                    record.created_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="text-right">
                                  {((record.score / cards) * 100).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100"
                                    onClick={() => toggleViewChart(index)}
                                  >
                                    {viewChart[index]
                                      ? "View Less"
                                      : "View More"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {viewChart[index] && (
                                <TableRow>
                                  <TableCell colSpan={3}>
                                    <ResponsiveContainer
                                      width="100%"
                                      height={300}
                                    >
                                      <LineChart
                                        data={[
                                          {
                                            name: "Score",
                                            score: parseFloat(
                                              (
                                                (record.score / cards) *
                                                100
                                              ).toFixed(2)
                                            ),
                                          },
                                        ]}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip
                                          formatter={(value) => `${value}%`}
                                        />
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
                        Showing {paginatedGameRecord.length} of{" "}
                        {gameRecord?.length || 0} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from(
                          {
                            length: Math.min(
                              Math.ceil(
                                (gameRecord?.length || 0) / recordsPerPage
                              ),
                              5
                            ),
                          },
                          (_, i) => (
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
                          )
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(
                                prev + 1,
                                Math.ceil(
                                  (gameRecord?.length || 0) / recordsPerPage
                                )
                              )
                            )
                          }
                          disabled={
                            currentPage ===
                            Math.ceil(
                              (gameRecord?.length || 0) / recordsPerPage
                            )
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default GameHistory;
