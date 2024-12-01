import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileButton from './ProfileButton';
import spotifyhoflogo from "../../assets/spotifyhoflogo.png";
import './Navbar.css';

function Navbar({ isLoaded }) {
    const sessionUser = useSelector(state => state.session.user);

    return (
        <nav className="navBar">
            <div className="left-bar">
                <NavLink to="/">
                    <img
                        src={spotifyhoflogo}
                        alt="Home Logo"
                        className="nav-logo-icon"
                    />
                </NavLink>
            </div>

            {isLoaded && sessionUser && (
                <div className="center-bar">
                    <NavLink to="/hall" className="nav-link">
                        Hall of Fame
                    </NavLink>
                    <NavLink to="/ten" className="nav-link">
                        Top 10
                    </NavLink>
                </div>
            )}

            <div className="right-bar">
                <div className="profile-button">
                    <ProfileButton user={sessionUser} />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
