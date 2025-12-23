// app/account/reset-password/page.tsx
import ResetPasswordClient from "./reset-password.client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        You must set a new password before continuing.
      </p>

      <div className="mt-6">
        <ResetPasswordClient />
      </div>
    </div>
  );
}
