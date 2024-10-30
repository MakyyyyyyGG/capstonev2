import React, { useState } from "react";
import { Button, Steps, theme } from "antd";
import { Input } from "@nextui-org/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
const Index = () => {
  // Initialize state variables
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { token } = theme.useToken();
  const router = useRouter();

  const [current, setCurrent] = useState(0);

  // Define the steps after the state initialization
  const steps = [
    {
      title: "First",
      content: (
        <Input
          radius="sm"
          type="email"
          label="Email"
          variant="bordered"
          className="text-[#7469b6] r"
          value={email} // Bind input value to state
          onChange={(e) => setEmail(e.target.value)}
        />
      ),
    },
    {
      title: "Second",
      content: (
        <Input
          type="password"
          label="Admin Password"
          variant="bordered"
          className="text-[#7469b6]"
          value={adminPassword} // Bind input value to state
          onChange={(e) => setAdminPassword(e.target.value)}
        />
      ),
    },
    {
      title: "Last",
      content: (
        <>
          <Input
            type="password"
            label="New Password"
            variant="bordered"
            className="text-[#7469b6]"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              console.log(newPassword);
            }}
          />
          <Input
            type="password"
            label="Confirm Password"
            variant="bordered"
            className="text-[#7469b6] mt-4"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              console.log(newPassword);
            }}
          />
        </>
      ),
    },
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));

  const contentStyle = {
    lineHeight: "260px",
    textAlign: "center",
    color: token.colorTextTertiary,
    marginTop: 16,
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
    if (adminPassword === "admin") {
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
        error: "An error occurred while resetting the password.",
      }
    );
  };

  const handleNextClick = async () => {
    if (current === 0) {
      // Check if the user exists for the first step
      const userExists = await checkUserExists();
      if (userExists) {
        next();
      } else {
        toast.error("User not found");
      }
    } else if (current === 1) {
      // Check if the admin password is correct for the second step
      if (checkAdminPassword()) {
        next();
      }
    }
  };

  return (
    <div className="flex-col min-w-screen min-h-screen bg-[#7469b6] sm:flex sm:flex-row">
      <Toaster />
      <div className="min-w-[60%] h-screen overflow-hidden  hidden sm:block ">
        <img
          src="reset-pw.svg"
          alt=""
          className="w-full  h-full m-auto object-cover"
        />
      </div>
      <div className="w-full bg-[#f5f5f5] h-screen">
        <div className="card flex flex-col justify-center items-center h-full w-full sm:overflow-scroll">
          <div className="greet flex flex-col gap-4 min-w-[80%] sm:w-6/12">
            <h1 className="sm:text-5xl font-bold text-[#7469b6]  text-[35px] ">
              Forgot Password?
            </h1>
            <p className="mb-8 text-md">Please enter your credentials.</p>
          </div>
          <div className="flex flex-col gap-2 min-w-[80%] sm:w-6/12 w-11/12">
            <>
              <Steps current={current} items={items} />
              <div style={contentStyle}>{steps[current].content}</div>
              <div
                className="flex justify-start gap-2"
                style={{ marginTop: 10 }}
              >
                {current > 0 && (
                  <Button
                    radius="lg"
                    type="secondary"
                    className={`font-bold rounded-lg w-[35%] p-6 bg-[#7469b6] text-slate-50 text-base hover:bg-[#473f7e] transition ease-in-out `}
                    onClick={() => prev()}
                  >
                    Previous
                  </Button>
                )}
                {current < steps.length - 1 && (
                  <Button
                    type="secondary"
                    className={`font-bold w-[35%] rounded-lg p-6 bg-[#7469b6] text-slate-50 text-base hover:bg-[#473f7e] transition ease-in-out `}
                    onClick={handleNextClick}
                  >
                    Next
                  </Button>
                )}
                {current === steps.length - 1 && (
                  <Button
                    type="secondary"
                    className={`font-bold w-[35%] rounded-lg p-6 bg-[#7469b6] text-slate-50 text-base hover:bg-[#473f7e] transition ease-in-out `}
                    onClick={handleResetPassword} // Call handleResetPassword on "Done"
                  >
                    Done
                  </Button>
                )}
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
