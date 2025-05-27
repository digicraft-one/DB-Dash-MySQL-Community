import { memo } from "react";
import { FaCode, FaFolder, FaTerminal, FaUsers } from "react-icons/fa";
import { NavLink, useParams } from "react-router-dom";
import NavBar from "./common/NavBar";

const NavBarItem = memo(({ item }) => {
    return (
        <NavLink
            to={item.path}
            end={item.exact}
            title={item.title}
            className={({ isActive }) =>
                `group relative flex justify-center items-center text-xl font-serif size-12 rounded-lg transition-all ${
                    isActive ? "text-purple-400" : "text-cyan-400"
                }`
            }
        >
            <span className="absolute group-hover:opacity-0 group-hover:scale-0 transition-all duration-500">
                {item.icon}
            </span>
            <span className="absolute text-center opacity-0 scale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                {item.name}
            </span>
        </NavLink>
    );
});

const DatabaseNavBar = () => {
    const { dbName } = useParams();
    const basePath = `/home/${dbName}`;
    const navItems = [
        {
            path: `${basePath}`,
            name: "Overview",
            icon: <FaFolder className="size-6" />,
            exact: true,
            title: "Database Overview",
        },
        {
            path: `${basePath}/code`,
            icon: <FaCode className="size-6" />,
            name: "Code",
            title: "MySQL Code for the database",
        },
        {
            path: `${basePath}/query-console`,
            name: "Query Console",
            icon: <FaTerminal className="size-6" />,
            title: "Interactive MySQL command-line interface",
        },
    ];

    return (
        <div className="h-full bg-gray-900 border-b border-gray-700 py-10 flex flex-col justify-between">
            <NavBar />
            <ul className="flex flex-col justify-end items-center space-y-6">
                {navItems.map((item) => (
                    <NavBarItem key={item.path} item={item} />
                ))}
            </ul>
        </div>
    );
};

export default DatabaseNavBar;
