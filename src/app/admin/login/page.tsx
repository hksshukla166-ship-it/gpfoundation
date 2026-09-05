import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
