"use client";

import { useState } from "react";
import { Input, Button, Checkbox } from "@nextui-org/react";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";

export default function Component() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordSpecial, setPasswordSpecial] = useState(false);
  const [passwordUpper, setPasswordUpper] = useState(false);
  const [passwordNumber, setPasswordNumber] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    console.log("step", step);
    e.preventDefault();
    if (step === 1) {
      console.log("step 1");
      const userExists = await checkUserExists();
      if (userExists) {
        setStep(step + 1);
      } else {
        toast.error("User not found");
      }
    } else if (step === 2) {
      if (checkAdminPassword()) {
        setStep(step + 1);
      }
    } else if (step === 3) {
      handleResetPassword();
    }
  };

  const checkUserExists = async () => {
    try {
      const res = await fetch(`/api/resetPassword?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      return data.userFound;
    } catch (error) {
      console.log(error);
      toast.error("An error occurred while checking the user.");
      return false;
    }
  };

  const checkAdminPassword = () => {
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return true;
    } else {
      toast.error("Incorrect password");
      return false;
    }
  };

  const checkPasswordsMatch = () => {
    if (newPassword === confirmPassword) {
      return true;
    } else {
      toast.error("Passwords do not match");
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!checkPasswordsMatch()) {
      return;
    }
    toast.promise(
      fetch(`/api/resetPassword?email=${email}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEmail("");
            setNewPassword("");
            setConfirmPassword("");
            setAdminPassword("");
            router.push("/");
          } else {
            toast.error(data.message || "Failed to reset password.");
          }
        }),
      {
        loading: "Resetting password...",
        success: "Password reset successful",
        error: "Failed to reset password",
      }
    );
  };
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    // setPassword(newPassword);

    // Update password conditions
    setPasswordLength(newPassword.length >= 8);
    setPasswordSpecial(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword));
    setPasswordUpper(/[A-Z]/.test(newPassword));
    setPasswordNumber(/\d/.test(newPassword));
  };

  const isFormValid =
    passwordLength &&
    passwordUpper &&
    passwordNumber &&
    passwordSpecial &&
    newPassword === confirmPassword;

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <Toaster />

      {/* Left side with image and tagline */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#6B4DE6] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-4xl font-bold max-w-xl leading-tight mb-4">
            "Empowering your learning journey, one click at a time."
          </h1>
          <p className="text-xl opacity-80">Let's make a difference.</p>
        </div>
        <img
          src="/reset-pw.svg"
          alt="Security illustration"
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
            <circle
              cx="30"
              cy="30"
              r="10"
              fill="currentColor"
              className="animate-pulse"
            />
            <circle
              cx="370"
              cy="370"
              r="10"
              fill="currentColor"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#7828C8]">
              Forgot Password?
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please enter your credentials.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {["First", "Second", "Last"].map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > index
                      ? "bg-[#7828C8] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    step > index ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {index < 2 && (
                  <div className="flex-1 h-[2px] w-12 mx-4 bg-gray-200">
                    <div
                      className={`h-full bg-[#7828C8] transition-all ${
                        step > index + 1 ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Label htmlFor="email">Username</Label>
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
                  type="email"
                  placeholder="Enter Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <label
                  htmlFor="adminPassword"
                  className="block text-sm font-medium mb-2"
                >
                  Admin Password
                </label>
                <div className="relative">
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    size="lg"
                    radius="sm"
                    classNames={{
                      label: "text-white",
                      inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                    }}
                    variant="bordered"
                    color="secondary"
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="newPassword" className="mb-2">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    size="lg"
                    radius="sm"
                    className="mt-2"
                    classNames={{
                      label: "text-white",
                      inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                    }}
                    variant="bordered"
                    color="secondary"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      handlePasswordChange(e);
                    }}
                    required
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="confirmPassword" className="mb-2">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    size="lg"
                    radius="sm"
                    className="mt-2"
                    classNames={{
                      label: "text-white",
                      inputWrapper: "bg-[#ffffff] border-1 border-[#7469B6]",
                    }}
                    variant="bordered"
                    color="secondary"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="w-full rounded-lg flex flex-col  py-2 hover:cursor-default mt-4">
                    <Checkbox
                      size="sm"
                      isSelected={passwordLength}
                      className=" hover:cursor-default"
                    >
                      At least 8 characters long.
                    </Checkbox>
                    <Checkbox
                      size="sm"
                      isSelected={passwordUpper}
                      className=" hover:cursor-default"
                    >
                      Contains uppercase letter.
                    </Checkbox>
                    <Checkbox
                      size="sm"
                      isSelected={passwordNumber}
                      className=" hover:cursor-default"
                    >
                      Contains number.
                    </Checkbox>
                    <Checkbox
                      size="sm"
                      isSelected={passwordSpecial}
                      className=" hover:cursor-default"
                    >
                      Contains special character.
                    </Checkbox>

                    <Checkbox
                      size="sm"
                      isSelected={
                        newPassword &&
                        confirmPassword &&
                        newPassword === confirmPassword
                      }
                      className="hover:cursor-default"
                    >
                      Passwords match.
                    </Checkbox>
                  </div>
                </div>
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
              disabled={step === 3 ? !isFormValid : false}
              onClick={handleSubmit}
            >
              {step === 3 ? "Reset Password" : "Next"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
