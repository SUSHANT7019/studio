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
  ShieldAlert,
  ArrowUpCircle,
  CheckCircle2,
  XCircle
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

  const handlePromote = async (participantId: string, nextLevel: string | null) => {
    const { error } = await supabase
      .from("participants")
      .update({ qualified_for: nextLevel })
      .eq("id", participantId);

    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
      const action = nextLevel ? `Promoted to ${nextLevel}` : "Qualification removed";
      toast({ title: "Updated!", description: action });
      fetchData();
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesLevel = filterLevel === "All" || r.level === filterLevel;
      const matchesName = 
        r.participant_name.toLowerCase().includes(searchName.toLowerCase()) || 
        r.college_name.toLowerCase().includes(searchName.toLowerCase());
      return matchesLevel && matchesName;
    });
  }, [results, filterLevel, searchName]);

  const exportToCSV = () => {
    const headers = ["Participant Name", "College Name", "Level", "Score", "Time Taken (s)", "Qualified For", "Submission Time"];
    const rows = filteredResults.map(r => [
      `"${r.participant_name}"`,
      `"${r.college_name}"`,
      r.level,
      r.score,
      r.time_taken,
      r.qualified_for || "None",
      new Date(r.submission_time).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `techquiz_results.csv`);
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
        <Tabs defaultValue="results" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-white shadow-sm h-12 p-1 border">
              <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Stats</TabsTrigger>
              <TabsTrigger value="questions" className="gap-2"><FileQuestion className="w-4 h-4" /> Questions</TabsTrigger>
              <TabsTrigger value="results" className="gap-2"><Users className="w-4 h-4" /> Results & Promotion</TabsTrigger>
              <TabsTrigger value="rounds" className="gap-2"><Trophy className="w-4 h-4" /> Rounds</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
               <Button onClick={exportToCSV} variant="outline" className="gap-2 bg-white">
                 <Download className="w-4 h-4" /> Export CSV
               </Button>
            </div>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <Card className="border-l-4 border-l-primary shadow-sm">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Participants</CardDescription>
                   <CardTitle className="text-4xl font-black">{results.length}</CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-green-500 shadow-sm">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Qualified Next Round</CardDescription>
                   <CardTitle className="text-4xl font-black">{results.filter(r => r.qualified_for).length}</CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-accent shadow-sm">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase tracking-wider">Bank Questions</CardDescription>
                   <CardTitle className="text-4xl font-black">{questions.length}</CardTitle>
                 </CardHeader>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Question Management</CardTitle>
                  <CardDescription>Configure the technical question bank</CardDescription>
                </div>
                <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsEditing({})} className="gap-2">
                      <Plus className="w-5 h-5" /> Add New Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <DialogHeader><DialogTitle>{isEditing?.id ? "Edit Question" : "New Question"}</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Question Text</label>
                          <Textarea name="question_text" defaultValue={isEditing?.question_text} required placeholder="Question logic..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input name="option_a" defaultValue={isEditing?.option_a} placeholder="Option A" required />
                          <Input name="option_b" defaultValue={isEditing?.option_b} placeholder="Option B" required />
                          <Input name="option_c" defaultValue={isEditing?.option_c} placeholder="Option C" required />
                          <Input name="option_d" defaultValue={isEditing?.option_d} placeholder="Option D" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Select name="correct_answer" defaultValue={isEditing?.correct_answer || "A"}>
                            <SelectTrigger><SelectValue placeholder="Correct Answer" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select name="difficulty_level" defaultValue={isEditing?.difficulty_level || "Basic"}>
                            <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(null)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
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
                        <TableCell className="font-medium line-clamp-1">{q.question_text}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800">{q.correct_answer}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{q.difficulty_level}</Badge></TableCell>
                        <TableCell className="text-right flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setIsEditing(q)}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Results & Promotion Dashboard</CardTitle>
                    <CardDescription>Identify top performers and qualify them for higher levels.</CardDescription>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 font-bold">
                        <TableHead>Participant</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Attempted Level</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead>Current Status</TableHead>
                        <TableHead className="text-right">Promotion Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((r) => (
                        <TableRow key={r.id} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="font-bold">{r.participant_name}</TableCell>
                          <TableCell className="text-muted-foreground">{r.college_name}</TableCell>
                          <TableCell><Badge variant="outline">{r.level}</Badge></TableCell>
                          <TableCell className="text-center font-black text-primary text-lg">{r.score}</TableCell>
                          <TableCell>
                            {r.qualified_for ? (
                              <Badge className="bg-green-600 text-white flex gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Qualified: {r.qualified_for}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">Not Promoted</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {/* Promotion Logic: Basic -> Intermediate, Intermediate -> Hard */}
                              {r.level === 'Basic' && r.qualified_for !== 'Intermediate' && r.qualified_for !== 'Hard' && (
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="gap-1 bg-primary hover:bg-primary/90"
                                  onClick={() => handlePromote(r.id, 'Intermediate')}
                                >
                                  <ArrowUpCircle className="w-4 h-4" /> Qualify for Intermediate
                                </Button>
                              )}
                              {r.level === 'Intermediate' && r.qualified_for !== 'Hard' && (
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="gap-1 bg-accent hover:bg-accent/90"
                                  onClick={() => handlePromote(r.id, 'Hard')}
                                >
                                  <ArrowUpCircle className="w-4 h-4" /> Qualify for Hard
                                </Button>
                              )}
                              {r.qualified_for && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handlePromote(r.id, null)}
                                >
                                  <XCircle className="w-4 h-4" /> Revoke
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            No records found matching filters.
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Active Phases</CardTitle></CardHeader>
                <CardContent>
                   {rounds.map(rd => (
                     <div key={rd.id} className="p-4 border rounded mb-2 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{rd.round_name}</p>
                          <p className="text-xs text-muted-foreground">Level: {rd.level}</p>
                        </div>
                        <Badge>Active</Badge>
                     </div>
                   ))}
                </CardContent></Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
