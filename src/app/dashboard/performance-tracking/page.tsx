"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import axios from "axios"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { Book, Clock, Target, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

interface TestResult {
  userId: string
  questions: {
    questionText: string
    userAnswer: string
    correctAnswer: string
    timeSpent: number
  }[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

const PerformanceTracking = () => {
  const [performanceData, setPerformanceData] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [statsData, setStatsData] = useState({
    totalTestsTaken: 0,
    totalQuestionsAttempted: 0,
    totalQuestionsCorrect: 0,
    totalQuestionsWrong: 0,
    avgTimePerTest: 0,
    subjectEfficiency: [] as { subject: string; subsection: string; accuracy: number }[],
  })

  useEffect(() => {
    const fetchPerformanceData = async () => {
      const userId = localStorage.getItem("Medical_User_Id")

      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const [statsResponse, performanceResponse] = await Promise.all([
          axios.get(`https://medical-backend-loj4.onrender.com/api/test/user/${userId}/stats`),
          axios.get<TestResult[]>("https://medical-backend-loj4.onrender.com/api/test/performance", {
            params: { userId },
          }),
        ])

        setStatsData(statsResponse.data)
        setPerformanceData(performanceResponse.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setPerformanceData([])
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  const chartData = {
    labels: performanceData.length > 0 ? performanceData.map((_, index) => `Test ${index + 1}`) : ["No tests taken"],
    datasets: [
      {
        label: "Accuracy Rate",
        data: performanceData.length > 0 ? performanceData.map((item) => item.percentage) : [0],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  }

  // const studyHoursData = {
  //   labels: performanceData.length > 0 ? performanceData.map((_, index) => `Test ${index + 1}`) : ["No tests taken"],
  //   datasets: [
  //     {
  //       label: "Study Hours",
  //       data: performanceData.length > 0 ? performanceData.map((item) => item.totalTime / 60) : [0],
  //       backgroundColor: "rgba(153, 102, 255, 0.6)",
  //       borderColor: "rgba(153, 102, 255, 1)",
  //       borderWidth: 1,
  //     },
  //   ],
  // }

  const progressData = {
    labels: performanceData.length > 0 ? performanceData.map((_, index) => `Test ${index + 1}`) : ["No tests taken"],
    datasets: [
      {
        label: "Overall Progress",
        data: performanceData.length > 0 ? performanceData.map((item) => item.percentage) : [0],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    height: 400,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  // const averageAccuracy =
  //   performanceData.length > 0
  //     ? (performanceData.reduce((sum, item) => sum + item.percentage, 0) / performanceData.length).toFixed(2)
  //     : "0.00"

  const totalStudyHours = performanceData.reduce((sum, item) => sum + item.totalTime, 0) / 60

  const progressRate =
    performanceData.length > 1
      ? (performanceData[performanceData.length - 1].percentage - performanceData[0].percentage).toFixed(2)
      : "0.00"

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Performance Tracking</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <Target className="text-blue-500 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Total Questions</h3>
            <p className="text-2xl font-bold text-blue-600">{statsData.totalQuestionsAttempted}</p>
            <p className="text-sm text-gray-500">
              {statsData.totalQuestionsCorrect} correct / {statsData.totalQuestionsWrong} wrong
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <Clock className="text-green-500 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Total Study Hours</h3>
            <p className="text-2xl font-bold text-green-600">{totalStudyHours.toFixed(2)} hrs</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <TrendingUp className="text-purple-500 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Progress Rate</h3>
            <p className="text-2xl font-bold text-purple-600">{progressRate}%</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <Book className="text-yellow-500 mr-4" size={32} />
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Tests Taken</h3>
            <p className="text-2xl font-bold text-yellow-600">{statsData.totalTestsTaken}</p>
            <p className="text-sm text-gray-500">Avg. {statsData.avgTimePerTest.toFixed(1)} min/test</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Subject Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statsData.subjectEfficiency.map((subject, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-800">{subject.subject}</h3>
              <p className="text-gray-600">{subject.subsection}</p>
              <div className="mt-2 flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${subject.accuracy}%` }} />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">{subject.accuracy.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Tests</h2>
        {performanceData.length === 0 ? (
          <Alert>
            <AlertDescription>
              No tests taken yet. Start taking tests to see your performance data here!
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {performanceData.map((test, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-gray-700">
                        Test {index + 1} - {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-green-500 font-semibold">{test.percentage}% Accuracy</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <p className="text-gray-700">
                        Score: {test.score} / {test.questions.length}
                      </p>
                      <p className="text-gray-700">Total Time: {(test.totalTime / 60).toFixed(2)} hours</p>
                      <h3 className="font-semibold mt-4 mb-2 text-gray-800">Questions:</h3>
                      <ul className="space-y-4">
                        {test.questions.map((q, qIndex) => (
                          <li key={qIndex} className="border-b pb-2">
                            <p className="font-medium text-gray-800">
                              Q{qIndex + 1}: {q.questionText}
                            </p>
                            <p className={q.userAnswer === q.correctAnswer ? "text-green-600" : "text-red-600"}>
                              Your Answer: {q.userAnswer}
                            </p>
                            <p className="text-blue-600">Correct Answer: {q.correctAnswer}</p>
                            <p className="text-gray-600">Time Spent: {q.timeSpent} seconds</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6" style={{ height: "400px" }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Accuracy Rate</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
        {/* <div className="bg-white rounded-lg shadow-md p-6" style={{ height: "400px" }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Study Hours</h2>
          <Bar data={studyHoursData} options={chartOptions} />
        </div> */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8" style={{ height: "400px" }}>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Overall Progress</h2>
          <Line data={progressData} options={chartOptions} />
        </div>
      </div>

    </div>
  )
}

export default PerformanceTracking

