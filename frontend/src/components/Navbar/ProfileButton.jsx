import { useState, useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import { FaUserCircle } from 'react-icons/fa'
import * as sessionActions from "../../store/session"
import { useNavigate } from "react-router-dom"
import "./ProfileButton.css"

function ProfileButton ({user}){
    const dispatch = useDispatch() //this is the hook that allows the component to send actions to the Redux store to update the state.
    const [showMenu, setShowMenu] = useState(false) //showMenu = state, setShowMenu= update state. false because we don't want it to show first.
    const ulRef = useRef() // creates a ref to checking/manipulating a DOM element, checking if clicks are within or outside the ulRef element.
    const toggleMenu = (e) => {
        e.stopPropagation() // keep from bubbling up and triggering close menu
        setShowMenu(!showMenu) // toggle the showMenu state. if false, becomes true (show), vice versa
    }

    useEffect(() => {  //when the menu is open (showMenu===true), clicking outside will close it.
        if (!showMenu) return //if showMenu is false, the function doesn't run (no need to close a closed menu)

        const closeMenu = (e) => {
            if (!ulRef.current.contains(e.target)) { //if the click did NOT! happen inside the menu (e.target)
                setShowMenu(false) //close it.
            }
        }

        document.addEventListener("click", closeMenu) // if anyone clicks somewhere on the page, close menu. (only when menu is open tho)

        return () => document.removeEventListener("click", closeMenu) //cleanup: removes the click event listener when menu is closed or component unmounts
    }, [showMenu])

    const closeMenu = () => setShowMenu(false) 

    const navigate = useNavigate()

    const logout= (e) => {
        e.preventDefault() // prevent default form submission
        dispatch(sessionActions.logout()) // logs out
        closeMenu() // closes menu
        navigate('/') // goes back to landing
    }

    const ulClassName = "profile-dropdown" + (showMenu ? "" : " hidden")

    return (
        <>
            <div onClick={toggleMenu}>
                <FaUserCircle/>
            </div>
            <div className = {ulClassName} ref={ulRef}>
                {user ? (
                    <>
                    <div>Hello, {user.display_name}</div>
                    <button onClick={logout}>Log Out</button>
                    </>
                ) : (
                    <button onClick={() => (window.location.href = '/api/spotify/login')}>Log In</button>
                )}
            </div>
        </>
    )
}

export default ProfileButton;