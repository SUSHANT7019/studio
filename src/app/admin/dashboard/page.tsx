"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, 
  FileQuestion, 
  Users, 
  Trophy, 
  Download, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  Search, 
  Filter,
  ShieldAlert 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  // Filter states
  const [filterLevel, setFilterLevel] = useState("All");
  const [searchName, setSearchName] = useState("");
  const [scoreFilter, setScoreFilter] = useState("All");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (!activeSession) {
        router.push("/admin");
        return;
      }
      setSession(activeSession);
      fetchData();
    };
    checkAuth();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const { data: qs } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
    const { data: rs } = await supabase.from("participants").select("*").order("submission_time", { ascending: false });
    const { data: rds } = await supabase.from("rounds").select("*").order("created_at", { ascending: false });
    
    setQuestions(qs || []);
    setResults(rs || []);
    setRounds(rds || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin");
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question permanently?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchData();
      toast({ title: "Deleted", description: "Question removed successfully." });
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (isEditing?.id) {
      const { error } = await supabase.from("questions").update(data).eq("id", isEditing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("questions").insert([data]);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    
    setIsEditing(null);
    fetchData();
    toast({ title: "Success", description: "Question bank updated." });
  };

  const formatTimeTaken = (seconds: any) => {
    if (typeof seconds !== 'number') return "N/A";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesLevel = filterLevel === "All" || r.level === filterLevel;
      const matchesName = 
        r.participant_name.toLowerCase().includes(searchName.toLowerCase()) || 
        r.college_name.toLowerCase().includes(searchName.toLowerCase());
      
      let matchesScore = true;
      if (scoreFilter === "High") matchesScore = r.score >= 12;
      if (scoreFilter === "Medium") matchesScore = r.score >= 7 && r.score < 12;
      if (scoreFilter === "Low") matchesScore = r.score < 7;

      return matchesLevel && matchesName && matchesScore;
    });
  }, [results, filterLevel, searchName, scoreFilter]);

  const exportToCSV = () => {
    const headers = ["Participant Name", "College Name", "Level", "Score", "Time Taken (s)", "Submission Time"];
    const rows = filteredResults.map(r => [
      `"${r.participant_name}"`,
      `"${r.college_name}"`,
      r.level,
      r.score,
      r.time_taken,
      new Date(r.submission_time).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `techquiz_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-20 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold text-foreground">TechQuiz Admin</h1>
            <p className="text-xs text-muted-foreground font-medium">{session.user.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-white shadow-sm h-12 p-1 border">
              <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="questions" className="gap-2"><FileQuestion className="w-4 h-4" /> Questions</TabsTrigger>
              <TabsTrigger value="results" className="gap-2"><Users className="w-4 h-4" /> Results</TabsTrigger>
              <TabsTrigger value="rounds" className="gap-2"><Trophy className="w-4 h-4" /> Rounds</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
               <Button onClick={exportToCSV} variant="outline" className="gap-2 bg-white">
                 <Download className="w-4 h-4" /> Export Results
               </Button>
            </div>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Participants</CardDescription>
                   <CardTitle className="text-4xl font-black">{results.length}</CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Avg. Score</CardDescription>
                   <CardTitle className="text-4xl font-black">
                    {results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) : 0}
                   </CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Bank Size</CardDescription>
                   <CardTitle className="text-4xl font-black">{questions.length}</CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Hard Attempts</CardDescription>
                   <CardTitle className="text-4xl font-black">{results.filter(r => r.level === 'Hard').length}</CardTitle>
                 </CardHeader>
               </Card>
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest participant submissions across all levels</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(0, 5).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.participant_name}</TableCell>
                        <TableCell><Badge variant="outline">{r.level}</Badge></TableCell>
                        <TableCell className="font-bold text-primary">{r.score} / 15</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(r.submission_time).toLocaleTimeString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Question Management</CardTitle>
                  <CardDescription>Configure the technical question bank</CardDescription>
                </div>
                <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsEditing({})} className="gap-2 h-11 px-6">
                      <Plus className="w-5 h-5" /> Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>{isEditing?.id ? "Edit Technical Question" : "New Technical Question"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Question Text</label>
                          <Textarea name="question_text" defaultValue={isEditing?.question_text} required placeholder="Enter the technical question logic..." className="min-h-[100px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Option A</label>
                            <Input name="option_a" defaultValue={isEditing?.option_a} required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Option B</label>
                            <Input name="option_b" defaultValue={isEditing?.option_b} required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Option C</label>
                            <Input name="option_c" defaultValue={isEditing?.option_c} required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Option D</label>
                            <Input name="option_d" defaultValue={isEditing?.option_d} required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Correct Answer</label>
                            <Select name="correct_answer" defaultValue={isEditing?.correct_answer || "A"}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Option A</SelectItem>
                                <SelectItem value="B">Option B</SelectItem>
                                <SelectItem value="C">Option C</SelectItem>
                                <SelectItem value="D">Option D</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Difficulty Level</label>
                            <Select name="difficulty_level" defaultValue={isEditing?.difficulty_level || "Basic"}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Basic">Basic</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(null)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="w-[450px]">Question</TableHead>
                        <TableHead>Correct</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium">
                            <p className="line-clamp-2">{q.question_text}</p>
                          </TableCell>
                          <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{q.correct_answer}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{q.difficulty_level}</Badge></TableCell>
                          <TableCell className="text-right flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setIsEditing(q)}><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Competition Results</CardTitle>
                    <CardDescription>Real-time participant leaderboard and metrics</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search name/college..." 
                        className="pl-10 w-[240px]" 
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                      <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Levels</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                      <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Score" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Scores</SelectItem>
                        <SelectItem value="High">12+ (High)</SelectItem>
                        <SelectItem value="Medium">7-11 (Medium)</SelectItem>
                        <SelectItem value="Low">{"< 7"} (Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>Participant</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Time Taken</TableHead>
                        <TableHead>Submission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((r) => (
                        <TableRow key={r.id} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="font-bold">{r.participant_name}</TableCell>
                          <TableCell className="text-muted-foreground">{r.college_name}</TableCell>
                          <TableCell><Badge variant="outline">{r.level}</Badge></TableCell>
                          <TableCell className="text-center font-black text-primary text-lg">{r.score}</TableCell>
                          <TableCell>{formatTimeTaken(r.time_taken)}</TableCell>
                          <TableCell className="text-xs">{new Date(r.submission_time).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {filteredResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Filter className="w-8 h-8 opacity-20" />
                              <p>No records found matching your current filters.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-1 shadow-md border-t-4 border-t-accent">
                <CardHeader><CardTitle>Initialize Round</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Round Name</label>
                    <Input placeholder="e.g. Finals 2024" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Target Level</label>
                    <Select defaultValue="Hard">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-accent hover:bg-accent/90">Create Competition Phase</Button>
                </CardContent>
              </Card>

              <Card className="col-span-2 shadow-md">
                <CardHeader><CardTitle>Active Competition Phases</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {rounds.map((round) => (
                      <div key={round.id} className="p-5 border rounded-xl flex justify-between items-center bg-white hover:border-primary/50 transition-colors shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-full"><Trophy className="text-primary w-5 h-5" /></div>
                          <div>
                            <h4 className="font-bold text-lg">{round.round_name}</h4>
                            <p className="text-sm text-muted-foreground">Difficulty: {round.level}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Analytics</Button>
                          <Button size="sm" variant="destructive">End Phase</Button>
                        </div>
                      </div>
                    ))}
                    {rounds.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-secondary/20">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No competition rounds are currently active.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
