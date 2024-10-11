// 'use client';

import { AreaChart, Card, List, ListItem } from "@tremor/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const valueFormatter = (number) =>
  `${Intl.NumberFormat("us").format(number).toString()}`;

const statusColor = {
  Score: "bg-blue-500",
};

export default function Example({ gameRecord }) {
  // Prepare data for the AreaChart
  const chartData = gameRecord.map((record) => ({
    date: new Date(record.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    Score: record.score,
  }));

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

  return (
    <>
      <Card className="sm:mx-auto sm:max-w-5xl">
        <h3 className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Game Performance
        </h3>
        <AreaChart
          data={chartData}
          index="date"
          categories={["Score"]}
          colors={["blue"]}
          valueFormatter={valueFormatter}
          showLegend={false}
          showYAxis={true}
          showGradient={false}
          startEndOnly={true}
          className="mt-6 h-32"
        />
        <List className="mt-2">
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
      </Card>
    </>
  );
}
