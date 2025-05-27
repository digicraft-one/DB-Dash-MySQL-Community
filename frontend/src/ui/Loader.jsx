import { FaSpinner } from "react-icons/fa";
import { GiSpinningBlades } from "react-icons/gi";

const Loader = () => {
    const funnyMessages = [
        "Asking the database nicely... 🙏",
        "Making SQL do backflips 🤸‍♂️",
        "Politely bribing the server 🍩",
        "Looking busy while we wait ⏳",
        "Fetching data like it owes us money 💸",
        "The query has entered stealth mode 🕵️",
        "Talking to the database... it's shy 🤫",
        "Kicking the query engine gently 🦵💻",
        "Loading... or pretending to 🤔",
        "Spinning up some magic ✨",
        "Translating binary into vibes 💫",
        "Almost done... probably... maybe 🐢",
        "Querying. Definitely not panicking 😬",
        "Just a little more... trust us 🤞",
        "Database said 'brb' 😐",
        "Doing that thing you asked. Slowly. 😅",
        "Meanwhile, in a server far, far away... 🌌",
        "Shouting at the backend 📣",
        "Trying very hard not to timeout 😤",
        "One does not simply fetch rows 🧙‍♂️",
    ];

    const randomMessage =
        funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 z-[9999] overflow-hidden">
            {/* Main loader */}
            <div className="relative flex flex-col items-center justify-center gap-4 z-10">
                <div className="relative">
                    <GiSpinningBlades className="text-5xl text-blue-400 animate-spin opacity-70" />
                    <FaSpinner className="absolute inset-0 m-auto text-3xl text-blue-500 animate-spin" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping opacity-0" />
                </div>

                <div className="text-center space-y-2">
                    <p className="text-blue-400 font-mono text-lg animate-pulse">
                        {randomMessage}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Loader;
