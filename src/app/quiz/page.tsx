"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, ListChecks } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface Participant {
  name: string;
  college: string;
  level: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function QuizPage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "finished">("loading");
  const [score, setScore] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const timeLeftRef = useRef<number | null>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const SUBMISSION_KEY = (p: Participant) => `quiz_submitted_${p.name}_${p.level}`;
  const STATE_KEY = (p: Participant) => `quiz_state_${p.name}_${p.level}`;

  const getLevelTime = (level: string) => {
    switch (level) {
      case "Basic": return 10 * 60;
      case "Intermediate": return 8 * 60;
      case "Hard": return 5 * 60;
      default: return 10 * 60;
    }
  };

  const submitQuiz = useCallback(async (finalAnswers?: Record<string, string>, forceTime?: number) => {
    if (!participant || status === "finished" || status === "submitting") return;
    
    setStatus("submitting");
    if (timerRef.current) clearInterval(timerRef.current);

    const actualAnswers = finalAnswers || answersRef.current;
    let calculatedScore = 0;
    questions.forEach((q) => {
      if (actualAnswers[q.id] === q.correct_answer) {
        calculatedScore++;
      }
    });

    const currentTimeLeft = forceTime !== undefined ? forceTime : (timeLeftRef.current || 0);
    const timeSpentSeconds = getLevelTime(participant.level) - currentTimeLeft;

    try {
      const { data: pData, error: pError } = await supabase
        .from("participants")
        .insert({
          participant_name: participant.name,
          college_name: participant.college,
          level: participant.level,
          score: calculatedScore,
          total_questions: questions.length,
          time_taken: Math.max(0, Math.floor(timeSpentSeconds)),
          submission_time: new Date().toISOString(),
          quiz_date: new Date().toISOString().split("T")[0],
        })
        .select('id');

      if (pError) throw new Error(pError.message);

      setScore(calculatedScore);
      setStatus("finished");
      localStorage.setItem(SUBMISSION_KEY(participant), "true");
      localStorage.removeItem(STATE_KEY(participant));
      
    } catch (err: any) {
      console.error("Critical submission error:", err);
      toast({ 
        title: "Submission Error", 
        description: err.message || "Something went wrong saving your results.", 
        variant: "destructive" 
      });
      setScore(calculatedScore);
      setStatus("finished");
    }
  }, [participant, questions, status]);

  useEffect(() => {
    const raw = sessionStorage.getItem("quiz_participant");
    if (!raw) {
      router.push("/");
      return;
    }
    const p = JSON.parse(raw);
    setParticipant(p);

    const loadQuestionsAndCheckStatus = async () => {
      const { data: existing, error: checkError } = await supabase
        .from("participants")
        .select("id")
        .eq("participant_name", p.name)
        .eq("college_name", p.college)
        .eq("level", p.level)
        .limit(1);

      if (existing && existing.length > 0) {
        localStorage.setItem(SUBMISSION_KEY(p), "true");
        toast({ title: "Already Attempted", description: "Results for this level are already recorded." });
        router.push("/");
        return;
      } else {
        localStorage.removeItem(SUBMISSION_KEY(p));
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("difficulty_level", p.level);

      if (error || !data || data.length === 0) {
        toast({ title: "Error", description: "Questions not found for this level.", variant: "destructive" });
        router.push("/");
        return;
      }

      const savedState = localStorage.getItem(STATE_KEY(p));
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setQuestions(parsed.questions);
        setAnswers(parsed.answers);
        setTimeLeft(parsed.timeLeft);
        setCurrentIdx(parsed.currentIdx);
      } else {
        const shuffled = shuffleArray(data);
        const selected = shuffled.slice(0, 15);
        setQuestions(selected);
        setTimeLeft(getLevelTime(p.level));
      }
      setStatus("ready");
    };

    loadQuestionsAndCheckStatus();
  }, [router]);

  useEffect(() => {
    if (status !== "ready" || timeLeft === null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          submitQuiz(undefined, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, submitQuiz]);

  useEffect(() => {
    if (participant && questions.length > 0 && status === "ready") {
      localStorage.setItem(STATE_KEY(participant), JSON.stringify({
        questions,
        answers,
        timeLeft,
        currentIdx
      }));
    }
  }, [answers, timeLeft, currentIdx, questions, participant, status]);

  const handleAnswerSelect = (val: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentIdx].id]: val }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-headline font-semibold text-primary">Setting up the quiz...</p>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg text-center p-8 shadow-2xl">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-4xl font-headline font-extrabold text-foreground mb-2">Quiz Finished!</CardTitle>
          <p className="text-muted-foreground mb-8 text-lg">Thank you, {participant?.name}. Your results have been submitted.</p>
          <div className="bg-primary/5 rounded-2xl p-8 mb-8 border-2 border-primary/10">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Your Result</p>
            <p className="text-7xl font-headline font-black text-primary">{score} <span className="text-3xl font-medium text-muted-foreground">/ {questions.length}</span></p>
          </div>
          <Button onClick={() => router.push("/")} className="w-full h-12 font-bold text-lg">Return to Landing</Button>
        </Card>
      </div>
    );
  }

  const q = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  if (!q) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-headline font-bold text-primary">TechQuiz Ascent</h1>
          <p className="text-xs text-muted-foreground">{participant?.name} • {participant?.college}</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors ${timeLeft && timeLeft < 60 ? 'bg-destructive/10 border-destructive text-destructive animate-pulse' : 'bg-primary/5 border-primary/20 text-primary'}`}>
            <label className="text-xs font-bold uppercase hidden md:inline">Time Left</label>
            <Timer className="w-5 h-5" />
            <span className="font-mono text-xl font-bold">{timeLeft !== null ? formatTime(timeLeft) : "00:00"}</span>
          </div>
          <Button 
            variant="default" 
            onClick={() => {
              if (confirm("Submit your answers now?")) submitQuiz();
            }}
            disabled={status === "submitting"}
            className="font-bold bg-accent hover:bg-accent/90 text-white"
          >
            Submit
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Question Area */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-muted-foreground">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Progress</span>
              </div>
              <Progress value={progress} className="h-2 bg-secondary" />
            </div>

            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-headline leading-relaxed text-foreground">
                  {q.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <RadioGroup 
                  value={answers[q.id] || ""} 
                  onValueChange={handleAnswerSelect}
                  className="grid gap-4"
                >
                  {[
                    { id: "A", label: q.option_a },
                    { id: "B", label: q.option_b },
                    { id: "C", label: q.option_c },
                    { id: "D", label: q.option_d },
                  ].map((opt) => (
                    <Label
                      key={opt.id}
                      htmlFor={`option-${opt.id}`}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 ${answers[q.id] === opt.id ? 'border-primary bg-primary/5 shadow-md' : 'border-secondary'}`}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <RadioGroupItem value={opt.id} id={`option-${opt.id}`} className="sr-only" />
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${answers[q.id] === opt.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                          {opt.id}
                        </span>
                        <span className="text-lg font-medium">{opt.label}</span>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="gap-2 h-12 px-6 font-bold"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                
                <Button 
                  onClick={() => {
                    if (currentIdx === questions.length - 1) {
                      if (confirm("This is the last question. Submit now?")) submitQuiz();
                    } else {
                      setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1));
                    }
                  }}
                  className="gap-2 h-12 px-6 font-bold bg-primary"
                >
                  {currentIdx === questions.length - 1 ? "Finalize" : "Next Question"} <ChevronRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Sidebar - Question Navigator */}
          <aside className="w-full md:w-80">
            <div className="sticky top-28 space-y-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-primary py-3 flex flex-row items-center gap-2">
                  <ListChecks className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white uppercase tracking-tight">Question Navigator</span>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-5 gap-2.5">
                    {questions.map((ques, idx) => {
                      const isAnswered = !!answers[ques.id];
                      const isCurrent = idx === currentIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentIdx(idx)}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border-2",
                            isCurrent ? "border-primary bg-primary text-white scale-110 z-10 shadow-lg shadow-primary/20" :
                            isAnswered ? "border-green-500 bg-green-50 text-green-700" :
                            "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300"
                          )}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legend</p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-primary shadow-sm shadow-primary/20"></div>
                        <span className="text-xs font-bold text-slate-600">Active Item</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-green-500 shadow-sm shadow-green-200"></div>
                        <span className="text-xs font-bold text-slate-600">Answered</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-md bg-slate-100 border border-slate-200"></div>
                        <span className="text-xs font-bold text-slate-400">Not Visited</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700 leading-normal">
                  <b>Heads up!</b> Navigating between questions is allowed. Your progress is saved automatically. Make sure to submit before the timer runs out.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {status === "submitting" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold text-foreground">Finalizing Submission...</h3>
            <p className="text-sm text-muted-foreground font-medium">Please wait while your results are secured.</p>
          </div>
        </div>
      )}
    </div>
  );
}
