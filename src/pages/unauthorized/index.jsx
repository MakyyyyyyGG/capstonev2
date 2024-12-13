import React from "react";
import { Button } from "@nextui-org/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const index = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div
        className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg border-4 border-purple-300"
        style={{ filter: "drop-shadow(4px 4px 0px #7828C8)" }}
      >
        <h1 className="text-4xl font-bold text-purple-700">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 text-center max-w-md">
          Sorry, you don't have permission to access this page. Please contact
          your administrator if you believe this is a mistake.
        </p>
        <Link href="/teacher-dashboard">
          <Button
            radius="sm"
            className="mt-4 justify-center text-purple-700 bg-white border-4 border-purple-300"
            style={{ filter: "drop-shadow(4px 4px 0px #7828C8)" }}
            startContent={<ArrowLeft size={20} />}
          >
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default index;
