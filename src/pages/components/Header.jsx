import React, { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, Chip, user } from "@nextui-org/react";
import { Menu, X, Settings, LogOut } from "lucide-react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Input,
  Select,
  SelectItem,
  DropdownSection,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
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
import JoinRoom from "./JoinRoom";
const Header = ({ isCollapsed, toggleCollapse }) => {
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFollowed, setIsFollowed] = React.useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleOpenModal = () => {
    setIsDropdownOpen(false);
    onOpen();
  };

  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLocationEditing, setIsLocationEditing] = useState(false);

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bday, setBday] = useState("");
  const [location, setLocation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profilePictureEditing, setProfilePictureEditing] = useState(false);
  const [isImageChanged, setIsImageChanged] = useState(false);

  const [customBarangays, setCustomBarangays] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
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

  // useEffect(() => {
  //   console.log(gender, bday, region, province, municipality, barangay);
  // }, [gender, bday, region, province, municipality, barangay]);

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
      setCities([]);
      setMunicipalities([]);
      setBarangays([]);
      setSelectedProvince("");
      setSelectedCity("");
      setSelectedMunicipality("");
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
      setProfileImage(reader.result); // Base64 string
    };
    // console.log(profileImage);

    if (file) {
      reader.readAsDataURL(file); // Convert to Base64
    }
  };

  const fetchCities = async (provinceCode) => {
    try {
      const response = await fetch(
        `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities`
      );
      const data = await response.json();
      const sortedCities = data.sort((a, b) => a.name.localeCompare(b.name));
      setCities(sortedCities);
      setBarangays([]);
      setSelectedCity("");
      setSelectedBarangay("");
    } catch (error) {
      console.error("Error fetching cities:", error);
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
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setSelectedRegionText(selectedText);
    setSelectedRegion(e.target.value);
    fetchProvinces(e.target.value);
  };

  const handleProvinceChange = (e) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setSelectedProvinceText(selectedText);
    setSelectedProvince(e.target.value);
    fetchCities(e.target.value);
    fetchMunicipalities(e.target.value);
  };

  const handleMunicipalityChange = (e) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setSelectedMunicipalityText(selectedText);
    const value = e.target.value;
    setSelectedMunicipality(value);

    if (value === "Legazpi") {
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
      fetchBarangays(value);
      setCustomBarangays([]);
    }
  };

  const handleBarangayChange = (e) => {
    const selectedText = e.target.options[e.target.selectedIndex].text;
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

  const handleSaveClick = async (e) => {
    e.preventDefault();
    const finalRegion = userData?.region || selectedRegionText;
    const finalProvince = userData?.province || selectedProvinceText;
    const finalMunicipality =
      userData?.municipality || selectedMunicipalityText;
    const finalBarangay = userData?.barangay || selectedBarangayText;

    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_manage?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_manage?account_id=${session.user.id}`;

    try {
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
          // profileImage: profileImage,
        }),
      };

      const response = await fetch(apiEndpoint, updateData);

      // Log the response
      const text = await response.text(); // Get response as text
      // console.log(text);

      // Try to parse the JSON
      const data = JSON.parse(text);
      // console.log(data);
      setUserData(data); // Update the userData state with the new data
      getUserData(); // Re-fetch user data to reflect the updates

      // Update profileImage to force refresh
      setProfileImage(`${data.profileImage}?${new Date().getTime()}`);
    } catch (error) {
      console.error("Error updating user data:", error);
    }

    setIsEditing(false);
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
      alert("Please select an image before saving.");
      return;
    }
    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_picture?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_picture?account_id=${session.user.id}`;

    try {
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

      const response = await fetch(apiEndpoint, updateProfilePicture);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure that the image URL in the response is used
      setProfileImage(`${data.profileImage}?${new Date().getTime()}`);
      await getUserData(); // Re-fetch user data to reflect the updates
      setProfilePictureEditing(false);
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  const handleLocationSaveClick = async (e) => {
    e.preventDefault();
    if (
      !selectedRegion ||
      !selectedProvince ||
      !selectedMunicipality ||
      !selectedBarangay
    ) {
      alert("Please select all location fields before saving.");
      return;
    }
    const apiEndpoint =
      session.user.role === "student"
        ? `/api/accounts_student/profile_manage?account_id=${session.user.id}`
        : `/api/accounts_teacher/profile_manage?account_id=${session.user.id}`;

    try {
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

      const response = await fetch(apiEndpoint, updateData);

      // Log the response
      const text = await response.text(); // Get response as text
      // console.log(text);

      // Try to parse the JSON
      const data = JSON.parse(text);
      // console.log(data);
      console.log("User data updated successfully");
      setIsLocationEditing(false);
      setUserData(data); // Update the userData state with the new data
      getUserData(); // Re-fetch user data to reflect the updates
    } catch (error) {
      console.error("Error updating user data:", error);
    }

    setIsEditing(false);
  };

  const handleCancelClick = () => {
    // console.log("session.user.first_name", session.user.first_name);
    // console.log("session.user.last_name", session.user.last_name);
    // console.log("userData.first_name", userData.first_name);
    // console.log("userData.last_name", userData.last_name);
    setFirstName(userData.first_name);
    setLastName(userData.last_name);
    setIsLocationEditing(false);
    setIsEditing(false);
  };

  async function getUserData() {
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
      const data = await response.json();
      const user = data.usersData[0];
      if (user) {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setAge(user.age || "");
        setGender(user.gender || "");
        setBday(user.bday || "");
        setRegion(user.region || "");
        setProvince(user.province || "");
        setMunicipality(user.municipality || "");
        setBarangay(user.barangay || "");
        setProfileImage(
          user.profile_image
            ? `${user.profile_image}?${new Date().getTime()}`
            : ""
        );
      }
      setUserData(user);
      console.log("User data:", user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  useEffect(() => {
    if (session) {
      getUserData();
    }
  }, [session]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>You are not signed in</p>;
  }

  return (
    <div>
      <Navbar isBordered maxWidth={"full"}>
        <NavbarContent justify="start">
          <NavbarBrand className="mr-4">
            <button onClick={toggleCollapse}>
              {isCollapsed ? <Menu /> : <X />}
            </button>
            <p className="ml-8 hidden sm:block font-bold text-inherit">LNK</p>
          </NavbarBrand>
        </NavbarContent>
        <NavbarContent as="div" className="items-center" justify="end">
          <Dropdown
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            placement="bottom-end"
          >
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="secondary"
                size="md"
                src={profileImage}
              />
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Profile Actions"
              variant="flat"
              className="min-w-[380px]"
            >
              <DropdownSection showDivider>
                <DropdownItem
                  isReadOnly
                  key="profile"
                  className="h-14 gap-2 text-center cursor-default"
                >
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-light">{session.user.email}</p>
                </DropdownItem>
                <DropdownItem
                  isReadOnly
                  key="profile"
                  className="h-30 gap-2 cursor-default flex justify-center"
                >
                  <div className="flex justify-center w-full">
                    <Avatar
                      src={profileImage}
                      className="w-[100px] h-[100px] text-large"
                    />
                  </div>
                </DropdownItem>
                <DropdownItem
                  isReadOnly
                  key="profile"
                  className="h-30 gap-2 cursor-default"
                >
                  <p className=" text-center text-2xl">Hi, {firstName}!</p>
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
                    >
                      Signout
                    </Button>
                  </div>
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
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
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Profile Details
              </ModalHeader>
              <ModalBody>
                <div className="mx-2 grid grid-cols-7 gap-3 justify-between">
                  <div className="col-span-1">
                    <p>Profile</p>
                  </div>
                  <div className="col-span-4 col-start-3 col-end-8">
                    {isEditing ? (
                      <>
                        <Card className="w-full p-2">
                          <CardHeader>
                            <div className="flex gap-5">
                              <Avatar
                                src={profileImage}
                                alt="User Profile"
                                className="w-[70px] h-[70px] text-large"
                              />
                              <div className="flex flex-col justify-center text-sm">
                                <Button
                                  onClick={editProfilePicture}
                                  color="secondary"
                                >
                                  Update Profile Picture
                                </Button>
                                {profilePictureEditing && (
                                  <div className="flex flex-col gap-3 mt-3">
                                    <div className="">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                      <Button
                                        size="sm"
                                        onClick={cancelProfilePicture}
                                        color="danger"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleProfilePicture}
                                        color="primary"
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
                            <div className="grid grid-cols-2 gap-3">
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
                              <Input
                                type="number"
                                label="Age"
                                size="sm"
                                variant="bordered"
                                value={age || ""}
                                onChange={(e) => setAge(e.target.value)}
                              />
                              <Select
                                name="gender"
                                id="gender"
                                label="Choose your Gender"
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
                              {/* <label>Choose a gender:</label>
                              <select
                                name="gender"
                                id="gender"
                                value={gender || ""}
                                onChange={(e) => setGender(e.target.value)}
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select> */}
                              <Input //DatePicker has some problems
                                className="col-span-2"
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
                              color="default"
                              size="sm"
                              onClick={handleCancelClick}
                            >
                              Cancel
                            </Button>
                            <Button
                              color="secondary"
                              size="sm"
                              onClick={handleSaveClick}
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
                                src={profileImage}
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
                            color="secondary"
                            size="sm"
                            radius="full"
                            className="px-4"
                            onClick={handleUpdateClick}
                          >
                            Update
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <hr className="mx-8 border-gray opacity-75" />
                <div className="mx-2 grid grid-cols-7 gap-3 justify-between">
                  <div className="col-span-1">
                    <p>Location</p>
                  </div>
                  <div className="col-span-4 col-start-3 col-end-8">
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
                                <option value="Legazpi">Legazpi</option>
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
                              {selectedMunicipality === "Legazpi"
                                ? customBarangays.map((barangay, index) => (
                                    <option key={index} value={barangay}>
                                      {barangay}
                                    </option>
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
                              color="default"
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
                          <div>
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
                            color="secondary"
                            size="sm"
                            radius="full"
                            className="px-4"
                            onClick={handleLocUpdateClick}
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

      {/* <p>username {userData?.first_name}</p>
      <p>Welcome, {session.user.email}!</p>
      <p>Your name is {session.user.name}</p>
      <p>Your user ID is: {session.user.id}</p>
      <p>Your role is: {session.user.role}</p>
      <Button onClick={editProfilePicture} color="secondary">
        Update Profile Picture
      </Button>
      {profilePictureEditing && (
        <div className="flex flex-col">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <Button onClick={handleProfilePicture} color="primary">
            Save
          </Button>
          <Button onClick={cancelProfilePicture} color="danger">
            Cancel
          </Button>
        </div>
      )}
      <form className="flex flex-col">
        {isEditing ? (
          <>
            <input
              type="text"
              value={firstName || ""}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text"
              value={lastName || ""}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Age"
              value={age || ""}
              onChange={(e) => setAge(e.target.value)}
            />
            <input
              type="date"
              value={bday || ""}
              onChange={(e) => setBday(e.target.value)}
            />

            <label>Choose a gender:</label>
            <select
              name="gender"
              id="gender"
              value={gender || ""}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <Button color="primary" onClick={handleSaveClick}>
              Save
            </Button>
            <Button color="danger" onClick={handleCancelClick}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <p>First Name: {firstName}</p>
            <p>Last Name: {lastName}</p>
            <p>Age: {age}</p>
            <p>Gender: {gender}</p>
            <p>Birthday: {bday}</p>
            <img
              src={profileImage}
              alt="User Profile"
              style={{ width: "100px", height: "100px", borderRadius: "50%" }}
            />
            <Button color="secondary" onClick={handleUpdateClick}>
              Update
            </Button>
          </>
        )}
      </form>
      <form action="" className="flex flex-col">
        {isLocationEditing ? (
          <>
            <label>Region:</label>
            <select
              name="region"
              id="region"
              value={selectedRegion || ""}
              onChange={handleRegionChange}
            >
              <option value="">Select Region</option>
              {regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>

            <label>Province:</label>
            <select
              value={selectedProvince || ""}
              onChange={handleProvinceChange}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>

            <label>Municipality:</label>
            <select
              value={selectedMunicipality || ""}
              onChange={handleMunicipalityChange}
            >
              <option value="">Select Municipality</option>
              {selectedProvinceText === "Albay" && (
                <option value="Legazpi">Legazpi</option>
              )}
              {municipalities.map((municipality) => (
                <option key={municipality.code} value={municipality.code}>
                  {municipality.name}
                </option>
              ))}
            </select>

            <label>Barangay:</label>
            <select
              value={selectedBarangay || ""}
              onChange={handleBarangayChange}
            >
              <option value="">Select Barangay</option>
              {selectedMunicipality === "Legazpi"
                ? customBarangays.map((barangay, index) => (
                    <option key={index} value={barangay}>
                      {barangay}
                    </option>
                  ))
                : barangays.map((barangay) => (
                    <option key={barangay.code} value={barangay.code}>
                      {barangay.name}
                    </option>
                  ))}
            </select>
            <Button color="primary" onClick={handleLocationSaveClick}>
              Save
            </Button>
            <Button color="danger" onClick={handleLocCancelClick}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <p>Region: {userData?.region}</p>
            <p>Province: {userData?.province}</p>
            <p>Municipality: {userData?.municipality}</p>
            <p>Barangay: {userData?.barangay}</p>
            <Button color="secondary" onClick={handleLocUpdateClick}>
              Update
            </Button>
          </>
        )}
      </form>
      <Button
        color="danger"
        onPress={() =>
          signOut({ redirect: false }).then(() => router.push("/"))
        }
      >
        Signout
      </Button>
      <div className="flex flex-col">
        <p>age {age}</p>
        <p>gender {userData?.gender}</p>
        <p>bday {userData?.bday}</p>
        <p>region {userData?.region}</p>
        <p>province {userData?.province}</p>
        <p>municipality {userData?.municipality}</p>
        <p>barangay {userData?.barangay}</p>
      </div> */}
    </div>
  );
};

export default Header;
