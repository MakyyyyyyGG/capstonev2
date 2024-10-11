import { BarChart, Card, List, ListItem } from "@tremor/react";
import {
  Progress,
  Button,
  Select,
  SelectItem,
  Accordion,
  AccordionItem,
} from "@nextui-org/react";
import {
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowRightLine,
} from "react-icons/ri";
import Router from "next/router";
import { useState } from "react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const valueFormatter = (number) =>
  `${Intl.NumberFormat("us").format(number).toString()}`;

const statusColor = {
  Score: "bg-blue-500",
};

export default function BarChartComponent({ gameRecord, questions }) {
  const [selectedYear, setSelectedYear] = useState("All");

  // Group records by month
  const groupedData = gameRecord.reduce((acc, record) => {
    const date = new Date(record.created_at);
    const monthYear = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      Score: record.score,
    });
    return acc;
  }, {});

  // Prepare data for the BarChart
  const chartData = Object.entries(groupedData).map(([monthYear, scores]) => {
    const totalScore = scores.reduce((sum, score) => sum + score.Score, 0);
    const averageScore = totalScore / scores.length;
    return {
      month: monthYear,
      ...scores.reduce((acc, score, index) => {
        acc[`Score ${index + 1}`] = score.Score;
        return acc;
      }, {}),
      "Average Score": averageScore,
    };
  });

  // Calculate summary
  const totalScore = gameRecord.reduce((sum, record) => sum + record.score, 0);
  const averageScore = totalScore / gameRecord.length;
  const summary = [
    {
      name: "Total Score",
      value: totalScore,
    },
    {
      name: "Average Score",
      value: averageScore,
    },
  ];

  // Determine categories dynamically
  const categories = Object.keys(chartData[0]).filter((key) =>
    key.startsWith("Score")
  );

  // Add "Average Score" to categories
  categories.push("Average Score");

  //compute the percentage change
  const percentageChange = (totalScore / gameRecord.length) * 100;

  // Filter chartData based on selected year
  const filteredChartData =
    selectedYear === "All"
      ? chartData
      : chartData.filter((data) => data.month.includes(selectedYear));

  // Find the highest average score
  const highestAverageScore = Math.max(
    ...filteredChartData.map((data) => data["Average Score"])
  );

  return (
    <>
      <Card className="sm:mx-auto sm:max-w-4xl">
        <h3 className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Game Performance
        </h3>

        <BarChart
          data={filteredChartData}
          index="month"
          categories={categories}
          valueFormatter={valueFormatter}
          showLegend={true}
          yAxisWidth={48}
          className="mt-6 h-72"
        />
        <List className="mt-4">
          {summary.map((item) => (
            <ListItem key={item.name}>
              <div className="flex items-center space-x-2">
                <span
                  className={classNames(statusColor.Score, "h-0.5 w-3")}
                  aria-hidden={true}
                />
                <span>{item.name}</span>
              </div>
              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {valueFormatter(item.value)}
              </span>
            </ListItem>
          ))}
        </List>
        <Accordion variant="splitted">
          <AccordionItem key={1} title="Monthly Average Scores">
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="mb-2 font-medium">Monthly Average Scores</h4>
                <Select
                  placeholder="Select Year"
                  className="max-w-xs"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {[
                    ...new Set(
                      Object.keys(groupedData).map(
                        (monthYear) => monthYear.split(" ")[1]
                      )
                    ),
                  ].map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {filteredChartData.map((data, index) => (
                <div key={index} className="mb-2">
                  <p className="text-sm mb-1">{data.month}</p>
                  <Progress
                    value={data["Average Score"]}
                    maxValue={questions}
                    label={`${data["Average Score"].toFixed(2)} / ${questions}`}
                    className=""
                  />
                </div>
              ))}
            </div>
          </AccordionItem>
        </Accordion>
        <Button onPress={() => Router.push("/homepage")} className="mt-4">
          Back to Dashboard
        </Button>
      </Card>
    </>
  );
}
