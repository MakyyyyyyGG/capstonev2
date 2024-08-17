import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import Link from "next/link";
import { Divider } from "@nextui-org/react";
import { CircleAlert } from "lucide-react";
import { Code, Checkbox, Input, Button, Spinner } from "@nextui-org/react";

function Signup() {
  const domain = process.env.NEXT_PUBLIC_APP_URL;
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordUpper, setPasswordUpper] = useState(false);
  const [passwordNumber, setPasswordNumber] = useState(false);
  const [passwordSpecial, setPasswordSpecial] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
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
      <div className="min-w-[60%] h-screen overflow-hidden  hidden sm:block">
        <img
          src="noteeee.svg"
          alt=""
          className="w-full h-full m-auto object-cover"
        />
      </div>
      <div className="w-full bg-[#f5f5f5]  h-screen">
        <div className="logo absolute top-0">
          <img
            src="logo.svg"
            alt=""
            className="w-[200px] h-[100px] object-cover"
          />
        </div>
        <div className="card flex flex-col justify-center items-center h-full w-full">
          <div className="greet flex flex-col sm:w-6/12 gap-4 ">
            <h1 className="sm:text-5xl font-bold text-[#7469b6]  text-[35px]">
              Sign Up
            </h1>
            <p className="mb-5 text-md">
              Welcome to Liwanag! Please enter your credentials.
            </p>
          </div>
          {message && (
            <Code
              color="danger"
              className={` flex items-center p-4  mb-6 ${
                shake ? "animate-shake" : ""
              }`}
            >
              <CircleAlert strokeWidth={2} color="#dd6565" className="mr-2" />
              {message}
            </Code>
          )}
          <form
            action=""
            autoComplete="off"
            className="flex flex-col gap-2  sm:w-6/12 w-11/12"
            onSubmit={handleSubmit}
          >
            <div className="flex gap-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="font-bold text-[#3b3b3b]">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full mr-2 p-3 rounded-xl border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="font-bold text-[#3b3b3b]">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full p-3 rounded-xl border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
                />
              </div>
            </div>
            <label htmlFor="email" className="font-bold text-[#3b3b3b]">
              Username
            </label>
            <input
              type="text"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter username"
              className="w-full p-3 bg-blue-600 rounded-xl border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
            />
            <label htmlFor="password" className="font-bold text-[#3b3b3b]">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              className="w-full p-3 bg-blue-600 rounded-xl border border-[#7469b6] bg-transparent text-[#7469b6] transition ease relative inline-flex items-center justify-center"
            />
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="w-full rounded-lg flex flex-col  py-2 hover:cursor-default">
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
            </div>
            <Button
              type="submit"
              className={`rounded-xl p-6 bg-[#7469b6] text-slate-50 text-lg hover:bg-[#473f7e] transition ease-in-out ${
                !isFormValid ? "disabled" : ""
              }`}
              disabled={!isFormValid}
              // disabled={
              //   !passwordLength ||
              //   !passwordUpper ||
              //   !passwordNumber ||
              //   !passwordSpecial ||
              //   !captchaVerified
              // }
              // type="submit"
              // className="rounded-xl p-7 bg-[#7469b6] text-slate-50 text-lg hover:bg-[#473f7e] transition ease-in-out "
            >
              {loading ? (
                <Spinner size="md" color="secondary" labelColor="secondary" />
              ) : (
                "Sign Up"
              )}
            </Button>
            <div className="w-full flex justify-center"></div>
            <div className="or flex justify-center items-center">
              {/* <Divider className="sm:w-1/2 w-32" />
              <p className="mx-2 my-4 text-sm">OR</p>
              <Divider className="sm:w-1/2 w-32" /> */}
            </div>
          </form>
          {/* <button
            className="sm:w-6/12  mt-2  w-11/12 p-3 bg-blue-600 rounded-xl border border-[#7469b6] bg-transparent text-slate-700  font-bold hover:bg-[#7469b6] hover:text-white transition ease relative inline-flex items-center justify-center"
            onClick={handleGoogleSignIn}
          >
            <svg
              className="absolute left-4"
              width="30px"
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
            <span className="mx-autofont-bold">Continue with Google</span>
          </button>
          <button
            className="w-11/12 sm:w-6/12 mt-2 p-3 rounded-xl border  bg-[#1f7bf2]  font-bold hover:bg-[#4762b1] text-white transition ease relative inline-flex items-center justify-center"
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
            <span className="mx-auto">Continue with Facebook</span>
          </button> */}
          <div className="footer flex mt-4">
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
