"use client"

import axios from "axios"
import { AlertCircle, BookOpenCheck, CheckCircle, ChevronLeft, MoveRight, Sparkles, Trophy, History, BrainCircuit, Target, XCircle } from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import FlashcardView from "@/app/dashboard/take-test/FlashcardView"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// --- TYPE DEFINITIONS ---
interface ExamType { _id: string; name: string; }
interface SimulationQuestion { _id: string; question: string; options: string[]; answer: string; explanation: string; subject: any; subsection: any; subjectDisplay: string; subsectionDisplay: string; exam_type?: string; difficulty?: 'easy' | 'medium' | 'hard'; flashcardId?: string; topic?: string; }
interface UserAnswer { questionId: string; selectedAnswer: string | null; timeTaken: number; }
interface QuestionAnalytics { totalAttempts: number; avgResponseTime: number; correctPercentage: number; }

// --- INLINED COMPONENT: TargetExamSelector ---
interface TargetExamSelectorProps {
  selectedExam: string
  onExamChange: (exam: string) => void
  examTypes: ExamType[]
}

const TargetExamSelector: React.FC<TargetExamSelectorProps> = ({ selectedExam, onExamChange, examTypes }) => {
  return (
    <div className="bg-slate-50/70 rounded-xl shadow-md p-6 mb-6 border border-slate-200">
      <div className="flex items-center gap-4 mb-5">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-lg text-white">
          <Target className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Target Exam</h2>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="examSelect" className="font-medium text-slate-600">Select the exam you want to simulate:</label>
        <select
          id="examSelect"
          value={selectedExam}
          onChange={(e) => onExamChange(e.target.value)}
          className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-lg transition-all duration-300 ease-in-out hover:border-indigo-400 bg-white"
        >
          <option value="">-- Select an Exam --</option>
          {examTypes.map((exam) => ( <option key={exam._id} value={exam.name}>{exam.name}</option> ))}
        </select>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT: ExamSimulation ---
const LOCAL_API_BASE_URL = "https://medical-backend-3eek.onrender.com";
const PROD_API_BASE_URL = "https://medical-backend-3eek.onrender.com";
const DEFAULT_SIMULATION_CONFIG = { totalQuestions: 10, timePerQuestion: 15 };

const ExamSimulation: React.FC = () => {
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [isSimulationComplete, setIsSimulationComplete] = useState(false);
  const [simulationQuestions, setSimulationQuestions] = useState<SimulationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(DEFAULT_SIMULATION_CONFIG.timePerQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [detailedHistoryView, setDetailedHistoryView] = useState<any | null>(null);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [analytics, setAnalytics] = useState<QuestionAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false);
  const [aiExplanationError, setAiExplanationError] = useState<string | null>(null);
  const [hasAttemptedAiExplanation, setHasAttemptedAiExplanation] = useState(false);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [flashcardIds, setFlashcardIds] = useState<Record<string, string>>({});

  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const fetchQuestionAnalytics = async (questionId: string) => {
    setIsLoadingAnalytics(true); setAnalyticsError(null);
    try {
      const response = await axios.get(`${PROD_API_BASE_URL}/api/test/take-test/question-analytics/${questionId}`);
      setAnalytics(response.data);
    } catch (error) { setAnalyticsError("Failed to load question analytics."); }
    finally { setIsLoadingAnalytics(false); }
  };

  const fetchAiExplanation = async () => {
    const currentQuestion = simulationQuestions[currentQuestionIndex];
    const userAnswer = userAnswers.find(a => a.questionId === currentQuestion._id)?.selectedAnswer;
    if (!hasAttemptedAiExplanation) {
      setIsLoadingAiExplanation(true); setAiExplanationError(null); setAiExplanation(null);
      setHasAttemptedAiExplanation(true);
      try {
        const response = await axios.post(`${PROD_API_BASE_URL}/api/ai-explain/ai-explain`, {
          question: currentQuestion.question, options: currentQuestion.options,
          correctAnswer: currentQuestion.answer, userAnswer: userAnswer || "No answer provided"
        });
        setAiExplanation(response.data.explanation);
      } catch (error) { setAiExplanationError("Failed to load AI explanation."); }
      finally { setIsLoadingAiExplanation(false); }
    }
  };

  useEffect(() => {
    setHasAttemptedAiExplanation(false); setAiExplanation(null); setAiExplanationError(null); setIsExplanationVisible(false);
  }, [currentQuestionIndex]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("Medical_User_Id");
    if (storedUserId) setUserId(storedUserId);
    const fetchExamTypes = async () => {
      try {
        const { data } = await axios.get(`${PROD_API_BASE_URL}/api/test/examtypes`);
        setExamTypes(data);
      } catch (error) { toast.error("Could not load exam types."); }
    };
    fetchExamTypes();
  }, []);

  const fetchSimulationHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${LOCAL_API_BASE_URL}/api/simulation/getSimulationHistory?userId=${userId}`);
      if(data.success) setSimulationHistory(data.data);
    } catch (error) { toast.error("Failed to fetch history"); }
  }, [userId]);

  useEffect(() => { fetchSimulationHistory(); }, [fetchSimulationHistory]);

  const submitSimulation = useCallback(async () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    const correctCount = userAnswers.filter(answer => {
      const question = simulationQuestions.find(q => q._id === answer.questionId);
      return question && question.answer === answer.selectedAnswer;
    }).length;

    const totalTimeSpent = userAnswers.reduce((total, answer) => total + answer.timeTaken, 0);

    try {
      const response = await axios.post(`${LOCAL_API_BASE_URL}/api/simulation/saveSimulationHistory`, {
        userId,
        examName: selectedExam,
        score: correctCount,
        totalQuestions: simulationQuestions.length,
        percentage: Math.round((correctCount / simulationQuestions.length) * 100),
        timeSpent: totalTimeSpent,
        questions: simulationQuestions,
        userAnswers,
      });
      if(response.data.success) {
        setSimulationResults(response.data.data);
        toast.success("Simulation completed and results saved!");
      }
    } catch (error) { toast.error("Could not save simulation results."); }
    setIsSimulationComplete(true);
    setIsSimulationActive(false);
  }, [selectedExam, simulationQuestions, userAnswers, userId]);

  const goToNextQuestion = useCallback(() => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    if (currentQuestionIndex < simulationQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowCorrectAnswer(false);
    } else {
      submitSimulation();
    }
  }, [currentQuestionIndex, simulationQuestions.length, submitSimulation]);

  useEffect(() => {
    setQuestionTimeLeft(DEFAULT_SIMULATION_CONFIG.timePerQuestion);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!isSimulationActive || showCorrectAnswer || questionTimeLeft <= 0) {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      return;
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => prev - 1);
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [questionTimeLeft, isSimulationActive, showCorrectAnswer]);

  useEffect(() => {
    if (questionTimeLeft === 0 && isSimulationActive && !showCorrectAnswer) {
      toast("Time's up!", { icon: '⏰' });
      goToNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTimeLeft, isSimulationActive, showCorrectAnswer]);

  const startSimulation = async () => {
    if (!selectedExam) { toast.error("Please select an exam."); return; }
    setIsLoading(true);
    try {
      const response = await axios.get(`${LOCAL_API_BASE_URL}/api/simulation/questions-fixed`, {
        params: {
          exam_type: selectedExam.replace(/ /g, "_"),
          count: DEFAULT_SIMULATION_CONFIG.totalQuestions,
          _cacheBust: new Date().getTime()
        },
      });
      const fetchedQuestions = response.data;
      if (fetchedQuestions.length === 0) {
        toast.error(`No questions found for ${selectedExam}.`);
        setIsLoading(false); return;
      }

      setSimulationQuestions(fetchedQuestions);
      setUserAnswers(fetchedQuestions.map((q: SimulationQuestion) => ({ questionId: q._id, selectedAnswer: null, timeTaken: 0 })));
      setCurrentQuestionIndex(0);
      setShowCorrectAnswer(false);
      setIsSimulationActive(true);
      setIsSimulationComplete(false);

    } catch (error) { toast.error("Failed to start simulation."); }
    finally { setIsLoading(false); }
  };

  const handleAnswerSelection = (answer: string) => {
    const timeTaken = DEFAULT_SIMULATION_CONFIG.timePerQuestion - questionTimeLeft;
    setUserAnswers(prev => prev.map(ua => ua.questionId === simulationQuestions[currentQuestionIndex]._id ? { ...ua, selectedAnswer: answer, timeTaken } : ua));
  };

  const handleSubmitAnswer = async () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setShowCorrectAnswer(true);

    const currentQuestion = simulationQuestions[currentQuestionIndex];
    const selectedAnswer = userAnswers.find(a => a.questionId === currentQuestion._id)?.selectedAnswer;
    const isCorrect = selectedAnswer === currentQuestion.answer;
    const timeTaken = DEFAULT_SIMULATION_CONFIG.timePerQuestion - questionTimeLeft;

    if (!isCorrect) {
        try {
            const userId = localStorage.getItem("Medical_User_Id");
            if (userId) {
                const response = await axios.post(
                    `${PROD_API_BASE_URL}/api/test/flashcards/add-from-question`,
                    {
                        userId,
                        question: {
                            questionId: currentQuestion._id,
                            questionText: currentQuestion.question,
                            correctAnswer: currentQuestion.answer,
                            userAnswer: selectedAnswer,
                            timeSpent: timeTaken,
                            subject: currentQuestion.subject,
                            subjectName: currentQuestion.subjectDisplay,
                            subsection: currentQuestion.subsection,
                            subsectionName: currentQuestion.subsectionDisplay,
                            exam_type: currentQuestion.exam_type,
                            difficulty: currentQuestion.difficulty,
                            topic: currentQuestion.topic,
                            explanation: currentQuestion.explanation
                        }
                    }
                );

                const flashcardId = response.data.flashcardId;
                if (flashcardId) {
                    setFlashcardIds(prev => ({
                        ...prev,
                        [currentQuestion._id]: flashcardId
                    }));
                }
                toast.success("Added to flashcards for review.");
            }
        } catch (error) {
            console.error("Error processing flashcard:", error);
            toast.error("Could not add question to flashcards.");
        }
    }

    fetchQuestionAnalytics(currentQuestion._id);
    fetchAiExplanation();
    setIsExplanationVisible(true);
  };

  const viewHistoryDetails = async (historyId: string) => {
    try {
        const { data } = await axios.get(`${LOCAL_API_BASE_URL}/api/simulation/getSimulationDetail/${historyId}`);
        if(data.success) setDetailedHistoryView(data.data);
    } catch (error) { toast.error("Could not load history details."); }
  };

  const renderContent = () => {
    if (detailedHistoryView) {
      return (
          <div className="max-w-5xl mx-auto">
              <Button onClick={() => setDetailedHistoryView(null)} className="mb-6 bg-slate-200 text-slate-800 hover:bg-slate-300"><ChevronLeft className="h-4 w-4 mr-2" /> Back to History</Button>
              <div className="text-center mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{detailedHistoryView.examName} - Review</h2>
                  <p className="text-md text-gray-500">Completed on: {new Date(detailedHistoryView.date).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                  <div className="bg-emerald-50 p-5 rounded-xl border-2 border-emerald-200"><h3 className="font-bold text-emerald-800 mb-3 text-lg">Strengths</h3>{detailedHistoryView.stats.strengths.length > 0 ? <ul className="space-y-2 list-inside text-emerald-700">{detailedHistoryView.stats.strengths.map((s:string) => <li key={s} className="flex items-start gap-2"><CheckCircle className="h-5 w-5 mt-0.5 text-emerald-500 flex-shrink-0"/><span>{s}</span></li>)}</ul> : <p className="text-sm text-gray-600">No specific strengths identified.</p>}</div>
                  <div className="bg-rose-50 p-5 rounded-xl border-2 border-rose-200"><h3 className="font-bold text-rose-800 mb-3 text-lg">Areas for Improvement</h3>{detailedHistoryView.stats.weaknesses.length > 0 ? <ul className="space-y-2 list-inside text-rose-700">{detailedHistoryView.stats.weaknesses.map((w:string) => <li key={w} className="flex items-start gap-2"><AlertCircle className="h-5 w-5 mt-0.5 text-rose-500 flex-shrink-0"/><span>{w}</span></li>)}</ul> : <p className="text-sm text-gray-600">No specific weaknesses identified.</p>}</div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 mt-10">Question Breakdown</h3>
              <div className="space-y-4">
                  {detailedHistoryView.questions.map((q: any, index: number) => (
                      <div key={q._id || index} className={`p-5 rounded-xl border-2 ${q.isCorrect ? "border-emerald-300 bg-emerald-50/70" : "border-rose-300 bg-rose-50/70"}`}>
                          <p className="font-semibold text-slate-800">{index + 1}. {q.question}</p>
                          <p className={`text-sm mt-3 font-medium ${q.isCorrect ? "text-emerald-800" : "text-rose-800"}`}>Your Answer: {q.selectedAnswer || "Not Answered"}</p>
                          {!q.isCorrect && <p className="text-sm font-medium text-emerald-800">Correct Answer: {q.correctAnswer}</p>}
                          <p className="text-xs text-gray-500 mt-2">Time taken: {q.timeTaken} seconds</p>
                      </div>
                  ))}
              </div>
          </div>
      )
    }

    if (!isSimulationActive && !isSimulationComplete) {
      return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                  <h1 className="text-3xl font-extrabold text-slate-800">Quick Test</h1>
                  <p className="text-slate-500 mt-1">Start a timed simulation to test your knowledge.</p>
              </div>
              <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="bg-white">
                <History className="h-4 w-4 mr-2" />
                {showHistory ? "Hide History" : "View History"}
              </Button>
            </div>

            <TargetExamSelector selectedExam={selectedExam} onExamChange={setSelectedExam} examTypes={examTypes} />

            <div className="text-center py-8 mt-4">
                <Button
                    onClick={startSimulation}
                    disabled={isLoading || !selectedExam}
                    size="lg"
                    className="text-lg font-bold px-12 py-8 rounded-full shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-all duration-300 ease-in-out hover:scale-105 disabled:scale-100 disabled:bg-slate-400"
                >
                    {isLoading ? "Loading..." : `Start ${selectedExam || "Exam"} Simulation`}
                </Button>
            </div>

            {showHistory && (
               <div className="mt-10 bg-slate-50/70 rounded-xl shadow-md p-6 border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Simulation History</h3>
                  {simulationHistory.length > 0 ? (
                      <div className="overflow-x-auto border rounded-lg">
                          <table className="min-w-full bg-white"><thead className="bg-slate-50"><tr><th className="px-6 py-3 border-b-2 border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th><th className="px-6 py-3 border-b-2 border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Exam</th><th className="px-6 py-3 border-b-2 border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th><th className="px-6 py-3 border-b-2 border-slate-200"></th></tr></thead><tbody className="divide-y divide-slate-200">{simulationHistory.map((entry) => (<tr key={entry._id} className="hover:bg-slate-50"><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{new Date(entry.date).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{entry.examName}</td><td className="px-6 py-4 whitespace-nowrap font-semibold text-sm text-indigo-600">{entry.percentage}%</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><Button variant="ghost" size="sm" onClick={() => viewHistoryDetails(entry._id)} className="text-indigo-600 hover:text-indigo-900">Review</Button></td></tr>))}</tbody></table>
                      </div>
                  ) : <p className="text-gray-500 mt-4 text-center py-8">No simulation history available.</p>}
              </div>
            )}
        </div>
      );
    }

    if (isSimulationComplete && simulationResults) {
      return (
        <div className="flex items-center justify-center">
          <div className="p-8 max-w-4xl mx-auto text-center w-full transform transition-all duration-500 scale-100">
            <Trophy className="mx-auto h-16 w-16 text-amber-400 mb-4" />
            <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Simulation Complete!</h2>
            <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 my-4">{simulationResults.percentage}%</div>
            <p className="text-xl text-gray-700">You answered <span className="font-bold text-slate-800">{simulationResults.score}</span> out of <span className="font-bold text-slate-800">{simulationResults.totalQuestions}</span> questions correctly.</p>
            <p className="text-gray-500 mt-2">Total time spent: {formatTime(simulationResults.timeSpent)}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 text-left">
                <div className="bg-emerald-50 p-5 rounded-xl border-2 border-emerald-200"><h3 className="font-bold text-emerald-800 mb-3 text-lg">Strengths</h3>{simulationResults.stats.strengths.length > 0 ? <ul className="space-y-2 list-inside text-emerald-700">{simulationResults.stats.strengths.map((s:string) => <li key={s} className="flex items-start gap-2"><CheckCircle className="h-5 w-5 mt-0.5 text-emerald-500 flex-shrink-0"/><span>{s}</span></li>)}</ul> : <p className="text-sm text-gray-600">No specific strengths identified.</p>}</div>
                <div className="bg-rose-50 p-5 rounded-xl border-2 border-rose-200"><h3 className="font-bold text-rose-800 mb-3 text-lg">Areas for Improvement</h3>{simulationResults.stats.weaknesses.length > 0 ? <ul className="space-y-2 list-inside text-rose-700">{simulationResults.stats.weaknesses.map((w:string) => <li key={w} className="flex items-start gap-2"><AlertCircle className="h-5 w-5 mt-0.5 text-rose-500 flex-shrink-0"/><span>{w}</span></li>)}</ul> : <p className="text-sm text-gray-600">No specific weaknesses identified.</p>}</div>
            </div>

            <div className="flex justify-center flex-wrap gap-4 mt-8">
                <Button onClick={() => viewHistoryDetails(simulationResults._id)} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Review Answers</Button>
                <Button variant="ghost" onClick={() => { setIsSimulationComplete(false); fetchSimulationHistory(); }} size="lg">Back to Dashboard</Button>
            </div>
          </div>
        </div>
      );
    }

    if(isSimulationActive && simulationQuestions.length > 0) {
      const currentQuestion = simulationQuestions[currentQuestionIndex];
      const selectedAnswer = userAnswers.find(a => a.questionId === currentQuestion._id)?.selectedAnswer;
      const isCorrect = selectedAnswer === currentQuestion.answer;
      const availableFlashcardId = flashcardIds[currentQuestion._id];

      return (
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">{selectedExam} Simulation</h2>
              <div className="flex items-center gap-4">
                  <div className="text-xl font-mono bg-rose-100 text-rose-700 rounded-full h-12 w-12 flex items-center justify-center font-bold shadow-inner">{questionTimeLeft}</div>
              </div>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full mb-8"><div className="h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / simulationQuestions.length) * 100}%` }}></div></div>
          <div className="flex flex-col lg:flex-row gap-8 min-h-[450px]">
            <div className="flex-1">
              <p className="text-xl text-slate-800 leading-relaxed mb-8"><span className="font-bold">{currentQuestionIndex + 1}.</span> {currentQuestion.question}</p>
              <RadioGroup value={selectedAnswer || ""} onValueChange={handleAnswerSelection} disabled={showCorrectAnswer} className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <Label key={index} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${showCorrectAnswer ? (option === currentQuestion.answer ? "border-emerald-500 bg-emerald-50/80 shadow-md" : (option === selectedAnswer ? "border-rose-500 bg-rose-50/80 shadow-md" : "border-slate-200 opacity-60")) : `cursor-pointer ${selectedAnswer === option ? "border-indigo-500 bg-indigo-50/80 shadow-md" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"}`}`}>
                    <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" /><span className="flex-1 text-md">{option}</span>
                    {showCorrectAnswer && option === currentQuestion.answer && <CheckCircle className="h-6 w-6 text-emerald-500" />}
                    {showCorrectAnswer && option !== currentQuestion.answer && option === selectedAnswer && <XCircle className="h-6 w-6 text-rose-500" />}
                  </Label>
                ))}
              </RadioGroup>

              {showCorrectAnswer && !isCorrect && availableFlashcardId && (
                <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="text-amber-800 font-medium">This question is saved to your flashcards for review.</div>
                        <Button onClick={() => setShowFlashcard(true)} variant="outline" className="gap-2 bg-white text-amber-700 border-amber-300 hover:bg-amber-100"><BookOpenCheck className="h-4 w-4" />View Flashcard</Button>
                    </div>
                </div>
              )}

              {showCorrectAnswer && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-lg text-slate-700">Question Analytics</h4>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{isCorrect ? "Correct" : "Incorrect"}</div>
                        </div>
                        <div className="mb-4 pb-4 border-b border-slate-200"><div className="text-sm text-slate-500">Correct Answer:</div><div className="font-semibold text-slate-800 text-md">{currentQuestion.answer}</div></div>
                        {isLoadingAnalytics ? <p>Loading analytics...</p> : analyticsError ? <p className="text-red-500">{analyticsError}</p> : analytics && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div><div className="text-xs text-slate-500">Total Attempts</div><div className="font-bold text-lg text-slate-800">{analytics.totalAttempts}</div></div>
                                <div><div className="text-xs text-slate-500">Correctly Answered</div><div className="font-bold text-lg text-slate-800">{Math.round(analytics.totalAttempts * (analytics.correctPercentage / 100))}</div></div>
                                <div><div className="text-xs text-slate-500">Avg Time</div><div className="font-bold text-lg text-slate-800">{analytics.avgResponseTime.toFixed(1)}s</div></div>
                                <div><div className="text-xs text-slate-500">Success Rate</div><div className="font-bold text-lg text-slate-800">{analytics.correctPercentage.toFixed(1)}%</div></div>
                            </div>
                        )}
                    </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                {!showCorrectAnswer ? (<Button onClick={handleSubmitAnswer} disabled={!selectedAnswer} size="lg" className="px-8 shadow-md">Submit Answer</Button>) : (<Button onClick={goToNextQuestion} size="lg" className="px-8 bg-indigo-600 hover:bg-indigo-700 shadow-md">{currentQuestionIndex === simulationQuestions.length - 1 ? 'Finish Exam' : 'Next Question'}<MoveRight className="h-5 w-5 ml-2" /></Button>)}
              </div>
            </div>
            <div className={`w-full lg:w-[420px] transition-all duration-500 ease-in-out ${isExplanationVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none hidden lg:block"}`}>
                <div className="h-full p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-slate-200">
                    {isLoadingAiExplanation && <div className="text-center p-8">Loading AI explanation...</div>}
                    {aiExplanationError && <div className="text-center p-8 text-rose-500">{aiExplanationError}</div>}
                    {aiExplanation && (
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3"><BrainCircuit className="h-6 w-6 text-purple-600" /><h4 className="font-bold text-lg text-slate-800">AI Explanation</h4></div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">{aiExplanation}</p>
                        </div>
                    )}
                    {currentQuestion.explanation && (
                        <div className="space-y-4 pt-6 border-t border-slate-200/80">
                            <div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-amber-600" /><h4 className="font-bold text-lg text-slate-800">Detailed Explanation</h4></div>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">{currentQuestion.explanation}</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {showFlashcard && availableFlashcardId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
                <FlashcardView
                  flashcardId={availableFlashcardId}
                  onClose={() => setShowFlashcard(false)}
                />
               </div>
            </div>
          )}
        </div>
      );
    }

    return ( <div className="text-center p-8">Loading Simulation...</div> );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
        {renderContent()}
    </div>
  )
}

export default ExamSimulation;