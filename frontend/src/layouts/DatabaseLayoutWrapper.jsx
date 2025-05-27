import { Outlet } from "react-router-dom";
import TablesList from "../components/tables/TablesList.jsx";
import NavBar from "../components/DatabaseNavBar.jsx";
import Header from "../ui/Header.jsx";
import { ResizablePanels } from "../ui/ResizeablePanels.jsx";

const DatabaseLayoutWrapper = () => (
    <DatabaseLayout
        top={<Header />}
        center={<Outlet />}
        left={<TablesList />}
        right={<NavBar />}
    />
);

const DatabaseLayout = ({ top, center, left, right }) => {
    return (
        <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
            <div className="flex-1 overflow-hidden">
                <ResizablePanels
                    left={left}
                    center={
                        <>
                            <div className="h-[10%] flex justify-center items-center flex-shrink-0 px-4 ">
                                {top}
                            </div>
                            <div className="h-[90%] p-4 overflow-y-auto">
                                {center}
                            </div>
                        </>
                    }
                    right={right}
                    minWidth={200}
                />
            </div>
        </div>
    );
};

export default DatabaseLayoutWrapper;
