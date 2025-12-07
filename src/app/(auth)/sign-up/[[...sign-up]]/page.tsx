import { SignUp } from "@clerk/nextjs";

const clerkAppearance = {
  elements: {
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
    footerActionLink: "text-blue-600 hover:text-blue-700",
  },
} as const;

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp appearance={clerkAppearance} routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
