import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import Link from "next/link";
import { Divider } from "@nextui-org/react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Code, Checkbox, Input, Button, Spinner } from "@nextui-org/react";

function Signup() {
  const domain = process.env.NEXT_PUBLIC_APP_URL;
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordUpper, setPasswordUpper] = useState(false);
  const [passwordNumber, setPasswordNumber] = useState(false);
  const [passwordSpecial, setPasswordSpecial] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleFacebookSignIn = async () => {
    await signIn("facebook");
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    if (!email) {
      setMessage("Email is required");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setMessage(""), 2000);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setMessage(""), 2000);
      setLoading(false);
      return;
    }

    const postData = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: password.trim(),
        user_role: "student",
      }),
    };

    try {
      const res = await fetch(`/api/signup`, postData);
      const data = await res.json();

      if (res.status === 409) {
        Swal.fire({
          title: "Error!",
          text: "User already exists",
          icon: "error",
        });
      } else if (res.ok) {
        Swal.fire({
          title: "Success!",
          text: "Account created successfully",
          icon: "success",
        });
        router.push("/");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        Swal.fire({
          title: "Error!",
          text: data.error || "Failed to create account",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  // Function to handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    await signIn("google");
  };

  // Function to evaluate password strength
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Update password conditions
    setPasswordLength(newPassword.length >= 8);
    setPasswordSpecial(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword));
    setPasswordUpper(/[A-Z]/.test(newPassword));
    setPasswordNumber(/\d/.test(newPassword));
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
  const isFormValid =
    passwordLength && passwordUpper && passwordNumber && passwordSpecial;

  return (
    <div className="flex-col min-w-screen min-h-screen bg-[#7469b6] sm:flex sm:flex-row">
      <div className="sticky top-0 min-w-[60%] h-screen overflow-hidden  hidden sm:block">
        <img
          src="signup.svg"
          alt=""
          className="w-full h-full m-auto object-cover"
        />
      </div>
      <div className="w-full py-7 bg-[#f5f5f5] overflow-auto">
        {/* <div className="logo absolute top-0">
          <img
            src="logo.svg"
            alt=""
            className="w-[200px] h-[100px] object-cover"
          />
        </div> */}
        <div className="card flex flex-col justify-center items-center h-full w-full">
          <div className="greet  flex flex-col min-w-[80%] sm:w-6/12 gap-4   mb-6">
            <h1 className="sm:text-5xl font-bold text-[#7469b6] text-[35px] text-left">
              Sign Up
            </h1>
            <p className="mb-5 text-md text-left">
              Welcome to Liwanag! Please enter your credentials.
            </p>
          </div>
          {message && (
            <Code
              color="danger"
              className={` flex items-center p-4  mb-6 ease-in-out ${
                shake ? "animate-shake" : ""
              } animate-fade`}
            >
              <CircleAlert strokeWidth={2} color="#dd6565" className="mr-2" />
              {message}
            </Code>
          )}
          <form
            action=""
            autoComplete="off"
            className="flex flex-col gap-2 min-w-[80%] sm:w-6/12 w-11/12"
            onSubmit={handleSubmit}
          >
            <div className="flex justify-between gap-6 mb-6">
              <div className="flex flex-col w-full gap-2">
                <label htmlFor="firstName" className="font-bold text-[#3b3b3b]">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full mr-2 p-3 rounded-lg border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
                />
              </div>
              <div className="flex flex-col w-full gap-2">
                <label htmlFor="lastName" className="font-bold text-[#3b3b3b]">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full p-3 rounded-lg border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
                />
              </div>
            </div>
            <div className="mb-6 flex flex-col gap-2">
              <label htmlFor="email" className="font-bold text-[#3b3b3b]">
                Username
              </label>
              <input
                required
                type="text"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter username"
                className="w-full p-3 bg-blue-600 rounded-lg border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
              />
            </div>

            <label htmlFor="password" className="font-bold text-[#3b3b3b]">
              Password (8 characters minimum)
            </label>
            <div className="relative w-full">
              <input
                required
                type={passwordVisible ? "text" : "password"}
                name="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                className="w-full p-3 bg-blue-600 rounded-lg border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? (
                  <EyeOff className="text-[#7469b6]" />
                ) : (
                  <Eye className="text-[#7469b6]" />
                )}
              </div>
            </div>

            <label
              htmlFor="confirmPassword"
              className="font-bold text-[#3b3b3b]"
            >
              Confirm Password
            </label>
            <div className="relative w-full">
              <input
                required
                type={confirmPasswordVisible ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full p-3 bg-blue-600 rounded-lg border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                {confirmPasswordVisible ? (
                  <EyeOff className="text-[#7469b6]" />
                ) : (
                  <Eye className="text-[#7469b6]" />
                )}
              </div>
            </div>
            <div className="mt-6 w-full">
              {loading ? (
                <Button
                  isDisabled
                  isLoading
                  type="submit"
                  className={`w-full font-bold rounded-lg p-6 text-slate-50 bg-violet-600 hover:bg-violet-700 transition ease-in-out ${
                    !isFormValid ? "disabled" : ""
                  }`}
                  disabled={!passwordLength}
                >
                  Sign Up
                </Button>
              ) : (
                <Button
                  type="submit"
                  className={`w-full font-bold rounded-lg p-6  text-slate-50 text-lg bg-violet-600 hover:bg-violet-700 transition ease-in-out ${
                    !isFormValid ? "disabled" : ""
                  }`}
                  disabled={!passwordLength}
                >
                  Sign Up
                </Button>
              )}
            </div>
            <div className="w-full flex justify-center"></div>
            <div className="or flex justify-center items-center"></div>
          </form>
          <div className="min-w-[80%] footer flex justify-left mt-2">
            <p>Already have an account? </p>
            <Link href="/" className="ml-1 text-[#7469b6] font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
