import { Outlet } from "react-router-dom";
import ColumnsList from "../components/ColumnsList.jsx";
import TableNavBar from "../components/TableNavBar.jsx";
import Header from "../ui/Header.jsx";
import { ResizablePanels } from "../ui/ResizeablePanels.jsx";

const TableLayoutWrapper = () => (
    <TableLayout
        top={<Header />}
        center={<Outlet />}
        left={<ColumnsList />}
        right={<TableNavBar />}
    />
);
const TableLayout = ({ top, center, left, right }) => {
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
                            <div className="h-[90%] p-4 overflow-y-scroll">
                                {center}
                            </div>
                        </>
                    }
                    right={right}
                    minWidth={250}
                />
            </div>
        </div>
    );
};

export default TableLayoutWrapper;
