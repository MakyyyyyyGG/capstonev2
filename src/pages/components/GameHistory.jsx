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
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@nextui-org/react";
import { History } from "lucide-react";

const GameHistory = ({ gameRecord, cards }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const scrollBehavior = "inside";
  const [selectedMonthYear, setSelectedMonthYear] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageMonthly, setCurrentPageMonthly] = useState(1);

  const recordsPerPage = 10;

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
      average: (total / count / cards) * 100, // Convert to percentage
      attempts: count,
    }));
  }, [gameRecord, cards]);

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

  const paginatedGameRecord = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredGameRecord.slice(startIndex, endIndex);
  }, [filteredGameRecord, currentPage]);

  const paginatedMonthlyAverages = useMemo(() => {
    const startIndex = (currentPageMonthly - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return monthlyAverages.slice(startIndex, endIndex);
  }, [monthlyAverages, currentPageMonthly]);

  return (
    <div>
      <Button
        isIconOnly
        onPress={onOpen}
        className="bg-[#7469B6] text-white border-0"
      >
        <History size={20} />
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
                    {paginatedGameRecord.map((record) => (
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
                          {((record.score / cards) * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </PaginationPrevious>
                  {Array.from(
                    {
                      length: Math.ceil(
                        filteredGameRecord.length / recordsPerPage
                      ),
                    },
                    (_, i) => (
                      <PaginationItem
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        active={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationItem>
                    )
                  )}
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(filteredGameRecord.length / recordsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(filteredGameRecord.length / recordsPerPage)
                    }
                  >
                    Next
                  </PaginationNext>
                </Pagination>

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
                    {paginatedMonthlyAverages.map(
                      ({ monthYear, average, attempts }) => (
                        <TableRow key={monthYear}>
                          <TableCell>{attempts}</TableCell>
                          <TableCell>
                            {new Date(monthYear).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                            })}
                          </TableCell>
                          <TableCell>{average.toFixed(2)}%</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
                <Pagination>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPageMonthly((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPageMonthly === 1}
                  >
                    Previous
                  </PaginationPrevious>
                  {Array.from(
                    {
                      length: Math.ceil(
                        monthlyAverages.length / recordsPerPage
                      ),
                    },
                    (_, i) => (
                      <PaginationItem
                        key={i + 1}
                        onClick={() => setCurrentPageMonthly(i + 1)}
                        active={currentPageMonthly === i + 1}
                      >
                        {i + 1}
                      </PaginationItem>
                    )
                  )}
                  <PaginationNext
                    onClick={() =>
                      setCurrentPageMonthly((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(monthlyAverages.length / recordsPerPage)
                        )
                      )
                    }
                    disabled={
                      currentPageMonthly ===
                      Math.ceil(monthlyAverages.length / recordsPerPage)
                    }
                  >
                    Next
                  </PaginationNext>
                </Pagination>
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
