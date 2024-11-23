import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Hall from './components/Hall';
import HallForm from './components/HallForm';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import Ten from './components/Ten';
import TenForm from './components/TenForm';


function Layout() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dispatch(sessionActions.restoreUser()).then(() => {
      setIsLoaded(true)
    });
  }, [dispatch]);

  return (
    <>
      <Navigation isLoaded={isLoaded} />
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
          element: <Landing />
        },
        {
          path:'/hall',
          element: <Hall />
        },
        {
          path:'ten',
          element:<Ten />
        }

      ]
    }
  ])
}

export default App;
