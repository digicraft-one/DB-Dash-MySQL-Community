import { lazy } from "react";
import ConnectionPage from "./components/SetupConnection.jsx";
import Error404 from "./ui/Error404.jsx";

const HomeLayoutWrapper = lazy(() => import("./layouts/HomeLayoutWrapper"));
const DatabaseLayoutWrapper = lazy(() =>
    import("./layouts/DatabaseLayoutWrapper"),
);
const TableLayoutWrapper = lazy(() => import("./layouts/TableLayoutWrapper"));
const DBConnectForm = lazy(() => import("./components/DBConnectForm"));
const ConnectionDetails = lazy(() => import("./components/ConnectionDetails"));
const QueryConsole = lazy(() => import("./components/QueryConsole"));
const UserPrivileges = lazy(() => import("./components/UserPrivileges"));
const DatabaseDetails = lazy(() => import("./components/DatabaseDetails"));
const SQLCode = lazy(() => import("./components/common/Code"));
const TableData = lazy(() => import("./components/TableData"));
const TableExport = lazy(() => import("./components/TableExport"));
const TableEdit = lazy(() => import("./components/edit/TableEdit"));

const routes = [
    {
        path: "/",
        element: <ConnectionPage />,
    },
    {
        path: "/db-connection",
        element: <DBConnectForm />,
    },
    {
        path: "/home",
        element: <HomeLayoutWrapper />,
        children: [
            {
                index: true,
                element: <ConnectionDetails />,
            },
            {
                path: "query-console",
                element: <QueryConsole />,
            },
            {
                path: "users",
                element: <UserPrivileges />,
            },
        ],
    },
    {
        path: "/home/:dbName",
        element: <DatabaseLayoutWrapper />,
        children: [
            {
                index: true,
                element: <DatabaseDetails />,
            },
            {
                path: "query-console",
                element: <QueryConsole />,
            },
            {
                path: "code",
                element: <SQLCode />,
            },
        ],
    },
    {
        path: "/home/:dbName/:tableName",
        element: <TableLayoutWrapper />,
        children: [
            {
                index: true,
                element: <TableData />,
            },
            {
                path: "code",
                element: <SQLCode />,
            },
            {
                path: "export",
                element: <TableExport />,
            },
            {
                path: "edit",
                element: <TableEdit />,
            },
            {
                path: "query-console",
                element: <QueryConsole />,
            },
        ],
    },
    {
        path: "*",
        element: <Error404 />,
    },
];

export default routes;
