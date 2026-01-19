"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("jassir@gmail.com");
  const [password, setPassword] = useState("1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("https://thajanwar.onrender.com/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
              credentials: 'include', // ✅ include cookies in request/response

        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data)

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Optionally store the token in localStorage or cookies
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminUser", JSON.stringify({ role: data.admin.role , name: data.admin.name, email: data.admin.email}));
       if (data.admin.role==="admin"){
      router.push("/dashboard");
       }
      else if(data.admin.role==="manager"){
      router.push("/categoryManagement");

      }
       else{
      router.push("/orderManagement");
       }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-[400px]">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-1 mb-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Submit"}
            </Button>
          </CardFooter>
        </Card>
        {error && (
          <div className="text-red-600 mt-4 text-center font-semibold">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default Home;
