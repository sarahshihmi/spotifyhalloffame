import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import * as sessionActions from './store/session';
import Hall from './components/Hall';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import Ten from './components/Ten';
import SearchArtist from "./components/SearchArtist";
import SearchTrack from "./components/SearchTrack";



function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf/restore", {
          credentials: "include", // Ensures cookies are included
        });
        if (!response.ok) throw new Error("Failed to restore CSRF token");
        console.log("CSRF token restored");
      } catch (err) {
        console.error("Error fetching CSRF token:", err);
      }
    };

    fetchCsrfToken(); // Fetch CSRF token on app load
    dispatch(sessionActions.restoreUser()).then(() => {
      setIsLoaded(true);
    });
  }, [dispatch]);

  return (
    <>
      <Navbar isLoaded={isLoaded} />
      {isLoaded && <Outlet />}
    </>
  );
}


const App = () => {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <Landing />,
        },
        {
          path: '/hall',
          element: <Hall />,
        },
        {
          path: '/ten',
          element: <Ten />,
        },
        {
          path: "/search-artist",
          element: <SearchArtist />,
        },
        {
          path: "/search-track",
          element: <SearchTrack />,
        },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
};

export default App;
