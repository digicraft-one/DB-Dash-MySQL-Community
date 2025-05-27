import { Suspense, useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./index.css";
import routes from "./routes.jsx";
import Loader from "./ui/Loader.jsx";
import ScreenSizeWarning from "./ui/ScreenSizeWarning.jsx";

const App = () => {
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        // Sorry, i created the entire app at 80% zoom on my browser 😭
        const zoomLevel = 0.8;
        document.documentElement.style.setProperty(
            "font-size",
            `${zoomLevel * 100}%`,
        );

        // Saamsoong ka phone not allowed 😤
        let isMobileDevice;
        if (navigator.userAgentData)
            isMobileDevice = navigator.userAgentData.mobile;
        else
            isMobileDevice =
                /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent,
                );

        setIsAllowed(!isMobileDevice);

        // Chota screen not allowed 😤
        // const minWidth = 768;
        // const checkScreen = () => setIsAllowed(window.innerWidth >= minWidth);
        // checkScreen();
        // window.addEventListener("resize", checkScreen);
        // return () => window.removeEventListener("resize", checkScreen);
    }, []);

    if (!isAllowed) return <ScreenSizeWarning />;

    const router = createBrowserRouter(routes);

    return (
        <>
            <Suspense fallback={<Loader />}>
                <RouterProvider router={router} />
            </Suspense>
            <ToastContainer
                autoClose={2000}
                position="top-center"
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </>
    );
};

export default App;
