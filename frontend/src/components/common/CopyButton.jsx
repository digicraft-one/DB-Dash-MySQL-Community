import { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";

const CopyButton = ({ position = "top-right", query, shortcutKey = "" }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(query);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const positionClasses = {
        "top-right": "top-4 right-4",
        "top-left": "top-4 left-4",
        "bottom-right": "bottom-4 right-4",
        "bottom-left": "bottom-4 left-4",
    };

    return (
        <button
            onClick={handleCopy}
            title={`Copy to clipboard ${shortcutKey}`}
            className={`absolute ${positionClasses[position]} z-20 p-2 rounded-md bg-gray-700/50 border-gray-700 border hover:bg-gray-600/80 transition-all duration-200`}
        >
            {copied ? (
                <FaCheck
                    className={`w-4 h-4 text-green-400 hover:text-green-400 `}
                />
            ) : (
                <FaCopy className="w-4 h-4 text-gray-400 hover:text-white" />
            )}
        </button>
    );
};

export default CopyButton;
