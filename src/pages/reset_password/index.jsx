import React, { useState } from "react";
import { Button, message, Steps, theme } from "antd";
import { Input } from "@nextui-org/react";
import { useRouter } from "next/router";
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
          type="email"
          label="Username"
          variant="bordered"
          className="text-[#7469b6]"
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
      message.error("An error occurred while checking the user.");
      return false;
    }
  };

  const checkAdminPassword = () => {
    // if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    if (adminPassword === "admin") {
      return true;
    } else {
      message.error("Incorrect password");
      return false;
    }
  };

  const checkPasswordsMatch = () => {
    if (newPassword === confirmPassword) {
      return true;
    } else {
      message.error("Passwords do not match");
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!checkPasswordsMatch()) {
      return;
    }
    try {
      const res = await fetch(`/api/resetPassword?email=${email}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        message.success("Password reset successful");
        setEmail("");
        setNewPassword("");
        setConfirmPassword("");
        setAdminPassword("");
        router.push("/");
      } else {
        message.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.log(error);
      message.error("An error occurred while resetting the password.");
    }
  };

  const handleNextClick = async () => {
    if (current === 0) {
      // Check if the user exists for the first step
      const userExists = await checkUserExists();
      if (userExists) {
        next();
      } else {
        message.error("User not found");
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
      <div className="min-w-[60%] h-screen overflow-hidden  hidden sm:block ">
        <img
          src="noteeee.svg"
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
                {current < steps.length - 1 && (
                  <Button
                    type="secondary"
                    className={`w-[35%] rounded-xl p-6 bg-[#7469b6] text-slate-50 text-base hover:bg-[#473f7e] transition ease-in-out `}
                    onClick={handleNextClick}
                  >
                    Next
                  </Button>
                )}
                {current === steps.length - 1 && (
                  <Button
                    type="secondary"
                    className={`w-[35%] rounded-xl p-6 bg-[#7469b6] text-slate-50 text-base hover:bg-[#473f7e] transition ease-in-out `}
                    onClick={handleResetPassword} // Call handleResetPassword on "Done"
                  >
                    Done
                  </Button>
                )}
                {current > 0 && (
                  <Button
                    type="secondary"
                    className={`w-[35%] rounded-xl p-6 bg-[#7469b6] text-slate-50 text-base hover:bg-[#473f7e] transition ease-in-out `}
                    onClick={() => prev()}
                  >
                    Previous
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
