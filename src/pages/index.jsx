"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button, Input } from "@nextui-org/react";
import { CircleAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Signup() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const signInResponse = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResponse && !signInResponse.error) {
      setError("");
    } else {
      setError("Invalid email or password");
      console.log(signInResponse.error);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    await signIn("google");
  };

  const handleFacebookSignIn = async () => {
    await signIn("facebook");
  };

  // Redirect to homepage if session is active
  if (status === "authenticated") {
    if (session.user.role == "student") {
      console.log("redirected to student homepage");
      router.push(`/homepage`);
    } else if (session.user.role == "teacher") {
      console.log("redirected to teacher homepage");
      router.push(`/teacher-dashboard`);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Section */}
      <div className="relative hidden lg:block bg-[#6B4DE6] p-12 text-white overflow-hidden ">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold max-w-xl leading-tight mb-4">
            "Empowering your learning journey, one click at a time."
          </h1>
          <p className="text-xl opacity-90">Let's make a difference.</p>
        </div>
        <img
          src="/landing.svg"
          alt="Learning illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full">
          <svg className="w-full h-full opacity-10" viewBox="0 0 400 400">
            <path
              d="M 0 50 C 100 50 100 150 200 150 C 300 150 300 50 400 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Sign In</h2>
            <p className="text-muted-foreground mt-2">
              Welcome back! Please enter your credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-2"
                >
                  Username
                </label>
                <Input
                  size="lg"
                  radius="sm"
                  classNames={{
                    label: "text-white",
                    inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                  }}
                  variant="bordered"
                  color="secondary"
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Username"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    size="lg"
                    radius="sm"
                    classNames={{
                      label: "text-white",
                      inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                    }}
                    variant="bordered"
                    color="secondary"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    required
                  />
                </div>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm flex items-center gap-2">
                <div>
                  <CircleAlert size={16} />
                </div>
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              color="secondary"
              radius="sm"
              className="w-full"
              classNames={{
                label: "text-white",
                inputWrapper: "bg-[#6B4DE6] hover:bg-[#5B3DD6] ",
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <Button
              type="submit"
              size="lg"
              variant="bordered"
              color="secondary"
              radius="sm"
              className="w-full"
              classNames={{
                label: "text-white",
                inputWrapper: "bg-[#6B4DE6] hover:bg-[#5B3DD6] ",
              }}
            >
              Become a Teacher
            </Button>

            <div className="text-center">
              <Link
                href="/reset_password"
                className="text-sm text-[#6B4DE6] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  OR
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                radius="sm"
                variant="bordered"
                className="w-full py-6 border-1"
                type="button"
                onClick={handleGoogleSignIn}
              >
                <svg
                  width="30px" // Adjust size as needed
                  height="30px"
                  viewBox="0 0 32 32"
                  data-name="Layer 1"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M23.75,16A7.7446,7.7446,0,0,1,8.7177,18.6259L4.2849,22.1721A13.244,13.244,0,0,0,29.25,16"
                    fill="#00ac47"
                  />
                  <path
                    d="M23.75,16a7.7387,7.7387,0,0,1-3.2516,6.2987l4.3824,3.5059A13.2042,13.2042,0,0,0,29.25,16"
                    fill="#4285f4"
                  />
                  <path
                    d="M8.25,16a7.698,7.698,0,0,1,.4677-2.6259L4.2849,9.8279a13.177,13.177,0,0,0,0,12.3442l4.4328-3.5462A7.698,7.698,0,0,1,8.25,16Z"
                    fill="#ffba00"
                  />
                  <polygon
                    fill="#2ab2db"
                    points="8.718 13.374 8.718 13.374 8.718 13.374 8.718 13.374"
                  />
                  <path
                    d="M16,8.25a7.699,7.699,0,0,1,4.558,1.4958l4.06-3.7893A13.2152,13.2152,0,0,0,4.2849,9.8279l4.4328,3.5462A7.756,7.756,0,0,1,16,8.25Z"
                    fill="#ea4435"
                  />
                  <polygon
                    fill="#2ab2db"
                    points="8.718 18.626 8.718 18.626 8.718 18.626 8.718 18.626"
                  />
                  <path
                    d="M29.25,15v1L27,19.5H16.5V14H28.25A1,1,0,0,1,29.25,15Z"
                    fill="#4285f4"
                  />
                </svg>
                Continue with Google
              </Button>
              <Button
                radius="sm"
                variant="bordered"
                className="w-full py-6 border-1"
                type="button"
                onClick={handleFacebookSignIn}
              >
                <svg
                  width="30px"
                  height="30px"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                >
                  <path
                    fill="#1877F2"
                    d="M15 8a7 7 0 00-7-7 7 7 0 00-1.094 13.915v-4.892H5.13V8h1.777V6.458c0-1.754 1.045-2.724 2.644-2.724.766 0 1.567.137 1.567.137v1.723h-.883c-.87 0-1.14.54-1.14 1.093V8h1.941l-.31 2.023H9.094v4.892A7.001 7.001 0 0015 8z"
                  />
                  <path
                    fill="#ffffff"
                    d="M10.725 10.023L11.035 8H9.094V6.687c0-.553.27-1.093 1.14-1.093h.883V3.87s-.801-.137-1.567-.137c-1.6 0-2.644.97-2.644 2.724V8H5.13v2.023h1.777v4.892a7.037 7.037 0 002.188 0v-4.892h1.63z"
                  />
                </svg>
                Continue with Facebook
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New to Noted?{" "}
            <Link href="/signup" className="text-[#6B4DE6] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
