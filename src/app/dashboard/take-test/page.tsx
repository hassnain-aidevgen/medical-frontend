"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import QuestionBox from "./QuestionBox"
import TestSummary from "./TestSummary"
// const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

type Question = {
  id: number
  text: string
  options: string[]
  correctAnswer: string
  explanation?: string, // ✅ Add this line (optional explanation field)
  isExplanationVisible: boolean // ✅ Add this line (required isExplanationVisible field)

}

export default function TakeTest() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "tutor"
  const subjectsParam = searchParams.get("subjects") || ""
  const systemsParam = searchParams.get("systems") || ""
  const countParam = searchParams.get("count") || "10"

  const subjects = subjectsParam ? subjectsParam.split(",") : []
  const systems = systemsParam ? systemsParam.split(",") : []
  const totalQuestions = Math.max(1, Number.parseInt(countParam))
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false); // ✅ Inside function
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(() => {
    const storedAnswers = localStorage.getItem("selectedAnswers");
    return storedAnswers ? JSON.parse(storedAnswers) : {};
  });

  // const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(() => {
  //   const savedAnswers = localStorage.getItem("selectedAnswers");
  //   return savedAnswers ? JSON.parse(savedAnswers) : {};
  // });



  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(mode === "timer" ? totalQuestions * 60 : 0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionTimes, setQuestionTimes] = useState<{ [key: number]: number }>({})
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(Date.now())
  const [explanationsVisible, setExplanationsVisible] = useState<{ [key: number]: boolean }>({})
  const [submittedQuestions, setSubmittedQuestions] = useState<{ [key: number]: boolean }>({});


  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(startTime);
      // const allTopics = [...subjects, ...systems];
      // const queryString = `subjects=${allTopics.map(encodeURIComponent).join(",")}&count=${totalQuestions}`;
      const queryParams = new URLSearchParams({
        subjects: subjects.join(","),
        systems: systems.join(","),
        count: totalQuestions.toString(),
      });

      const url = `http://localhost:5000/api/test/questions?${queryParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const fetchedQuestions = await response.json();
      console.log(fetchQuestions);
      if (fetchedQuestions.length === 0) {
        throw new Error("No questions found for selected topics");
      }

      // Map backend response to frontend structure (keeping older structure intact)
      const mappedQuestions = fetchedQuestions.map((q: { id: string; question: string; options: string; answer: string; explanation?: string }) => ({
        id: q.id,
        text: q.question, // Map backend's "question" to frontend's "text"
        options: q.options,
        correctAnswer: q.answer, // Map backend's "answer" to frontend's "correctAnswer"
        explanation: q.explanation || "", // Ensure explanation is included but does not break existing structure
      }));

      // Shuffle and limit the questions
      const shuffled = mappedQuestions.sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, totalQuestions));
      setStartTime(Date.now());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [subjects, systems, totalQuestions]); // Keeping dependencies unchanged


  const handleFinishTest = useCallback(() => {
    const timeSpent = Math.round((Date.now() - currentQuestionStartTime) / 1000)
    setQuestionTimes(prev => ({ ...prev, [currentQuestion]: timeSpent }))
    const totalTimeSpent = Object.values(questionTimes).reduce((sum, time) => sum + time, 0) + timeSpent
    setShowResults(true)
    setTimeLeft(0)
    return totalTimeSpent
  }, [currentQuestion, currentQuestionStartTime, questionTimes]);

  useEffect(() => {
    fetchQuestions()
  }, [totalQuestions])

  useEffect(() => {
    if (mode === "timer" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (mode === "timer" && timeLeft === 0) {
      handleFinishTest()
    }
  }, [timeLeft, mode, handleFinishTest])

  useEffect(() => {
    setCurrentQuestionStartTime(Date.now())
  }, [currentQuestion])
  // explanations wala kaam yahan se shuru:
  // const handleAnswerSelect = (answer: string) => {
  //   setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: answer })
  // }
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
    console.log("✅ Selected Answer Updated:", { [currentQuestion]: answer });
  };


  const handleNextQuestion = () => {
    if (!selectedAnswers[currentQuestion]) {
      alert("Please select an answer before moving to the next question.");
      return;
    }

    const timeSpent = Math.round((Date.now() - currentQuestionStartTime) / 1000);

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: prev[currentQuestion] || selectedAnswers[currentQuestion],
    }));

    setQuestionTimes((prev) => ({
      ...prev,
      [currentQuestion]: timeSpent,
    }));

    localStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers)); // Store answers

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleFinishTest();
    }
  };


  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.correctAnswer ? 1 : 0)
    }, 0)
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading questions...</div>
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>
  }

  if (questions.length === 0) {
    return <div className="container mx-auto px-4 py-8">No questions available for the selected subjects.</div>
  }

  if (showResults) {
    const totalTimeSpent = Object.values(questionTimes).reduce((sum, time) => sum + time, 0)
    console.log("📌 Selected Answers Before Passing:", selectedAnswers);
    console.log("📌 Passing to TestSummary:", {
      questions,
      selectedAnswers,
      questionTimes,
      totalTimeSpent,
    });
    return (

      <TestSummary
        questions={questions}
        selectedAnswers={selectedAnswers}
        questionTimes={questionTimes}
        score={calculateScore()}
        totalTime={totalTimeSpent}
      />
    )
  }
  const handleSubmit = () => {
    setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion]: true }));
    setIsAnswerSubmitted(true)
  }

  const moveToNextQuestion = () => {
    handleNextQuestion(); // ✅ Calls the original function
    setIsAnswerSubmitted(false);  // ✅ Reset answer submission state

    // 🔥 Preserve previous answers instead of resetting to ""
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: prev[currentQuestion] || selectedAnswers[currentQuestion]
    }));

    setExplanationsVisible({}); // ✅ Hide explanation for the next question
  };


  // explanations wala kaam yahan se shuru:
  const toggleExplanation = (questionIndex: number) => {
    setExplanationsVisible((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex], // Toggle the visibility
    }))
  }
  const currentQuestionData = questions[currentQuestion]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Take Test</h1>
      {mode === "timer" && (
        <div className="mb-4 text-xl">
          Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      )}
      <QuestionBox
        question={currentQuestionData}
        selectedAnswer={selectedAnswers[currentQuestion]}
        onAnswerSelect={handleAnswerSelect}
        questionNumber={currentQuestion + 1}
        totalQuestions={questions.length}
        showCorrectAnswer={mode === "tutor"}
        onSubmit={handleNextQuestion}
        isExplanationVisible={explanationsVisible[currentQuestion] || false}
        toggleExplanation={() => toggleExplanation(currentQuestion)}
        handleSubmit={handleSubmit} // ✅ Add this
        moveToNextQuestion={moveToNextQuestion} // ✅ Add this
        isAnswerSubmitted={isAnswerSubmitted} // ✅ Add this
        isQuestionSubmitted={submittedQuestions[currentQuestion] || false} // ✅ Add this
      />

      <div className="flex justify-end mt-6">
        {/* <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Previous
        </button> */}

        {/* sus code */}
        {/* <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswers[currentQuestion]}
          className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
        </button> */}
      </div>
    </div>
  )
}

