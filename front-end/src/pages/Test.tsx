// src/pages/Test.tsx
import { useEffect, useState } from "react";
import { useFolders } from "../context/FolderContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatSecondsToHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function estimateMemoryUsageMB(obj: any): number {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json).length;
  // console.log("Estimated memory usage in bytes:", bytes);
  // return bytes / 1024 / 1024; // convert to MB
  return bytes;
}

function Test() {
  const { folders } = useFolders();
  const totalFilesDisplaying = Object.values(folders).reduce((sum, arr) => sum + arr.length, 0);
  // const memoryUsageMB = estimateMemoryUsageMB(folders).toFixed(2);
  const memoryUsageMB = estimateMemoryUsageMB(folders);

  const [dbStats, setDbStats] = useState<{
    totalPrinted: number;
    totalPartsPrinted: number;
    avgPrintTime: string;
    topStudents: { owner: string; count: number }[];
    topClasses: { class: string; count: number }[];
  }>({
    totalPrinted: 0,
    totalPartsPrinted: 0,
    avgPrintTime: "0s",
    topStudents: [],
    topClasses: [],
  });

  useEffect(() => {
    window.electronAPI.getStatsFromDB().then((res) => {
      const seconds = parseFloat(res.avgPrintTime.replace(" sec", "")); // convert from "43200 sec"
      setDbStats({
        ...res,
        avgPrintTime: formatSecondsToHMS(seconds),
      });
      console.log("DB Stats:", res);
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

  const chartOptions = (title: string, xLabel: string, yLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
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
<div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center space-y-8">
  <h2 className="text-4xl font-bold text-blue-700 text-center tracking-wide w-full max-w-6xl">
    📊 3D Print Dashboard
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">


    {/* Left column – 4 stacked metric boxes */}
    <div className="flex flex-col space-y-6 col-span-1">

      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <div className="text-sm text-gray-500 mb-1">🧩 Total Parts Printed</div>
        <div className="text-3xl font-bold text-pink-600">{dbStats.totalPartsPrinted}</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <div className="text-sm text-gray-500 mb-1">✅ Files Printed (Folder C)</div>
        <div className="text-3xl font-bold text-blue-600">{dbStats.totalPrinted}</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <div className="text-sm text-gray-500 mb-1">⏱️ Average Print Time</div>
        <div className="text-3xl font-bold text-orange-500">{dbStats.avgPrintTime}</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <div className="text-sm text-gray-500 mb-1">🟢 Total Files Displayed</div>
        <div className="text-3xl font-bold text-green-600">{totalFilesDisplaying}</div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <div className="text-sm text-gray-500 mb-1">🧠 Memory Used for Metadata</div>
        <div className="text-3xl font-bold text-purple-600">{memoryUsageMB} bytes</div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <div className="text-sm text-gray-500 mb-1">Designed by</div>
        <div className="text-3xl font-bold text-purple-600">Hoan Lam</div>
      </div>

    </div>

    {/* Right column – 2 large charts */}
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex flex-col h-full min-h-[640px] space-y-6">

        <div className="bg-white p-6 rounded-xl shadow-md border flex-1">
          <div className="h-full">
            <Bar
              data={studentChartData}
              options={chartOptions("Top 5 Students", "Student", "Print Count")}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border flex-1">
          <div className="h-full">
            <Bar
              data={classChartData}
              options={chartOptions("Top 5 Classes", "Class", "Print Count")}
            />
          </div>
        </div>

      </div>
    </div>


  </div>
</div>


  );
}

export default Test;
