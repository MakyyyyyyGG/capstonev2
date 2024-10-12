import React, { useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
} from "@nextui-org/react";

const GameHistory = ({ gameRecord, cards }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const scrollBehavior = "inside";
  const [selectedMonthYear, setSelectedMonthYear] = useState("all");

  const monthlyAverages = useMemo(() => {
    const monthScores = {};
    gameRecord.forEach((record) => {
      const date = new Date(record.created_at);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthScores[monthYear]) {
        monthScores[monthYear] = { total: 0, count: 0 };
      }
      monthScores[monthYear].total += record.score;
      monthScores[monthYear].count += 1;
    });

    return Object.entries(monthScores).map(([monthYear, { total, count }]) => ({
      monthYear,
      average: total / count,
      attempts: count,
    }));
  }, [gameRecord]);

  const monthYearOptions = useMemo(() => {
    const options = new Set(
      gameRecord.map((record) => {
        const date = new Date(record.created_at);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      })
    );
    return Array.from(options).sort((a, b) => b.localeCompare(a));
  }, [gameRecord]);

  const filteredGameRecord = useMemo(() => {
    if (selectedMonthYear === "all") return gameRecord;
    return gameRecord.filter((record) => {
      const date = new Date(record.created_at);
      const recordMonthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      return recordMonthYear === selectedMonthYear;
    });
  }, [gameRecord, selectedMonthYear]);

  return (
    <div>
      <Button onPress={onOpen} color="primary">
        Open History
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="full"
        scrollBehavior={scrollBehavior}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Game History
              </ModalHeader>
              <ModalBody>
                <div className="flex gap-4 mb-4">
                  <Select
                    label="Filter by Month and Year"
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                  >
                    <SelectItem key="all" value="all">
                      All Time
                    </SelectItem>
                    {monthYearOptions.map((monthYear) => (
                      <SelectItem key={monthYear} value={monthYear}>
                        {new Date(monthYear).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <Table isStriped aria-label="Game history table">
                  <TableHeader>
                    <TableColumn>Date</TableColumn>
                    <TableColumn>Score</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {filteredGameRecord.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          {record.score} Points / {cards} Points
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Table
                  isStriped
                  aria-label="Monthly average scores table"
                  bottomContent
                >
                  <TableHeader>
                    <TableColumn>Attempts</TableColumn>
                    <TableColumn>Month</TableColumn>
                    <TableColumn>Average Score</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {monthlyAverages.map(({ monthYear, average, attempts }) => (
                      <TableRow key={monthYear}>
                        <TableCell>{attempts}</TableCell>
                        <TableCell>
                          {new Date(monthYear).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                          })}
                        </TableCell>
                        <TableCell>{average.toFixed(2)} Points</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
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
