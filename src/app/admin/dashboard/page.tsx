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
  ShieldAlert,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle
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
  const [dbError, setDbError] = useState<string | null>(null);

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
    setDbError(null);
    
    try {
      const [qsRes, rsRes, rdsRes] = await Promise.all([
        supabase.from("questions").select("*").order("created_at", { ascending: false }),
        supabase.from("participants").select("*").order("submission_time", { ascending: false }),
        supabase.from("rounds").select("*").order("created_at", { ascending: false })
      ]);

      if (qsRes.error) throw qsRes.error;
      if (rsRes.error) throw rsRes.error;
      
      setQuestions(qsRes.data || []);
      setResults(rsRes.data || []);
      setRounds(rdsRes.data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setDbError(error.message);
      if (error.code === '42501') {
        toast({
          title: "RLS Permission Error",
          description: "Row Level Security is blocking your access. Ensure 'authenticated' users have proper SELECT policies.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
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
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      const action = nextLevel ? `Promoted to ${nextLevel}` : "Qualification revoked";
      toast({ title: "Status Updated", description: action });
      fetchData();
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesLevel = filterLevel === "All" || r.level === filterLevel;
      const matchesName = 
        (r.participant_name?.toLowerCase() || "").includes(searchName.toLowerCase()) || 
        (r.college_name?.toLowerCase() || "").includes(searchName.toLowerCase());
      return matchesLevel && matchesName;
    });
  }, [results, filterLevel, searchName]);

  const exportToCSV = () => {
    const headers = ["Participant", "College", "Attempted Level", "Score", "Time (Seconds)", "Qualified For"];
    const rows = filteredResults.map(r => [
      `"${r.participant_name}"`,
      `"${r.college_name}"`,
      r.level,
      r.score,
      r.time_taken,
      r.qualified_for || "None"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quiz_results.csv`);
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
          <h1 className="text-xl font-headline font-bold text-foreground">TechQuiz Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="hidden md:flex gap-1 border-primary/20 text-primary bg-primary/5">
            <CheckCircle2 className="w-3 h-3" /> Secure Admin Session
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-destructive font-bold hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        {dbError && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-bold">Database Fetch Error</p>
              <p className="text-sm opacity-90">{dbError}. Check if Row Level Security (RLS) is configured correctly in Supabase.</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto border-destructive hover:bg-destructive/20">Retry</Button>
          </div>
        )}

        <Tabs defaultValue="results" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList className="bg-white shadow-sm h-12 p-1 border">
              <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" /> Overview</TabsTrigger>
              <TabsTrigger value="questions" className="gap-2"><FileQuestion className="w-4 h-4" /> Questions</TabsTrigger>
              <TabsTrigger value="results" className="gap-2"><Users className="w-4 h-4" /> Participants & Promotion</TabsTrigger>
              <TabsTrigger value="rounds" className="gap-2"><Trophy className="w-4 h-4" /> Rounds</TabsTrigger>
            </TabsList>

            <Button onClick={exportToCSV} variant="outline" className="gap-2 bg-white border-primary/20 text-primary hover:bg-primary/5">
              <Download className="w-4 h-4" /> Export Results (CSV)
            </Button>
          </div>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="border-l-4 border-l-primary shadow-sm">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase">Total Submissions</CardDescription>
                   <CardTitle className="text-4xl font-black">{results.length}</CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-green-500 shadow-sm">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase">Promoted Participants</CardDescription>
                   <CardTitle className="text-4xl font-black">{results.filter(r => r.qualified_for).length}</CardTitle>
                 </CardHeader>
               </Card>
               <Card className="border-l-4 border-l-accent shadow-sm">
                 <CardHeader className="pb-2">
                   <CardDescription className="text-xs font-bold uppercase">Active Questions</CardDescription>
                   <CardTitle className="text-4xl font-black">{questions.length}</CardTitle>
                 </CardHeader>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-6">
                <div>
                  <CardTitle className="text-2xl font-black">Question Bank</CardTitle>
                  <CardDescription>Manage challenge items across all difficulty levels.</CardDescription>
                </div>
                <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsEditing({})} className="gap-2 bg-primary h-11 px-6 font-bold shadow-lg shadow-primary/20">
                      <Plus className="w-5 h-5" /> New Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <DialogHeader><DialogTitle className="text-2xl font-black">{isEditing?.id ? "Update Question" : "Create Question"}</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Question Text</label>
                          <Textarea name="question_text" defaultValue={isEditing?.question_text} required placeholder="Enter the technical question here..." className="min-h-[100px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Option A</label>
                            <Input name="option_a" defaultValue={isEditing?.option_a} placeholder="Option A" required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Option B</label>
                            <Input name="option_b" defaultValue={isEditing?.option_b} placeholder="Option B" required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Option C</label>
                            <Input name="option_c" defaultValue={isEditing?.option_c} placeholder="Option C" required />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Option D</label>
                            <Input name="option_d" defaultValue={isEditing?.option_d} placeholder="Option D" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Correct Answer</label>
                            <Select name="correct_answer" defaultValue={isEditing?.correct_answer || "A"}>
                              <SelectTrigger className="h-11"><SelectValue placeholder="Correct Answer" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                                <SelectItem value="D">D</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold">Difficulty Level</label>
                            <Select name="difficulty_level" defaultValue={isEditing?.difficulty_level || "Basic"}>
                              <SelectTrigger className="h-11"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Basic">Basic</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsEditing(null)} className="font-bold">Cancel</Button>
                        <Button type="submit" className="font-black px-8">Save Question</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="py-4 font-bold">Question Detail</TableHead>
                      <TableHead className="py-4 font-bold">Level</TableHead>
                      <TableHead className="py-4 font-bold text-right pr-6">Management</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">No questions found. Add one to get started.</TableCell>
                      </TableRow>
                    ) : (
                      questions.map((q) => (
                        <TableRow key={q.id} className="hover:bg-primary/5 transition-colors group">
                          <TableCell className="font-medium max-w-md truncate py-4">{q.question_text}</TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={
                              q.difficulty_level === 'Hard' ? 'border-red-200 text-red-700 bg-red-50' : 
                              q.difficulty_level === 'Intermediate' ? 'border-amber-200 text-amber-700 bg-amber-50' : 
                              'border-blue-200 text-blue-700 bg-blue-50'
                            }>{q.difficulty_level}</Badge>
                          </TableCell>
                          <TableCell className="text-right py-4 pr-6">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" onClick={() => setIsEditing(q)} className="h-9 w-9 text-primary hover:bg-primary/10"><Edit className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-white border-b py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-black">Participants & Promotion</CardTitle>
                    <CardDescription>Review performance and qualify participants for the next round.</CardDescription>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-[300px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by name or college..." 
                        className="pl-10 h-10 w-full" 
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                      <SelectTrigger className="w-[140px] h-10"><SelectValue placeholder="All Levels" /></SelectTrigger>
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
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="font-bold py-4">Participant Detail</TableHead>
                      <TableHead className="font-bold py-4">Level</TableHead>
                      <TableHead className="font-bold py-4 text-center">Score</TableHead>
                      <TableHead className="font-bold py-4">Promotion Status</TableHead>
                      <TableHead className="font-bold py-4 text-right pr-6">Promotion Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No matching results found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((r) => (
                        <TableRow key={r.id} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-foreground">{r.participant_name}</span>
                              <span className="text-xs text-muted-foreground font-medium uppercase">{r.college_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4"><Badge variant="outline" className="font-bold">{r.level}</Badge></TableCell>
                          <TableCell className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-black">
                              {r.score}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {r.qualified_for ? (
                              <Badge className="bg-green-600 text-white flex gap-1.5 w-fit border-0 font-bold px-3 py-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> QUALIFIED FOR {r.qualified_for.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-secondary text-muted-foreground border-0 font-bold px-3 py-1 opacity-60">NOT PROMOTED</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4 pr-6">
                            <div className="flex justify-end gap-2">
                              {r.level === 'Basic' && r.qualified_for !== 'Intermediate' && (
                                <Button 
                                  size="sm" 
                                  className="bg-primary hover:bg-primary/90 h-9 font-bold shadow-sm"
                                  onClick={() => handlePromote(r.id, 'Intermediate')}
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5" /> to Intermediate
                                </Button>
                              )}
                              {r.level === 'Intermediate' && r.qualified_for !== 'Hard' && (
                                <Button 
                                  size="sm" 
                                  className="bg-accent hover:bg-accent/90 h-9 font-bold shadow-sm"
                                  onClick={() => handlePromote(r.id, 'Hard')}
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5" /> to Hard
                                </Button>
                              )}
                              {r.qualified_for && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-destructive hover:bg-destructive/10 h-9 font-bold"
                                  onClick={() => handlePromote(r.id, null)}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Revoke
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-white"><CardTitle className="text-xl font-black">Competition Phase Control</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                   <p className="text-sm text-muted-foreground mb-6">Manage the active status and visibility of challenge phases.</p>
                   {rounds.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed rounded-xl border-secondary">
                        <Trophy className="w-12 h-12 text-secondary mx-auto mb-2" />
                        <p className="font-bold text-muted-foreground">No active rounds configured.</p>
                      </div>
                   ) : (
                     rounds.map(rd => (
                       <div key={rd.id} className="p-5 border rounded-xl mb-3 flex justify-between items-center bg-white shadow-sm border-secondary/50 hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black">
                              {rd.level.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-foreground">{rd.round_name}</p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{rd.level} Round</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold px-3">ACTIVE</Badge>
                       </div>
                     ))
                   )}
                </CardContent></Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
