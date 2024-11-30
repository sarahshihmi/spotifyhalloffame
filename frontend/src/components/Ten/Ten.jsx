import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux";
import { useSearchParams } from 'react-router-dom';
import { loginSpotifyUser } from '../../store/session';
import { NavLink } from 'react-router-dom';
import './Ten.css';
const Ten = () => {
    const dispatch = useDispatch() // hook to dispatch actions to the store to update state
    const [searchParams] = useSearchParams() // default hook from react router to use params
    const sessionUser = useSelector ((state) => state.session.user)
    const [songs, setSongs] = useState([]); // State to store songs
    const [isEditing, setIsEditing] = useState(false);

    const getCsrfTokenFromCookie = () => {
      const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/); // Match the CSRF token from cookies
      return match ? decodeURIComponent(match[1]) : null; // Return the token if found
    };

    const getSuffix = (rank) => {
      if (rank % 10 === 1 && rank % 100 !== 11) return "st";
      if (rank % 10 === 2 && rank % 100 !== 12) return "nd";
      if (rank % 10 === 3 && rank % 100 !== 13) return "rd";
      return "th";
    };

    useEffect(() => { //side effect when component renders
        const token = searchParams.get('token');
        if (token) {
          dispatch(loginSpotifyUser(token)); // Dispatch login action
        }
      }, [dispatch, searchParams]); //dependencies: runs when dispatch or params change

      useEffect(() => {
        const fetchSongs = async () => {
          try {
            const response = await fetch('/api/ten', {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`, // Include the token
                'X-CSRF-TOKEN': localStorage.getItem('XSRF-TOKEN'), // Include the CSRF token
              },
            });
    
            if (!response.ok) {
              throw new Error('Failed to fetch songs.');
            }
    
            const data = await response.json();
            setSongs(data.data); // Assuming data.data contains the songs
          } catch (err) {
            console.error('Error fetching songs:', err);
          }
        };
    
        if (sessionUser) fetchSongs();
      }, [sessionUser]); // Fetch songs only when sessionUser changes

      if (!sessionUser) {
        return <div>Please log in to view your Top Ten List.</div>;
      }

      const handleDelete = async (id) => {
        const confirmation = window.confirm(
          "Are you sure you want to delete this entry?"
        );
      
        if (!confirmation) return;
      
        try {
          const response = await fetch(`/api/ten/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "X-CSRF-Token": getCsrfTokenFromCookie(), // Ensure this is included
            },
          });
      
          if (!response.ok) {
            throw new Error("Failed to delete the entry.");
          }
      
          // Remove the deleted song from the UI
          setSongs((prevSongs) => prevSongs.filter((song) => song.id !== id));
          alert("Entry deleted successfully.");
        } catch (err) {
          console.error("Error deleting the entry:", err);
          alert("Failed to delete the entry. Please try again.");
        }
      };

      console.log(songs)
      return (
        <div className="ten-container">
            <header className="ten-header">
                <h1>The Top Ten List</h1>
                <p>
                    By {sessionUser.display_name}
                </p>
            </header>

            <div className="ten-actions">
                <button className = "sort-button">Sort</button>
                <NavLink to ='/search-artist?mode=ten' className="add-button">Add</NavLink>
            </div>
            <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Done" : "Edit"}
          </button>

            <div className="ten-grid">
                {songs.length === 0 ? (
                    <p>No songs added yet. Click Add to start!</p>
                ) : (
                    songs.map((song)=> (
                        <div key={song.id} className="song-card">
                            {song.albumImage ? (
                                <img
                                    src={song.albumImage}
                                    alt={`${song.song_name} Album Cover`}
                                    className="album-art"
                                />
                            ) : (
                                <div className="album-art-placeholder">No Image</div>
                            )}
                             <p className="artist-name">{song.artist_name}</p>
                            <p className="song-title">{song.song_name}</p>
                            <p className="rank">  {song.rank === 1 
                                ? "The Best All-Time Song" 
                                : song.rank >= 2 && song.rank <= 10 
                                ? `${song.rank}${getSuffix(song.rank)} place` 
                                : "Honorable Mention"}
                              </p>

                            {isEditing && (
                    <div className="edit-actions">
                      <NavLink
                        to={`/search-artist?mode=ten-edit&entryId=${song.id}`}
                        className="add-button"
                      >
                        Change
                      </NavLink>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(song.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                        </div>
                    ))
                )}
            </div>
        </div>
      )
};

export default Ten;
