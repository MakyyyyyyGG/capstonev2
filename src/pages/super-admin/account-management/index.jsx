import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import { Trash2, PencilLine, Plus, ChevronUp, ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const SuperAdmin = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRoleFromAPI, setUserRoleFromApi] = useState(["student"]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    account_id: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    user_original_role: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingId) {
      const user = users.find((u) => u.account_id === editingId);
      if (user) {
        setUserRoleFromApi([user.user_role]);
      }
    }
  }, [editingId, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/all-accounts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("data:", data);

      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.promise(
      (async () => {
        try {
          const url = editingId
            ? `/api/super-admin/all-accounts?id=${editingId}`
            : "/api/super-admin/all-accounts";
          const method = editingId ? "PUT" : "POST";

          let editedUser;
          let editingUserFrom;
          if (editingId) {
            editedUser = users.find((user) => user.account_id === editingId);
            editingUserFrom =
              editedUser.user_role === "teacher"
                ? "Teachers table"
                : "Students table";
            console.log("Editing user from:", editingUserFrom);
          }

          const res = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              password: formData.password,
              user_role: formData.role,
              original_role: formData.user_original_role,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to process request");
          }

          const result = await res.json();
          console.log("API Response:", result);

          fetchUsers();
          handleClose();
        } catch (error) {
          console.error("Error submitting form:", error);
          throw new Error(
            `Failed to ${editingId ? "update" : "create"} user: ${
              error.message
            }`
          );
        }
      })(),
      {
        loading: `${editingId ? "Updating" : "Creating"} user...`,
        success: `User ${editingId ? "updated" : "created"} successfully`,
        error: (error) => ` ${error.message}`,
      }
    );
  };

  const showDeleteAlertFunction = (id) => {
    setDeleteUserId(id);
    setShowDeleteAlert(true);
  };

  const handleDelete = async () => {
    try {
      console.log("Deleting user with ID:", deleteUserId);
      toast.promise(
        (async () => {
          const res = await fetch(
            `/api/super-admin/all-accounts?id=${deleteUserId}`,
            {
              method: "DELETE",
            }
          );

          const result = await res.json();
          console.log("Delete response:", result);

          if (!res.ok)
            throw new Error(result.message || "Failed to delete user");

          await fetchUsers();
          setShowDeleteAlert(false);
        })(),
        {
          loading: "Deleting user...",
          success: "User deleted successfully",
          error: "Failed to delete user",
        }
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  const handleEdit = (user) => {
    console.log("Editing user:", user);
    console.log(
      "User is from:",
      user.user_role === "teacher" ? "Teachers table" : "Students table"
    );
    setEditingId(user.account_id);
    setFormData({
      account_id: user.account_id || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      password: "",
      role: user.user_role || "",
      user_original_role: user.user_role || "",
    });
    onOpen();
  };

  const handleClose = () => {
    setEditingId(null);
    setFormData({
      account_id: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      userOriginalRole: "",
    });
    onClose();
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredUsers = [...users]
    .filter((user) => {
      const searchTerm = filters.search.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return (
        fullName.includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "name") {
        aValue = `${a.first_name} ${a.last_name}`;
        bValue = `${b.first_name} ${b.last_name}`;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

  const teachers = sortedAndFilteredUsers.filter(
    (user) => user.user_role === "teacher"
  );
  const students = sortedAndFilteredUsers.filter(
    (user) => user.user_role === "student"
  );

  return (
    <div className="p-8">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button color="primary" startContent={<Plus />} onClick={onOpen}>
            Add User
          </Button>
          <Button
            color="secondary"
            onClick={() => (window.location.href = "/")}
          >
            Back to Home
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Enter username or email"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex gap-8">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Teachers</h2>
          <div className="h-[500px] overflow-y-auto">
            <Table aria-label="Teachers table">
              <TableHeader>
                <TableColumn>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    NAME
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "ascending" ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      ))}
                  </div>
                </TableColumn>
                <TableColumn>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    USERNAME
                    {sortConfig.key === "email" &&
                      (sortConfig.direction === "ascending" ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      ))}
                  </div>
                </TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {teachers.map((user) => (
                  <TableRow key={user.account_id}>
                    <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="primary"
                          variant="light"
                          onClick={() => handleEdit(user)}
                        >
                          <PencilLine size={20} />
                        </Button>
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          onClick={() =>
                            showDeleteAlertFunction(user.account_id)
                          }
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Students</h2>
          <div className="h-[500px] overflow-y-auto">
            <Table aria-label="Students table">
              <TableHeader>
                <TableColumn>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    NAME
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "ascending" ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      ))}
                  </div>
                </TableColumn>
                <TableColumn>
                  <div
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    USERNAME
                    {sortConfig.key === "email" &&
                      (sortConfig.direction === "ascending" ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      ))}
                  </div>
                </TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {students.map((user) => (
                  <TableRow key={user.account_id}>
                    <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          color="primary"
                          variant="light"
                          onClick={() => handleEdit(user)}
                        >
                          <PencilLine size={20} />
                        </Button>
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          onClick={() =>
                            showDeleteAlertFunction(user.account_id)
                          }
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {editingId ? "Edit User" : "Add New User"}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Username"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <p className="text-sm text-gray-500">
                  Password is hidden. <br /> Enter password if you want to
                  change it
                </p>
                <Input
                  label="Password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingId}
                />
                {/* <h1>{userRoleFromAPI}</h1> */}
                <Select
                  defaultSelectedKeys="" // add this line
                  selectedKeys={userRoleFromAPI}
                  label="Role"
                  value={formData.role || userRoleFromAPI}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                >
                  <SelectItem value="teacher" key="teacher">
                    Teacher
                  </SelectItem>
                  <SelectItem value="student" key="student">
                    Student
                  </SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onClick={handleClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                {editingId ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {users.map((user) => (
        <AlertDialog
          key={user.account_id}
          open={showDeleteAlert && deleteUserId === user.account_id}
          onOpenChange={setShowDeleteAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this user?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
};

export default SuperAdmin;
