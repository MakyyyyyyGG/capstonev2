import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Tabs, Tab } from "@nextui-org/react";
import StudentList from "@/pages/components/StudentList";
import ClassWorkList from "@/pages/components/ClassWorkList";

const fetchRoomDetails = async (room_code, setRoomData) => {
  try {
    const res = await fetch(
      `/api/accounts_teacher/room/room_details?room_code=${room_code}`
    );
    const data = await res.json();
    setRoomData(data.roomsData);
    console.log(data);
  } catch (error) {
    console.error("Error fetching room details:", error);
  }
};

const IndividualRoom = () => {
  const { data: session } = useSession();
  const [roomData, setRoomData] = useState(null);
  const router = useRouter();
  const { room_code } = router.query;

  useEffect(() => {
    if (room_code) {
      fetchRoomDetails(room_code, setRoomData);
    }
  }, [room_code]);

  if (!roomData) return <p>Loading...</p>;

  return (
    <div>
      <h1>{roomData[0]?.room_name || "Room"}</h1>
      <p>Difficulty: {roomData[0]?.room_difficulty}</p>
      <p>Room Code: {roomData[0]?.room_code}</p>
      <div className="flex gap-5 my-5">
        <p>Teacher Username: {roomData[0]?.email}</p>
        <p>Teacher First Name: {roomData[0]?.first_name}</p>
        <p>Teacher Last Name: {roomData[0]?.last_name}</p>
      </div>
      <Tabs aria-label="Options" size="lg" color="secondary" className="m-2">
        <Tab key="classroom" title="Classroom">
          Classroom
        </Tab>
        <Tab key="classworks" title="Classworks">
          Classworks
          <ClassWorkList room_code={room_code} />
        </Tab>
        <Tab key="classmates" title="Classmates">
          <StudentList room_code={room_code} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default IndividualRoom;
