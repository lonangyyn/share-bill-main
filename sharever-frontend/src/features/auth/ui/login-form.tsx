import { useState } from "react";
import { Input } from "../../../shared/ui/input";
import { Button } from "../../../shared/ui/button";
import { useAuth } from "../model/use-auth";
import { useToast } from "../../../shared/ui/toast";
import { normalizeError } from "../../../shared/lib/errors";
import { Link, useSearchParams } from "react-router-dom";

export function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectParam = searchParams.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";
  const registerHref = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : "/register";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.push("Đăng nhập thành công!");
      window.location.href = safeRedirect;
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">
          Login to continue splitting bills with your friends.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button className="w-full mt-2" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="text-xs text-gray-500">
        Don&apos;t have an account?{" "}
        <Link to={registerHref} className="text-purple-600 font-semibold">
          Sign up
        </Link>
      </div>
    </div>
  );
}
