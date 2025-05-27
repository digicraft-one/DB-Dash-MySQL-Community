import { Outlet } from "react-router-dom";
import DataBaseList from "../components/DataBaseList.jsx";
import Header from "../ui/Header.jsx";
import { ResizablePanels } from "../ui/ResizeablePanels.jsx";

const HomeLayoutWrapper = () => (
    <HomeLayout top={<Header />} center={<Outlet />} left={<DataBaseList />} />
);

const HomeLayout = ({ top, center, left }) => {
    return (
        <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden flex flex-col">
            <div className="flex-1 flex overflow-hidden">
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
                    minWidth={250}
                />
            </div>
        </div>
    );
};

export default HomeLayoutWrapper;
