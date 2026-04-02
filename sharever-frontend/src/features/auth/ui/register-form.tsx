import { useState, FormEvent } from "react";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { http } from "../../../shared/api/http";
import { endpoints } from "../../../shared/api/endpoints";

interface RegisterFormProps {
  onSuccess?: () => void; // gọi khi auto-login xong
}

type Step = "request" | "confirm";

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [step, setStep] = useState<Step>("request");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);
      await http.post(endpoints.auth.registerRequest(), { email });
      setStep("confirm");
      setResendMessage(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to request OTP.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code) {
      setError("Please enter the OTP code.");
      return;
    }
    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Backend expects: { email, code, password, name }
      await http.post(endpoints.auth.registerConfirm(), {
        email,
        code,
        password,
        name: fullName,
      });

      // confirm không trả token => login để lấy token
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to confirm registration.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError(null);
    setResendMessage(null);
    setResendLoading(true);
    try {
      await http.post(endpoints.auth.registerResend(), { email });
      setResendMessage("Verification code resent.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to resend OTP.";
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <form
      className="space-y-4 mt-6"
      onSubmit={step === "request" ? handleRequestOtp : handleConfirm}
    >
      {/* Email luôn hiển thị */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Email</label>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || step === "confirm"} // khóa email khi đã request OTP
        />
      </div>

      {step === "confirm" && (
        <>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              OTP code
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Enter the code from email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Did not get the code?</span>
            <button
              type="button"
              className="font-semibold text-purple-600 hover:underline disabled:opacity-60"
              onClick={handleResendOtp}
              disabled={loading || resendLoading || !email}
            >
              {resendLoading ? "Resending..." : "Resend code"}
            </button>
          </div>
          {resendMessage && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {resendMessage}
            </p>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Full name
            </label>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Jimmy Nguyen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              Confirm password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {step === "request" ? (
        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? "Sending code..." : "Send OTP"}
        </Button>
      ) : (
        <div className="space-y-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Confirm & Sign up"}
          </Button>

          <Button
            type="button"
            className="w-full"
            variant="outline"
            disabled={loading}
            onClick={() => {
              setStep("request");
              setCode("");
              setError(null);
              setResendMessage(null);
            }}
          >
            Back
          </Button>
        </div>
      )}
    </form>
  );
}
