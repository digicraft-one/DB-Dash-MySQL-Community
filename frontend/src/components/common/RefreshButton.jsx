import { FiRefreshCw } from "react-icons/fi";

const RefreshButton = ({ loading, action, title }) => (
    <button
        onClick={action}
        title={loading ? "Loading..." : title}
        className="flex mt-2 items-center h-12 justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-md transition-all duration-300 shadow-md hover:scale-[1.02]"
    >
        <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />
        Refresh
    </button>
);

export default RefreshButton;
