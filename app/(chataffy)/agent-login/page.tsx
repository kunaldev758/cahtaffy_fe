"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAgentApi } from "../../_api/login/action";

export default function AgentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      console.log(email,password,"email pass")
      const res = await loginAgentApi(email.trim(), password.trim())

      if (res.message != "Login successful") {
        setError(res.message || "Login failed");
        return;
      }
      const humanAgent = res.humanAgent;
      if (!humanAgent) {
        setError("Invalid login response");
        return;
      }
      const humanAgentId = humanAgent.id?.toString?.() || humanAgent.id;
      const userId = humanAgent.userId?.toString?.() || humanAgent.userId;
      const currentAgentId = humanAgent.assignedAgents?.[0]?.toString?.() || humanAgent.assignedAgents?.[0] || "";

      localStorage.setItem("token", res.token);
      localStorage.setItem("agent", JSON.stringify({ ...humanAgent, _id: humanAgentId }));
      localStorage.setItem("userId", userId);
      localStorage.setItem("humanAgentId", humanAgentId);
      localStorage.setItem("currentAgentId", currentAgentId);
      router.push("/agent-inbox");
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Agent Login</h2>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-gray-700">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}