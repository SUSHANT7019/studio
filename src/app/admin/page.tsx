
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldAlert, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified security for demonstration
    if (password === "admin123") {
      sessionStorage.setItem("admin_auth", "true");
      router.push("/admin/dashboard");
    } else {
      alert("Invalid password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Admin Portal</CardTitle>
          <CardDescription>Secure access restricted to competition staff</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary font-bold">
              Access Dashboard
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4">
          <Button variant="link" onClick={() => router.push("/")} className="text-xs">
            Return to Participant Landing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
