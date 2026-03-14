
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, Award, BrainCircuit } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    level: "Basic",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.college) return;

    setLoading(true);
    // Persist basic info in session storage for the quiz page
    sessionStorage.setItem("quiz_participant", JSON.stringify(formData));
    router.push("/quiz");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">TechQuiz Ascent</CardTitle>
          <CardDescription className="text-muted-foreground">
            Precision competition. Ready to prove your skills?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Participant Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college" className="text-sm font-semibold">College Name</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="college"
                  placeholder="Enter your college/university"
                  required
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="pl-10 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Difficulty Level</Label>
              <RadioGroup
                value={formData.level}
                onValueChange={(val) => setFormData({ ...formData, level: val })}
                className="grid grid-cols-1 gap-3"
              >
                <Label
                  htmlFor="level-basic"
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-secondary ${formData.level === 'Basic' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input'}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Basic" id="level-basic" />
                    <div>
                      <div className="font-bold">Basic</div>
                      <div className="text-xs text-muted-foreground">15 Questions • 10 Minutes</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${formData.level === 'Basic' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Label>
                <Label
                  htmlFor="level-intermediate"
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-secondary ${formData.level === 'Intermediate' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input'}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Intermediate" id="level-intermediate" />
                    <div>
                      <div className="font-bold">Intermediate</div>
                      <div className="text-xs text-muted-foreground">15 Questions • 8 Minutes</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${formData.level === 'Intermediate' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Label>
                <Label
                  htmlFor="level-hard"
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-secondary ${formData.level === 'Hard' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input'}`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="Hard" id="level-hard" />
                    <div>
                      <div className="font-bold">Hard</div>
                      <div className="text-xs text-muted-foreground">15 Questions • 5 Minutes</div>
                    </div>
                  </div>
                  <Award className={`w-5 h-5 ${formData.level === 'Hard' ? 'text-primary' : 'text-muted-foreground'}`} />
                </Label>
              </RadioGroup>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg rounded-lg shadow-lg"
              disabled={loading || !formData.name || !formData.college}
            >
              {loading ? "Initializing..." : "Start Quiz"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4">
          <p className="text-xs text-muted-foreground font-medium">© 2024 TechQuiz Ascent. Official Technical Competition.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
