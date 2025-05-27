import { FaDesktop, FaExclamationTriangle, FaMobileAlt } from "react-icons/fa";

const ScreenSizeWarning = () => {
    const funnyMessages = [
        "This ain't no phone app, partner! 🤠",
        "MySQL doesn't fit in your pocket 📱",
        "Your phone is cute, but we need a workstation 💻",
        "Please step away from the toaster-sized screen 🔍",
        "This app eats RAM for breakfast — bring a real machine 🍽️",
        "Sorry, but this isn't optimized for thumb-typing 👎",
        "Not all heroes wear capes... some use full-size keyboards 🦸‍♂️⌨️",
        "Try again on a device that doesn’t fit in a cereal box 📦",
        "If your device fits in your hand, it's too small 🤏",
        "Your device is in ‘too portable to compute’ mode 📵",
        "Our app needs more pixels than that 👀",
        "Mobile? Nah. We need horsepower, not horsepower wheels 🐎💻",
        "Come back with a real device. Preferably one with fans. 🖥️💨",
        "No phones allowed. It's a techie thing 🤓",
    ];

    const randomMessage =
        funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-gray-900 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300`}
        >
            <div
                className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-400/30 rounded-xl p-6 max-w-2xl w-full shadow-2xl shadow-yellow-400/10 transform transition-all duration-500`}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-yellow-400/10 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-yellow-400/20 p-5 rounded-full border-2 border-yellow-400/30">
                            <FaExclamationTriangle className="text-4xl text-yellow-400 animate-bounce" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text">
                        {randomMessage}
                    </h3>

                    <p className="text-gray-300 mb-4">
                        This application requires a desktop or laptop
                        environment
                        <br />
                        to properly interface with MySQL databases.
                    </p>

                    <div className="flex items-center justify-center gap-6 my-4">
                        <div className="flex flex-col items-center group">
                            <div className="p-3 bg-gray-700 rounded-lg group-hover:bg-yellow-400/20 transition-colors duration-300">
                                <FaMobileAlt className="text-4xl text-gray-500 group-hover:text-yellow-600" />
                            </div>
                        </div>

                        <div className="text-gray-500 text-2xl animate-pulse">
                            →
                        </div>

                        <div className="flex flex-col items-center group">
                            <div className="p-3 bg-gray-700 rounded-lg group-hover:bg-green-400/10 transition-colors duration-300">
                                <FaDesktop className="text-4xl text-gray-500 group-hover:text-green-400 transition-colors duration-300" />
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-yellow-400/70 mt-4 italic animate-pulse">
                        Please switch to a computer to access this application
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScreenSizeWarning;
