import React, { useState } from "react";
import CreateRoom from "./CreateRoom";
import { Link } from "@nextui-org/react";

const sidebarItems1 = [
  {
    name: "SidebarLink1",
    href: "/",
    icon: "i1",
  },
  {
    name: "SidebarLink2",
    href: "/",
    icon: "i2",
  },
  {
    name: "SidebarLink3",
    href: "/",
    icon: "i3",
  },
];

const sidebarItems2 = [
  {
    name: "SidebarLink3",
    href: "/",
    icon: "i3",
  },
  {
    name: "SidebarLink4",
    href: "/",
    icon: "i4",
  },
];

const Sidebar = () => {
  const [isCollapsedSidebar, setIsCollapsedSidebar] = useState(false);

  function toggleSidebarCollapseHandler() {
    setIsCollapsedSidebar((prev) => !prev);
  }

  return (
    <div className="sidebar__wrapper">
      {/* <div className="flex flex-col gap-2 my-4 w-[500px]">
        <h1>Sidebar Links</h1>
        <h1>menu 1</h1>
        <h1>menu 2</h1>
      </div> */}
      <button
        className="sidebar__menuBtn"
        onClick={toggleSidebarCollapseHandler}
      >
        ☰
      </button>
      <aside
        className="w-72 h-screen bg-white p-1 transition-all border-r-2 border-gray-300 sticky top-0"
        data-collapse={isCollapsedSidebar}
      >
        <ul className="mb-10">
          {sidebarItems1.map(({ name, href, icon }) => (
            <li key={name}>
              <Link
                href="###"
                className="inline-block text-base no-underline text-black flex px-1 py-2 mb-1 rounded-xl hover:bg-[#d9d9d9] transition ease-in-out"
              >
                <span className="ml-2">{icon}</span>
                <span className="ml-1" id="sidebar__name">
                  {name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <hr className="h-px my-8 bg-gray-300 border-0"></hr>
        <ul className="mb-10">
          {sidebarItems2.map(({ name, href, icon }) => (
            <li key={name}>
              <Link
                href="###"
                className="inline-block text-base no-underline text-black flex px-1 py-2 mb-1 rounded-xl hover:bg-[#d9d9d9] transition ease-in-out"
              >
                <span className="ml-2">{icon}</span>
                <span className="ml-1" id="sidebar__name">
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
