"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, Award, BrainCircuit, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    level: "Basic",
  });
  const [loading, setLoading] = useState(false);

  const checkEligibility = async () => {
    // Basic level is open to everyone
    if (formData.level === "Basic") return true;

    // To attempt Intermediate or Hard, an admin must have set 'qualified_for' 
    // for this Name + College pair in any of their previous submissions.
    const { data, error } = await supabase
      .from("participants")
      .select("qualified_for")
      .eq("participant_name", formData.name.trim())
      .eq("college_name", formData.college.trim())
      .eq("qualified_for", formData.level);

    if (error) {
      console.error("Eligibility check error:", error);
      return false;
    }

    return data && data.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.college.trim()) return;

    setLoading(true);

    try {
      const isEligible = await checkEligibility();

      if (!isEligible) {
        toast({
          title: "Access Restricted",
          description: `You are not yet qualified for the ${formData.level} level. Please complete the previous rounds or wait for admin approval.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Store participant info for the quiz session
      sessionStorage.setItem("quiz_participant", JSON.stringify({
        ...formData,
        name: formData.name.trim(),
        college: formData.college.trim()
      }));
      
      router.push("/quiz");
    } catch (err) {
      console.error("Submission error:", err);
      toast({
        title: "Connection Error",
        description: "Verify your internet connection and try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">TechQuiz Ascent</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Join the precision technical challenge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your name exactly as registered"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college" className="text-sm font-semibold">College / Organization</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="college"
                  placeholder="Enter your college name"
                  required
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="pl-10 focus-visible:ring-primary"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Select Challenge Level</Label>
                {formData.level !== 'Basic' && (
                  <Badge variant="outline" className="text-[10px] uppercase border-amber-500 text-amber-600 bg-amber-50 gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin Auth Required
                  </Badge>
                )}
              </div>
              <RadioGroup
                value={formData.level}
                onValueChange={(val) => setFormData({ ...formData, level: val })}
                className="grid grid-cols-1 gap-3"
              >
                <Label
                  htmlFor="level-basic"
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${formData.level === 'Basic' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input hover:bg-secondary'}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Basic" id="level-basic" />
                    <div>
                      <div className="font-bold">Basic</div>
                      <div className="text-xs text-muted-foreground">Open Admission • 15 Questions</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${formData.level === 'Basic' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Label>
                <Label
                  htmlFor="level-intermediate"
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${formData.level === 'Intermediate' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input hover:bg-secondary'}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Intermediate" id="level-intermediate" />
                    <div>
                      <div className="font-bold">Intermediate</div>
                      <div className="text-xs text-muted-foreground">Requires Basic Round Qualification</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${formData.level === 'Intermediate' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Label>
                <Label
                  htmlFor="level-hard"
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${formData.level === 'Hard' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input hover:bg-secondary'}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Hard" id="level-hard" />
                    <div>
                      <div className="font-bold">Hard</div>
                      <div className="text-xs text-muted-foreground">Finalist Championship Round</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${formData.level === 'Hard' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Label>
              </RadioGroup>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg rounded-lg shadow-lg transition-transform active:scale-[0.98]"
              disabled={loading || !formData.name || !formData.college}
            >
              {loading ? "Verifying Eligibility..." : "Begin Technical Challenge"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4">
          <p className="text-xs text-muted-foreground font-medium">© 2024 TechQuiz Ascent. Official Precision Platform.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
