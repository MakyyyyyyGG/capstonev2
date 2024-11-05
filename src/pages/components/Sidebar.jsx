import React from "react";
import CreateRoom from "./CreateRoom";
import { Button, Divider, Accordion, AccordionItem } from "@nextui-org/react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import {
  House,
  Phone,
  BookA,
  School,
  ChartNoAxesCombined,
  ChartLine,
  LogOut,
} from "lucide-react";

const sidebarItems1 = [
  {
    name: "Dashboard",
    href: "/teacher-dashboard",
    icon: House,
  },
  {
    name: "Reports",
    href: "/teacher-dashboard/reports",
    icon: ChartLine,
  },
];

const signOutItem = {
  name: "Sign Out",
  href: "/api/auth/signout",
  icon: LogOut,
};

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const router = useRouter();

  const handleSignOut = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const handleNavigation = (href) => {
    router.push(href);
  };

  return (
    <div className="sidebar__wrapper relative z-50">
      <aside
        className="w-64 h-screen bg-white transition-all border-r border-gray-300 sticky top-0 max-md:hidden flex flex-col"
        data-collapse={isCollapsed}
      >
        <ul className="p-1 mb-4">
          {sidebarItems1.map(({ name, href, icon: Icon }) => (
            <li key={name} className="hover:bg-gray-200 ease-in-out rounded-md">
              <Button
                //disable ripple
                disableRipple
                color="transparent"
                onClick={() => handleNavigation(href)}
                className="w-full rounded-md text-base text-black flex px-3 py-3 mb-1  transition ease-in-out justify-start"
              >
                <span className="ml-2">
                  <Icon size={20} />
                </span>
                <span className="ml-4" id="sidebar__name">
                  {name}
                </span>
              </Button>
            </li>
          ))}
        </ul>

        {/* <div className="mt-auto p-1">
          <ul>
            <li className="hover:bg-gray-200 ease-in-out    rounded-md">
              <Button
                color="transparent"
                onClick={handleSignOut}
                className="w-full rounded-md text-base text-black flex px-3 py-3 mb-1  transition ease-in-out justify-start"
              >
                <span className="ml-2">
                  <LogOut size={20} color="red" />
                </span>
                <span className="ml-4" id="sidebar__name">
                  {signOutItem.name}
                </span>
              </Button>
            </li>
          </ul>
        </div> */}
      </aside>

      {/* Mobile Sidebar */}
      <div className="sticky top-0 z-10 md:hidden">
        <div className="absolute bg-white w-full" data-collapse={isCollapsed}>
          <aside
            id="smallscreen__sidebar"
            className="w-72 h-[calc(100vh-64px)] bg-white transition-all border-r-2 border-gray-300 sticky top-0 max-md:absolute flex flex-col"
          >
            <ul id="smallscreen__sidebaritems" className="p-1 ">
              {sidebarItems1.map(({ name, href, icon: Icon }) => (
                <li key={name}>
                  <Button
                    is
                    onClick={() => handleNavigation(href)}
                    className="w-full text-base text-black flex px-3 py-3 mb-1 rounded-xl transition ease-in-out justify-start"
                    variant="light"
                  >
                    <span className="ml-2">
                      <Icon size={20} />
                    </span>
                    <span className="ml-4" id="sidebar__name">
                      {name}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>

            <div id="smallscreen__sidebaritems" className="mt-auto p-1 mb-4">
              <Button
                color="transparent"
                onClick={handleSignOut}
                className="w-full text-base text-black flex px-3 py-3 mb-1 rounded-xl transition ease-in-out justify-start"
              >
                <span className="ml-2">
                  <LogOut size={20} />
                </span>
                <span className="ml-4" id="sidebar__name">
                  {signOutItem.name}
                </span>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
