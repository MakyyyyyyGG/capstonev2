import React from "react";
import CreateRoom from "./CreateRoom";
import { Link, Divider, Accordion, AccordionItem } from "@nextui-org/react";
import { House, Phone, BookA, School } from "lucide-react";

const sidebarItems1 = [
  {
    name: "SidebarLink1",
    href: "/",
    icon: House,
  },
  {
    name: "SidebarLink2",
    href: "/",
    icon: Phone,
  },
  {
    name: "SidebarLink3",
    href: "/",
    icon: BookA,
  },
];

const sidebarItems2 = [
  {
    name: "SidebarLink3",
    href: "/",
    icon: School,
  },
  {
    name: "SidebarLink4",
    href: "/",
    icon: School,
  },
  {
    name: "SidebarLink5",
    href: "/",
    icon: School,
  },
];

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  return (
    <div className="sidebar__wrapper">
      <aside
        className="w-72 h-screen bg-white p-1 transition-all border-r-2 border-gray-300 sticky top-0"
        data-collapse={isCollapsed}
      >
        <ul>
          {sidebarItems1.map(({ name, href, icon: Icon }) => (
            <li key={name}>
              <Link
                href={href}
                className="inline-block text-base no-underline text-black flex px-3 py-3 mb-1 rounded-xl hover:bg-[#d9d9d9] transition ease-in-out"
              >
                <span className="ml-2">
                  <Icon /> {/* Properly render the icon component */}
                </span>
                <span className="ml-4" id="sidebar__name">
                  {name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Divider className="my-4" />
        <ul>
          {sidebarItems2.map(({ name, href, icon: Icon }) => (
            <li key={name}>
              <Link
                href={href}
                className="inline-block text-base no-underline text-black flex px-3 py-3 mb-1 rounded-xl hover:bg-[#d9d9d9] transition ease-in-out"
              >
                <span className="ml-2">
                  <Icon /> {/* Properly render the icon component */}
                </span>
                <span className="ml-4" id="sidebar__name">
                  {name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default Sidebar;
