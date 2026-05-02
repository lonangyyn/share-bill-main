import { useState } from "react";
import { OtpInput } from "../../features/auth/ui/otp-input";

export default function VerifyPage() {
  const [code, setCode] = useState("");

  return <OtpInput value={code} onChange={setCode} />;
}
