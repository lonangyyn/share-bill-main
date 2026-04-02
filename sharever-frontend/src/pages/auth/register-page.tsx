import { Link, useSearchParams } from "react-router-dom";
import { RegisterForm } from "../../features/auth/ui/register-form";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const loginHref = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : "/login";

  return (
    <div>
      <RegisterForm onSuccess={() => (window.location.href = loginHref)} />
      <div className="mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <Link className="text-purple-700 font-semibold" to={loginHref}>
          Login
        </Link>
      </div>
    </div>
  );
}
