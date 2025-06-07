import { FaArrowRight, FaCrown, FaTimes, FaGem, FaStar } from "react-icons/fa";

const PremiumFeatureModal = ({
    title = "Unlock this powerful feature and more with our Premium offering:",
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div className="relative w-full max-w-md p-1">
                {/* Glowing Border with Enhanced Gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-animated-border z-[-1] shadow-[0_0_20px_rgba(234,179,8,0.6)]" />

                {/* Modal Content Box */}
                <div
                    className="relative z-10 max-w-md w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-8 border border-yellow-500/30"
                    style={{
                        animation:
                            "fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                        transform: "translateY(30px)",
                        opacity: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Gem Icon and Stars */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-yellow-700/50">
                        <div className="flex items-center">
                            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mr-4 flex items-center justify-center">
                                <FaGem className="text-gray-900 text-2xl animate-pulse" />
                                <FaStar className="absolute -top-1 -right-1 text-yellow-300 text-sm animate-spin-slow" />
                            </div>
                            <h3 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                                Premium Access
                            </h3>
                        </div>
                    </div>

                    {/* Content with Enhanced Typography and Icon */}
                    <div className="text-center space-y-6">
                        <p className="text-gray-200 text-lg font-medium leading-relaxed">
                            {title}
                        </p>
                        <a
                            href="https://dbdash.live/download#professional"
                            target="_blank"
                            className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-gray-900 font-bold text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(234,179,8,0.4)]"
                        >
                            Unlock Premium Now
                            <FaArrowRight className="ml-3 text-xl transition-transform duration-300 group-hover:translate-x-2" />
                        </a>
                    </div>

                    {/* Footer Note with Star Icons */}
                    <div className="mt-6 pt-4 border-t border-yellow-700/50 text-sm text-gray-300 text-center flex items-center justify-center gap-2">
                        <FaStar className="text-yellow-400" />
                        <span>
                            One-time payment. Lifetime access. No hidden fees.
                        </span>
                        <FaStar className="text-yellow-400" />
                    </div>

                    {/* Close Button with Hover Effect */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-300 hover:text-yellow-400 transition-colors duration-300 z-10"
                    >
                        <FaTimes className="text-xl" />
                    </button>

                    {/* Animation Styles */}
                    <style jsx>{`
                        @keyframes fadeInUp {
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }

                        @keyframes spinSlow {
                            0% {
                                transform: rotate(0deg);
                            }
                            100% {
                                transform: rotate(360deg);
                            }
                        }

                        .bg-animated-border {
                            background-size: 400% 400%;
                            animation: borderGradientAnim 3s ease infinite;
                            border-radius: 1rem;
                        }

                        @keyframes borderGradientAnim {
                            0% {
                                background-position: 0% 50%;
                            }
                            50% {
                                background-position: 100% 50%;
                            }
                            100% {
                                background-position: 0% 50%;
                            }
                        }

                        .animate-spin-slow {
                            animation: spinSlow 8s linear infinite;
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default PremiumFeatureModal;
