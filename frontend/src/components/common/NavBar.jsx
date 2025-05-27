import { memo } from "react";
import { FaDatabase, FaHome, FaTable } from "react-icons/fa";
import { NavLink, useParams } from "react-router-dom";

const ViewModeItem = memo(({ item }) => {
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
                <item.icon className="size-7 font-extralight" />
            </span>
            <span className="absolute opacity-0 scale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 truncate max-w-[80px] px-1">
                {item.name}
            </span>
        </NavLink>
    );
});

const NavBar = memo(() => {
    const { dbName, tableName } = useParams();
    const viewModes = [
        {
            path: "/home",
            icon: FaHome,
            name: "Home",
            exact: true,
            title: "Go to Home",
        },
        {
            path: `/home/${dbName}`,
            icon: FaDatabase,
            name: dbName,
            exact: tableName ? true : false,
            title: `Go to Database ${dbName}`,
        },
    ];
    if (tableName) {
        viewModes.push({
            path: `/home/${dbName}/${tableName}`,
            icon: FaTable,
            name: tableName,
            title: `Go to Table ${tableName}`,
        });
    }

    return (
        <ul className="flex flex-col justify-end items-center space-y-6">
            {viewModes.map((item) => (
                <ViewModeItem key={item.path} item={item} />
            ))}
        </ul>
    );
});

export default NavBar;
