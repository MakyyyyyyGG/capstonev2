import React, { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, Avatar } from "@nextui-org/react";
import { Menu, X, Settings, LogOut } from "lucide-react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Input,
  Select,
  SelectItem,
  DropdownSection,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
} from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import JoinRoom from "./JoinRoom";
import CreateRoom from "../components/CreateRoom";
import crypto from "crypto";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import Coins from "./Coins";
import Exp from "./Exp";
import useUserStore from "../api/coins_exp/useUserStore";
import Stickers from "./Stickers";
const Header = ({ isCollapsed, toggleCollapse }) => {
  const router = useRouter();

  const { coins, exp, setInitialValues } = useUserStore();
  const [ownedStickers, setOwnedStickers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session, status } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [isLocationEditing, setIsLocationEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bday, setBday] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profilePictureEditing, setProfilePictureEditing] = useState(false);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const [customBarangays, setCustomBarangays] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [userData, setUserData] = useState(null);

  const [selectedRegionText, setSelectedRegionText] = useState("");
  const [selectedProvinceText, setSelectedProvinceText] = useState("");
  const [selectedMunicipalityText, setSelectedMunicipalityText] = useState("");
  const [selectedBarangayText, setSelectedBarangayText] = useState("");

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (bday) {
      const birthDate = new Date(bday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        setAge(age - 1);
      } else {
        setAge(age);
      }
    }
  }, [bday]);

  const checkPasswordsMatch = () => {
    if (newPassword === confirmNewPassword) {
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
      fetch(`/api/resetPassword?email=${session.user.email}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, currentPassword }),
      })
        .then((res) => {
          if (res.status === 400) {
            return res.json().then(() => {
              throw new Error("Failed to reset password.");
            });
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
          }
        }),
      {
        loading: "Resetting password...",
        success: "Password reset successful",
        error: "Failed to reset password.",
      }
    );
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch("https://psgc.gitlab.io/api/regions");
      const data = await response.json();
      const sortedRegions = data.sort((a, b) => a.name.localeCompare(b.name));
      setRegions(sortedRegions);
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  const fetchProvinces = async (regionCode) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/regions/${regionCode}/provinces`
      );
      const data = await response.json();
      const sortedProvinces = data.sort((a, b) => a.name.localeCompare(b.name));
      setProvinces(sortedProvinces);
      setBarangays([]);
      setSelectedProvince("");
      setSelectedBarangay("");
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const handleImageChange = (event) => {
    setIsImageChanged(true);
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setProfileImage(reader.result);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const fetchMunicipalities = async (provinceCode) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/provinces/${provinceCode}/municipalities`
      );
      const data = await response.json();
      const sortedMunicipalities = data.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setMunicipalities(sortedMunicipalities);
      setBarangays([]);
      setSelectedMunicipality("");
      setSelectedBarangay("");
    } catch (error) {
      console.error("Error fetching municipalities:", error);
    }
  };

  const fetchBarangays = async (municipalityCode) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/municipalities/${municipalityCode}/barangays`
      );
      const data = await response.json();
      const sortedBarangays = data.sort((a, b) => a.name.localeCompare(b.name));
      setBarangays(sortedBarangays);
      setSelectedBarangay("");
    } catch (error) {
      console.error("Error fetching barangays:", error);
    }
  };

  const handleRegionChange = (e) => {
    const selectedValue = e.target.value;
    const selectedOption = regions.find(
      (region) => region.code === selectedValue
    );
    const selectedText = selectedOption ? selectedOption.name : "";

    setSelectedRegionText(selectedText);
    setSelectedRegion(selectedValue);
    fetchProvinces(selectedValue);
  };

  const handleProvinceChange = (e) => {
    const selectedValue = e.target.value;
    const selectedOption = provinces.find(
      (province) => province.code === selectedValue
    );
    const selectedText = selectedOption ? selectedOption.name : "";

    setSelectedProvinceText(selectedText);
    setSelectedProvince(selectedValue);
    fetchMunicipalities(selectedValue);
  };

  const handleMunicipalityChange = (e) => {
    const selectedValue = e.target.value;
    const selectedOption = municipalities.find(
      (municipality) => municipality.code === selectedValue
    );
    const selectedText = selectedOption ? selectedOption.name : "";

    setSelectedMunicipalityText(selectedText);
    setSelectedMunicipality(selectedValue);

    if (selectedValue === "Legazpi") {
      setSelectedMunicipalityText("Legazpi");
      const barangays = [
        "Barangay 67 - Bariis",
        "Bgy. 1 - Em's Barrio",
        "Bgy. 2 - Em's Barrio South",
        "Bgy. 3 - Em's Barrio East",
        "Bgy. 4 - Sagpon Pob.",
        "Bgy. 5 - Sagmin Pob.",
        "Bgy. 6 - Bañadero Pob.",
        "Bgy. 7 - Baño",
        "Bgy. 8 - Bagumbayan",
        "Bgy. 9 - Cabugao",
        "Bgy. 9 - Pinaric",
        "Bgy. 11 - Maoyod Pob.",
        "Bgy. 12 - Tula-tula",
        "Bgy. 13 - Ilawod West Pob.",
        "Bgy. 14 - Ilawod Pob.",
        "Bgy. 15 - Ilawod East Pob.",
        "Bgy. 16 - Kawit-East Washington Drive",
        "Bgy. 17 - Rizal Street., Ilawod",
        "Bgy. 18 - Cabagñan West",
        "Bgy. 19 - Cabagñan",
        "Bgy. 20 - Cabagñan East",
        "Bgy. 21 - Binanuahan West",
        "Bgy. 22 - Binanuahan East",
        "Bgy. 23 - Imperial Court Subd.",
        "Bgy. 24 - Rizal Street",
        "Bgy. 25 - Lapu-lapu",
        "Bgy. 26 - Dinagaan",
        "Bgy. 27 - Victory Village South",
        "Bgy. 28 - Victory Village North",
        "Bgy. 29 - Sabang",
        "Bgy. 30 - Pigcale",
        "Bgy. 31 - Centro-Baybay",
        "Bgy. 31 - San Roque",
        "Bgy. 33 - PNR-Peñaranda St.-Iraya",
        "Bgy. 34 - Oro Site-Magallanes St.",
        "Bgy. 35 - Tinago",
        "Bgy. 36 - Kapantawan",
        "Bgy. 37 - Bitano",
        "Bgy. 38 - Gogon",
        "Bgy. 39 - Bonot",
        "Bgy. 40 - Cruzada",
        "Bgy. 41 - Bogtong",
        "Bgy. 42 - Rawis",
        "Bgy. 43 - Tamaoyan",
        "Bgy. 44 - Pawa",
        "Bgy. 45 - Dita",
        "Bgy. 46 - San Joaquin",
        "Bgy. 47 - Arimbay",
        "Bgy. 48 - Bagong Abre",
        "Bgy. 49 - Bigaa",
        "Bgy. 50 - Padang",
        "Bgy. 51 - Buyua",
        "Bgy. 52 - Matanag",
        "Bgy. 53 - Bonga",
        "Bgy. 54 - Mabinit",
        "Bgy. 55 - Estanza",
        "Bgy. 56 - Taysan",
        "Bgy. 57 - Dap-dap",
        "Bgy. 58 - Buragwis",
        "Bgy. 59 - Puro",
        "Bgy. 60 - Lamba",
        "Bgy. 61 - Maslog",
        "Bgy. 62 - Homapon",
        "Bgy. 63 - Mariawa",
        "Bgy. 64 - Bagacay",
        "Bgy. 65 - Imalnod",
        "Bgy. 66 - Banquerohan",
        "Bgy. 68 - San Francisco",
        "Bgy. 69 - Buenavista",
        "Bgy. 70 - Cagbacong",
      ];
      setCustomBarangays(barangays);
      setBarangays([]);
    } else {
      fetchBarangays(selectedValue);
      setCustomBarangays([]);
    }
  };

  const handleBarangayChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedMunicipality === "Legazpi") {
      const customBarangay = customBarangays[selectedValue];
      setSelectedBarangayText(customBarangay);
      setSelectedBarangay(e.target.value);
      return;
    }

    const selectedOption = barangays.find(
      (barangay) => barangay.code === selectedValue
    );
    const selectedText = selectedOption ? selectedOption.name : "";
    setSelectedBarangayText(selectedText);
    setSelectedBarangay(e.target.value);
  };

  const handleUpdateClick = () => {
    setIsEditing(true);
  };

  const handleLocUpdateClick = () => {
    setIsLocationEditing(true);
  };

  const handleLocCancelClick = () => {
    setIsLocationEditing(false);
  };

  const handlePassUpdateClick = () => {
    setIsPasswordEditing(true);
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    const finalRegion = userData?.region || selectedRegionText;
    const finalProvince = userData?.province || selectedProvinceText;
    const finalMunicipality =
      userData?.municipality || selectedMunicipalityText;
    const finalBarangay =
      userData?.barangay || selectedBarangayText || selectedBarangay;

    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_manage?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_manage?account_id=${session.user.id}`;

    const updateData = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_id: session.user.id,
        first_name: firstName,
        last_name: lastName,
        age: age,
        gender: gender,
        bday: bday,
        region: finalRegion,
        province: finalProvince,
        municipality: finalMunicipality,
        barangay: finalBarangay,
      }),
    };

    toast.promise(
      fetch(apiEndpoint, updateData).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        const data = JSON.parse(text);
        setUserData(data);
        await getUserData();
        setProfileImage(`${data.profileImage}?${new Date().getTime()}`);
        setIsEditing(false);
      }),
      {
        loading: "Updating profile...",
        success: "Profile updated successfully!",
        error: "Failed to update profile",
      }
    );
  };

  const editProfilePicture = () => {
    setProfilePictureEditing(true);
  };

  const cancelProfilePicture = () => {
    setProfilePictureEditing(false);
  };

  const handleProfilePicture = async (e) => {
    e.preventDefault();
    if (!isImageChanged) {
      toast.error("Please select an image before saving.");
      return;
    }
    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_picture?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_picture?account_id=${session.user.id}`;

    const updateProfilePicture = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_id: session.user.id,
        profile_image: profileImage,
      }),
    };

    toast.promise(
      fetch(apiEndpoint, updateProfilePicture)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(async (data) => {
          setProfileImage(`${data.profileImage}?${new Date().getTime()}`);
          await getUserData();
          setProfilePictureEditing(false);
        }),
      {
        loading: "Updating profile picture...",
        success: "Profile picture updated successfully!",
        error: "Failed to update profile picture",
      }
    );
  };

  const handleLocationSaveClick = async (e) => {
    e.preventDefault();
    if (
      !selectedRegion ||
      !selectedProvince ||
      !selectedMunicipality ||
      !selectedBarangay
    ) {
      toast.error("Please select all location fields before saving.");
      return;
    }
    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_manage?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_manage?account_id=${session.user.id}`;

    const updateData = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_id: session.user.id,
        first_name: firstName,
        last_name: lastName,
        age: age,
        gender: gender,
        bday: bday,
        region: selectedRegionText,
        province: selectedProvinceText,
        municipality: selectedMunicipalityText,
        barangay: selectedBarangayText,
      }),
    };

    toast.promise(
      fetch(apiEndpoint, updateData)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {
          setIsLocationEditing(false);
          getUserData();
          setIsEditing(false);
        }),
      {
        loading: "Updating location...",
        success: "Location updated successfully!",
        error: "Failed to update location",
      }
    );
  };

  const handleCancelClick = () => {
    setFirstName(userData.first_name);
    setLastName(userData.last_name);
    setIsLocationEditing(false);
    setIsEditing(false);
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>You are not signed in</p>;
  }

  useEffect(() => {
    if (!session) return;

    // Check if this is the user's first visit
    const isFirstVisit = !localStorage.getItem("hasVisited");

    if (isFirstVisit) {
      const driverObj = driver({
        showProgress: true,
        steps: [
          {
            popover: {
              title: "Welcome to LNK!",
              description: "Let's take a quick tour to help you get started.",
              side: "center",
            },
          },
          {
            element: "#avatar",
            popover: {
              title: "Profile Menu",
              description:
                "Click here to access your profile settings and sign out options",
              side: "left",
            },
          },
          {
            element:
              session.user.role === "student" ? "#join-room" : "#create-room",
            popover: {
              title:
                session.user.role === "student" ? "Join Room" : "Create Room",
              description:
                session.user.role === "student"
                  ? "Click here to join an existing room"
                  : "Click here to create a new room",
              side: "left",
            },
          },
        ],
      });
      driverObj.drive();

      // Set flag in localStorage to indicate user has visited
      localStorage.setItem("hasVisited", "true");
    }
  }, [session]);

  const handleOpenModal = () => {
    setIsDropdownOpen(false);
    onOpen();
  };

  async function getUserData() {
    // await fetchStickers(); // Ensure stickers are fetched before proceeding
    const getData = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_manage?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_manage?account_id=${session.user.id}`;

    try {
      const response = await fetch(apiEndpoint, getData);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const user = data.usersData[0];
      if (user) {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setBday(user.bday || "");
        setGender(user.gender || "");
        setProfileImage(
          user.profile_image
            ? `${user.profile_image}?${new Date().getTime()}`
            : ""
        );

        const decryptedPassword = crypto
          .createHash("sha256")
          .update(user.password)
          .digest("hex");
        setCurrentPassword(decryptedPassword);
      }
      setUserData(user);
      setInitialValues(user.coins, user.exp);
      // console.log("user data", user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  useEffect(() => {
    getUserData();
  }, []);

  const homeRedirect = () => {
    if (session.user.role === "student") {
      router.push("/homepage");
    } else {
      router.push("/teacher-dashboard");
    }
  };
  return (
    <div>
      <Toaster />
      <Navbar isBordered maxWidth={"full"}>
        <NavbarContent justify="start">
          <NavbarBrand className="mr-4 flex items-center gap-8">
            {session?.user?.role === "teacher" && (
              <div
                onClick={toggleCollapse}
                role="button"
                tabIndex={0}
                aria-label={isCollapsed ? "Expand Menu" : "Collapse Menu"}
              >
                {isCollapsed ? <Menu /> : <X />}
              </div>
            )}
            <p
              onClick={homeRedirect}
              className={`hidden sm:block font-bold text-inherit ${
                session?.user?.role === "student" ? "ml-0" : "ml-8"
              } hover:cursor-pointer`}
            >
              LIWANAG
            </p>
            <div className="flex items-center gap-4">
              {session?.user?.role === "student" && (
                <>
                  <Coins coins={coins} />
                  <Exp exp={exp} />
                </>
              )}
            </div>
          </NavbarBrand>
        </NavbarContent>
        <NavbarContent as="div" className="items-center" justify="end">
          {session?.user?.role === "student" && <>{/* <Shop /> */}</>}

          <div className="flex gap-4">
            {session?.user?.role === "teacher" ? (
              <div id="create-room">
                <CreateRoom />
              </div>
            ) : session?.user?.role === "student" ? (
              <div id="join-room">
                <JoinRoom />
              </div>
            ) : null}
            <Dropdown
              isOpen={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
              placement="bottom-end"
            >
              <DropdownTrigger>
                <div>
                  <Avatar
                    id="avatar"
                    isBordered
                    className="transition-transform cursor-pointer"
                    color="secondary"
                    size="md"
                    src={profileImage || session.user.image}
                    aria-label="Open Profile Menu"
                  />
                </div>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Profile Actions"
                variant="flat"
                className="min-w-[380px]"
              >
                <DropdownSection showDivider>
                  <DropdownItem
                    isReadOnly
                    className="h-14 gap-2 text-center cursor-default"
                  >
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-light">{session.user.email}</p>
                  </DropdownItem>
                  <DropdownItem
                    isReadOnly
                    className="h-30 gap-2 cursor-default flex justify-center"
                  >
                    <div className="flex justify-center w-full">
                      <Avatar
                        src={profileImage || session.user.image}
                        className="w-[100px] h-[100px] text-large"
                        aria-label="Profile Picture"
                      />
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    isReadOnly
                    className="h-30 gap-2 cursor-default"
                  >
                    <p className=" text-center text-2xl">
                      Hi, {firstName || session.user.name}!
                    </p>
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                  <DropdownItem
                    isReadOnly
                    key="settings"
                    className="min-w-[100px] flex justify-center gap-2 cursor-default"
                  >
                    <div className="flex flex-row gap-2">
                      <Button
                        onPress={handleOpenModal}
                        radius="sm"
                        size="md"
                        className="w-full text-sm"
                        startContent={<Settings size={20} />}
                        aria-label="Manage Account"
                      >
                        Manage Account
                      </Button>
                      <Button
                        color="danger"
                        radius="sm"
                        size="md"
                        className="w-full text-sm"
                        startContent={<LogOut size={20} />}
                        onPress={() =>
                          signOut({ redirect: false }).then(() =>
                            router.push("/")
                          )
                        }
                        aria-label="Sign Out"
                      >
                        Signout
                      </Button>
                    </div>
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </NavbarContent>
      </Navbar>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
        backdrop="opaque"
        size="2xl"
        radius="lg"
        placement="center"
        classNames={{
          body: "py-6",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          base: "border-[#292f46] bg-[#fff] text-[#000]",
          header: "border-b-[1px] border-gray",
          footer: "border-t-[1px] border-gray",
          closeButton: "hover:bg-purple-700/5 active:bg-purple-700/10",
        }}
        aria-label="Profile Details Modal"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Profile Details
              </ModalHeader>
              <ModalBody className="shadow-inner">
                <div className="mx-2 grid grid-cols-7 gap-3 justify-between max-sm:grid-cols-1 max-sm:gap-6">
                  <div className="col-span-1">
                    <div className="flex justify-between">
                      <p>Profile</p>
                      <Button
                        color="secondary"
                        size="sm"
                        radius="full"
                        className="px-4 sm:hidden"
                        onClick={handleUpdateClick}
                        aria-label="Update Profile"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-4 col-start-3 col-end-8 max-sm:col-span-1 max-sm:col-start-1 ">
                    {isEditing ? (
                      <>
                        <Card className="w-full p-2">
                          <CardHeader>
                            <div className="flex gap-5">
                              <Avatar
                                src={profileImage || session.user.image}
                                alt="User Profile"
                                className="w-[70px] h-[70px] text-large"
                              />
                              <div className="flex flex-col justify-center text-sm">
                                <Button
                                  radius="sm"
                                  onClick={editProfilePicture}
                                  color="secondary"
                                  aria-label="Update Profile Picture"
                                >
                                  Update Picture
                                </Button>
                                {profilePictureEditing && (
                                  <div className="flex flex-col gap-3 mt-3">
                                    <div className="">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        aria-label="Choose Profile Picture"
                                        className="block w-full text-sm text-slate-500 
                                        file:mr-3 file:py-1 file:px-3
                                        file:rounded-md file:border-0
                                        file:text-sm file:bg-[#7828C8] 
                                        file:text-white hover:file:bg-[#9353D3]"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                      <Button
                                        size="sm"
                                        onClick={cancelProfilePicture}
                                        color="default"
                                        aria-label="Cancel Picture Update"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleProfilePicture}
                                        color="secondary"
                                        aria-label="Save Profile Picture"
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardBody className="py-3 text-small text-default-400 font-semibold">
                            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                              <Input
                                type="text"
                                label="First Name"
                                size="sm"
                                variant="bordered"
                                value={firstName || ""}
                                onChange={(e) => setFirstName(e.target.value)}
                              />
                              <Input
                                type="text"
                                label="Last Name"
                                size="sm"
                                variant="bordered"
                                value={lastName || ""}
                                onChange={(e) => setLastName(e.target.value)}
                              />
                              {/* <Input
                                type="number"
                                label="Age"
                                size="sm"
                                variant="bordered"
                                value={age || ""}
                                onChange={(e) => setAge(e.target.value)}
                              /> */}
                              <Select
                                name="gender"
                                id="gender"
                                label="Choose your sex"
                                placeholder="Select Gender"
                                size="sm"
                                variant="bordered"
                                value={gender || ""}
                                onChange={(e) => setGender(e.target.value)}
                              >
                                <SelectItem key="Male">Male</SelectItem>
                                <SelectItem key="Female">Female</SelectItem>
                                <SelectItem key="Other">Other</SelectItem>
                              </Select>
                              <Input
                                className="col-span-2 max-sm:col-span-1"
                                type="date"
                                label="Enter Your Birth Date"
                                size="sm"
                                variant="bordered"
                                value={bday || ""}
                                onChange={(e) => setBday(e.target.value)}
                              />
                            </div>
                          </CardBody>
                          <CardFooter className="flex justify-end gap-3">
                            <Button
                              color="danger"
                              variant="light"
                              size="sm"
                              onClick={handleCancelClick}
                              aria-label="Cancel Profile Edit"
                            >
                              Cancel
                            </Button>
                            <Button
                              color="secondary"
                              size="sm"
                              onClick={handleSaveClick}
                              aria-label="Save Profile Changes"
                            >
                              Save
                            </Button>
                          </CardFooter>
                        </Card>
                      </>
                    ) : (
                      <>
                        <div className="min-w-[400px] flex flex-row items-center justify-between gap-5 text-sm">
                          <div className="flex flex-col gap-5">
                            <div className="flex flex-row items-center gap-3">
                              <Avatar
                                src={profileImage || session.user.image}
                                alt="User Profile"
                                className="w-[70px] h-[70px] text-large"
                              />
                              <p>
                                {firstName} {lastName}
                              </p>
                            </div>
                            <div className="min-w-[300px]">
                              <div className="grid grid-cols-2">
                                <p className="font-bold">Age</p>
                                <p>{age}</p>
                              </div>
                              <div className="grid grid-cols-2">
                                <p className="font-bold">Gender</p>
                                <p>{gender}</p>
                              </div>
                              <div className="grid grid-cols-2">
                                <p className="font-bold">Birthday</p>
                                <p>{bday}</p>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            radius="full"
                            color="secondary"
                            className="px-4 max-sm:hidden"
                            onClick={handleUpdateClick}
                          >
                            Update
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <hr className="border-gray opacity-75" />
                <div className="mx-2 grid grid-cols-7 gap-3 justify-between max-sm:grid-cols-1 max-sm:gap-6">
                  <div className="col-span-1">
                    <div className="flex mt-4 justify-between">
                      <p>Location</p>
                      <Button
                        size="sm"
                        radius="full"
                        color="secondary"
                        className="px-4 sm:hidden"
                        onClick={handleLocUpdateClick}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-4 col-start-3 col-end-8 max-sm:col-span-1 max-sm:col-start-1">
                    {isLocationEditing ? (
                      <>
                        <Card className="w-full p-2">
                          <CardHeader>
                            <div className="flex gap-5">
                              <h4 className="text-small font-semibold leading-none text-default-600">
                                Edit Your Location
                              </h4>
                            </div>
                          </CardHeader>
                          <CardBody className="px-3 py-0 text-small text-default-400 gap-y-3">
                            <Select
                              name="region"
                              id="region"
                              label="Choose your Region"
                              placeholder="Select Region"
                              size="sm"
                              variant="bordered"
                              value={selectedRegion || ""}
                              onChange={handleRegionChange}
                            >
                              {regions.map((region) => (
                                <SelectItem
                                  key={region.code}
                                  value={region.code}
                                >
                                  {region.name}
                                </SelectItem>
                              ))}
                            </Select>

                            <Select
                              label="Choose your Province"
                              placeholder="Select Province"
                              size="sm"
                              variant="bordered"
                              value={selectedProvince || ""}
                              onChange={handleProvinceChange}
                            >
                              {provinces.map((province) => (
                                <SelectItem
                                  key={province.code}
                                  value={province.code}
                                >
                                  {province.name}
                                </SelectItem>
                              ))}
                            </Select>

                            <Select
                              label="Choose your Municipality"
                              placeholder="Select Municipality"
                              size="sm"
                              variant="bordered"
                              value={selectedMunicipality || ""}
                              onChange={handleMunicipalityChange}
                            >
                              {selectedProvinceText === "Albay" && (
                                <SelectItem value="Legazpi" key="Legazpi">
                                  Legazpi
                                </SelectItem>
                              )}
                              {municipalities.map((municipality) => (
                                <SelectItem
                                  key={municipality.code}
                                  value={municipality.code}
                                >
                                  {municipality.name}
                                </SelectItem>
                              ))}
                            </Select>

                            <Select
                              label="Choose your Barangay"
                              placeholder="Select Barangay"
                              size="sm"
                              variant="bordered"
                              value={selectedBarangay || ""}
                              onChange={handleBarangayChange}
                            >
                              {selectedMunicipality == "Legazpi"
                                ? customBarangays.map((barangay, index) => (
                                    <SelectItem key={index} value={barangay}>
                                      {barangay}
                                    </SelectItem>
                                  ))
                                : barangays.map((barangay) => (
                                    <SelectItem
                                      key={barangay.code}
                                      value={barangay.code}
                                    >
                                      {barangay.name}
                                    </SelectItem>
                                  ))}
                            </Select>
                          </CardBody>
                          <CardFooter className="flex justify-end gap-3">
                            <Button
                              color="danger"
                              variant="light"
                              size="sm"
                              onClick={handleLocCancelClick}
                            >
                              Cancel
                            </Button>
                            <Button
                              color="secondary"
                              size="sm"
                              onClick={handleLocationSaveClick}
                            >
                              Save
                            </Button>
                          </CardFooter>
                        </Card>
                      </>
                    ) : (
                      <>
                        <div className="min-w-[400px] flex flex-row items-center justify-between gap-5 text-sm">
                          <div className="min-w-[300px]">
                            <div className="grid grid-cols-2">
                              <p className="font-bold">Region</p>
                              <p>{userData?.region}</p>
                            </div>
                            <div className="grid grid-cols-2">
                              <p className="font-bold">Province</p>
                              <p>{userData?.province}</p>
                            </div>
                            <div className="grid grid-cols-2">
                              <p className="font-bold">Municipality</p>
                              <p>{userData?.municipality}</p>
                            </div>
                            <div className="grid grid-cols-2">
                              <p className="font-bold">Barangay</p>
                              <p>{userData?.barangay}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            radius="full"
                            color="secondary"
                            className="px-4 max-sm:hidden"
                            onClick={handleLocUpdateClick}
                          >
                            Update
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <hr className="border-gray opacity-75" />
                {/* forgot password */}
                <div className="mx-2 grid grid-cols-7 gap-3 justify-between max-sm:grid-cols-1 max-sm:gap-6">
                  <div className="col-span-1">
                    <div className="flex mt-4 justify-between">
                      <p>Security</p>
                      {/* <Button
                        size="sm"
                        radius="full"
                        className="px-4 bg-[#7469B6] text-white border-0 sm:hidden"
                        onClick={() => setIsPasswordEditing(true)}
                      >
                        Update
                      </Button> */}
                    </div>
                  </div>
                  <div className="col-span-4 col-start-3 col-end-8 max-sm:col-span-1 max-sm:col-start-1">
                    {isPasswordEditing ? (
                      <>
                        <Card className="w-full p-2">
                          <CardHeader>
                            <div className="flex gap-5">
                              <h4 className="text-small font-semibold leading-none text-default-600">
                                Edit Your Password
                              </h4>
                            </div>
                          </CardHeader>
                          <CardBody className="px-3 py-0 text-small text-default-400 gap-y-3">
                            <Input
                              type="password"
                              label="Current Password"
                              placeholder="Enter Current Password"
                              size="sm"
                              variant="bordered"
                              // value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                            />
                            <Input
                              type="password"
                              label="New Password"
                              placeholder="Enter New Password"
                              size="sm"
                              variant="bordered"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Input
                              type="password"
                              label="Confirm New Password"
                              placeholder="Confirm New Password"
                              size="sm"
                              variant="bordered"
                              value={confirmNewPassword}
                              onChange={(e) =>
                                setConfirmNewPassword(e.target.value)
                              }
                            />
                          </CardBody>
                          <CardFooter className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              onClick={() => setIsPasswordEditing(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              color="secondary"
                              size="sm"
                              onClick={() => {
                                handleResetPassword();
                              }}
                            >
                              Save
                            </Button>
                          </CardFooter>
                        </Card>
                      </>
                    ) : (
                      <>
                        <div className="min-w-[400px] flex flex-row items-center justify-between gap-5 text-sm">
                          <div className="min-w-[300px]">
                            <p className="font-bold">Password</p>
                            <p>********</p>
                          </div>
                          <Button
                            size="sm"
                            radius="full"
                            color="secondary"
                            className="px-4 max-sm:hidden"
                            onClick={handlePassUpdateClick}
                          >
                            Update
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Header;
