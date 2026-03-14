
"use client";

import { useEffect, useState } from "react";
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
import { LayoutDashboard, FileQuestion, Users, Trophy, Download, Plus, Trash2, Edit, LogOut, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<any>(null);

  // Filter states
  const [filterLevel, setFilterLevel] = useState("All");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("admin_auth")) {
      router.push("/admin");
      return;
    }
    fetchData();
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

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", id);
    fetchData();
    toast({ title: "Deleted", description: "Question removed successfully." });
  };

  const handleSaveQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (isEditing) {
      await supabase.from("questions").update(data).eq("id", isEditing.id);
    } else {
      await supabase.from("questions").insert([data]);
    }
    
    setIsEditing(null);
    fetchData();
    toast({ title: "Success", description: "Question saved." });
  };

  const exportToCSV = () => {
    const headers = ["Participant Name", "College Name", "Level", "Score", "Time Taken", "Submission Time"];
    const rows = results.map(r => [
      r.participant_name,
      r.college_name,
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
    link.setAttribute("download", `results_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filteredResults = results.filter(r => {
    const matchesLevel = filterLevel === "All" || r.level === filterLevel;
    const matchesName = r.participant_name.toLowerCase().includes(searchName.toLowerCase()) || 
                      r.college_name.toLowerCase().includes(searchName.toLowerCase());
    return matchesLevel && matchesName;
  });

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className="bg-primary text-white p-4 shadow-md flex justify-between items-center px-8">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          <h1 className="text-xl font-headline font-bold">TechQuiz Ascent Admin</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={() => { sessionStorage.removeItem("admin_auth"); router.push("/admin"); }} className="gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </header>

      <main className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm h-14 p-1">
            <TabsTrigger value="results" className="gap-2 h-full"><Users className="w-4 h-4" /> Quiz Results</TabsTrigger>
            <TabsTrigger value="questions" className="gap-2 h-full"><FileQuestion className="w-4 h-4" /> Manage Questions</TabsTrigger>
            <TabsTrigger value="rounds" className="gap-2 h-full"><Trophy className="w-4 h-4" /> Rounds & Competition</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 h-full"><LayoutDashboard className="w-4 h-4" /> Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attempt Dashboard</CardTitle>
                  <CardDescription>Monitor competition progress in real-time</CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-secondary p-1 rounded-md">
                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                      <SelectTrigger className="w-[150px] bg-white border-0">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Levels</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input 
                    placeholder="Search by name or college..." 
                    className="w-[250px]" 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <Button onClick={exportToCSV} className="gap-2 bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">College</TableHead>
                      <TableHead className="font-bold">Level</TableHead>
                      <TableHead className="font-bold text-center">Score</TableHead>
                      <TableHead className="font-bold">Time Taken</TableHead>
                      <TableHead className="font-bold">Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.participant_name}</TableCell>
                        <TableCell>{r.college_name}</TableCell>
                        <TableCell>
                          <Badge variant={r.level === 'Hard' ? 'destructive' : r.level === 'Intermediate' ? 'default' : 'secondary'}>
                            {r.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg text-primary">{r.score} / 15</TableCell>
                        <TableCell>{r.time_taken}</TableCell>
                        <TableCell>{new Date(r.submission_time).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {filteredResults.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No attempts found matching filters.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>Curate and manage your technical assessment</CardDescription>
                </div>
                <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsEditing({})} className="gap-2">
                      <Plus className="w-4 h-4" /> Add New Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>{isEditing?.id ? "Edit Question" : "Add New Question"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Question Text</label>
                          <Textarea name="question_text" defaultValue={isEditing?.question_text} required placeholder="Enter the technical question..." />
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="w-[400px]">Question</TableHead>
                      <TableHead>Options (A/B/C/D)</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium line-clamp-2 max-w-[400px]">{q.question_text}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {q.option_a} | {q.option_b} | {q.option_c} | {q.option_d}
                        </TableCell>
                        <TableCell className="font-bold text-accent">{q.correct_answer}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{q.difficulty_level}</Badge>
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
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

          <TabsContent value="rounds">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-1 shadow-md">
                <CardHeader>
                  <CardTitle>Create Round</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Round Name</label>
                    <Input placeholder="e.g. Semi-Finals" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Base Level</label>
                    <Select defaultValue="Hard">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-accent">Initialize Round</Button>
                </CardContent>
              </Card>

              <Card className="col-span-2 shadow-md">
                <CardHeader>
                  <CardTitle>Competition Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {rounds.map((round) => (
                      <div key={round.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                        <div>
                          <h4 className="font-bold text-lg">{round.round_name}</h4>
                          <p className="text-sm text-muted-foreground">Level: {round.level}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Manage Participants</Button>
                          <Button size="sm">End Round</Button>
                        </div>
                      </div>
                    ))}
                    {rounds.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">No active rounds created yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <Card className="p-6 flex flex-col items-center justify-center bg-primary text-white shadow-xl">
                 <h4 className="text-sm font-bold opacity-80 uppercase">Total Participants</h4>
                 <p className="text-5xl font-headline font-black mt-2">{results.length}</p>
               </Card>
               <Card className="p-6 flex flex-col items-center justify-center bg-accent text-white shadow-xl">
                 <h4 className="text-sm font-bold opacity-80 uppercase">Average Score</h4>
                 <p className="text-5xl font-headline font-black mt-2">
                  {results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) : 0}
                 </p>
               </Card>
               <Card className="p-6 flex flex-col items-center justify-center bg-white border shadow-xl">
                 <h4 className="text-sm font-bold text-muted-foreground uppercase">Top Performance</h4>
                 <p className="text-5xl font-headline font-black text-foreground mt-2">
                  {results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}
                 </p>
               </Card>
               <Card className="p-6 flex flex-col items-center justify-center bg-white border shadow-xl">
                 <h4 className="text-sm font-bold text-muted-foreground uppercase">Hard Attempts</h4>
                 <p className="text-5xl font-headline font-black text-foreground mt-2">
                  {results.filter(r => r.level === 'Hard').length}
                 </p>
               </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
