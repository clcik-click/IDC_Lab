// src/pages/Test.tsx
import { useEffect, useState } from "react";
import { useFolders } from "../context/FolderContext";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function formatSecondsToHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function estimateMemoryUsageMB(obj: any): number {
  const json  = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json).length;
  return bytes;
}

function Dashboard() {
  const { folders } = useFolders();
  const totalFilesDisplaying = Object.values(folders).reduce((sum, arr) => sum + arr.length, 0);
  const memoryUsageMB = estimateMemoryUsageMB(folders);

  const [dbStats, setDbStats] = useState<{
    totalPrinted: number;
    totalPartsPrinted: number;
    avgPrintTime: string;
    topStudents: { owner: string; count: number }[];
    topClasses: { class: string; count: number }[];
    trendData: { day: string; count: number }[];
  }>({
    totalPrinted: 0,
    totalPartsPrinted: 0,
    avgPrintTime: "0s",
    topStudents: [],
    topClasses: [],
    trendData: [],
  });

  useEffect(() => {
    // result = { 
    //  success:            boolean,
    //  totalPrinted:       number, 
    //  totalPartsPrinted:  number,
    //  avgPrintTime:       string,
    //  topStudents:        { owner: string; count: number }[];
    //  topClasses:         { class: string; count: number }[];
    //  trendData:          { day: string; count: number }[];
    window.electronAPI.getStatsFromDB().then((result) => {
      const seconds = parseFloat(result.avgPrintTime.replace(" sec", "")); // convert from "43200 sec"
      setDbStats({
        ...result,
        avgPrintTime: formatSecondsToHMS(seconds),
      });
      // console.log("DB Stats:", result);
    });
  }, []);

  const studentChartData = {
    labels: dbStats.topStudents.map((s) => s.owner),
    datasets: [
      {
        label: "Prints",
        data: dbStats.topStudents.map((s) => s.count),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const classChartData = {
    labels: dbStats.topClasses.map((c) => c.class),
    datasets: [
      {
        label: "Prints",
        data: dbStats.topClasses.map((c) => c.count),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  const trendChartData = {
    labels: dbStats.trendData.map((d) => d.day),
    datasets: [
      {
        label: "Files Printed",
        data: dbStats.trendData.map((d) => d.count),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const chartOptions = (title: string, xLabel: string, yLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    // animation: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        font: {
          size: 18,
        },
        padding: { top: 10, bottom: 20 },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,     // Show all labels (optional — disable for long lists)
          maxRotation: 45,     // Rotate to vertical
          minRotation: 0,
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: xLabel,
          font: { size: 14 },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yLabel,
          font: { size: 14 },
        },
        ticks: {
          stepSize: 1,
        },
      },
    },
  });


  return (

    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col space-y-10">

        {/* Trend Chart */}
        <div className="w-full h-[400px] bg-white p-6 rounded-xl shadow border border-gray-200">
          <Line
            data={trendChartData}
            options={chartOptions("Daily Files Printed", "Day", "Files Printed")}
          />
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {/* Left Column – Stats */}
          <div className="flex flex-col space-y-4 col-span-1">
            {[
              ["🧩 Total Parts Printed", dbStats.totalPartsPrinted, "text-pink-600"],
              ["✅ Files Printed (Folder C)", dbStats.totalPrinted, "text-blue-600"],
              ["⏱️ Average Print Time", dbStats.avgPrintTime, "text-orange-500"],
              ["🟢 Total Files Displayed", totalFilesDisplaying, "text-green-600"],
              ["🧠 Memory Used for Metadata", `${memoryUsageMB} bytes`, "text-purple-600"],
              ["Designed by", "Hoan Lam", "text-purple-600"],
            ].map(([label, value, color]) => (
              <div
                key={label as string}
                className="bg-white p-4 rounded-xl shadow border border-gray-200 text-center"
              >
                <div className="text-sm text-gray-500 mb-1">{label}</div>
                <div className={`text-2xl font-semibold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Right Column – Charts */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200 h-[300px]">
              <Bar
                data={studentChartData}
                options={chartOptions("Top 5 Students", "Student", "Print Count")}
              />
            </div>
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200 h-[300px]">
              <Bar
                data={classChartData}
                options={chartOptions("Top 5 Classes", "Class", "Print Count")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>


  );
}

export default Dashboard;
