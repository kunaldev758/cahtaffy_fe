"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAgentApi } from "../../_api/login/action";
import { dispatchAuthStorageSync } from "@/app/socketContext";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export default function AgentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await loginAgentApi(email.trim(), password.trim())

      if (res.message != "Login successful") {
        const message = res.message || "Login failed";
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }
      const humanAgent = res.humanAgent;
      if (!humanAgent) {
        setError("Invalid login response");
        toast.error("Invalid login response");
        setIsLoading(false);
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
      dispatchAuthStorageSync();
      toast.success("Human agent login successful");
      router.push("/agent-inbox");
    } catch (err) {
      setError("Login failed. Please try again.");
      toast.error("Login failed. Please try again.");
      setIsLoading(false);
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}