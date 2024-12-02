import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux";
import { useSearchParams } from 'react-router-dom';
import { loginSpotifyUser } from '../../store/session';
import { NavLink, useNavigate } from 'react-router-dom';
import './Hall.css'


const Hall = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionUser = useSelector((state) => state.session.user);
  const [songs, setSongs] = useState([]); // State to store songs
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);


  const getCsrfTokenFromCookie = () => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/); // Match the CSRF token from cookies
    return match ? decodeURIComponent(match[1]) : null; // Return the token if found
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      dispatch(loginSpotifyUser(token)); // Dispatch login action
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true); // Start loading
      try {
        const response = await fetch('/api/hall', {
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
      } finally {
        setLoading(false); // Stop loading
      }
    };
  
    if (sessionUser) fetchSongs();
  }, [sessionUser]); // Fetch songs only when sessionUser changes
  

  if (!sessionUser) {
    return <div className="not-logged-in">Please log in to view the Hall of Fame.</div>;
  }

  const handleDelete = async (id) => {
    const confirmation = window.confirm(
      "Are you sure you want to delete this entry?"
    );
  
    if (!confirmation) return;
  
    try {
      const response = await fetch(`/api/hall/${id}`, {
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
  

  return (
    <div className="hall-container">
      <header className="hall-header">
        <h1>The Spotify Hall of Fame</h1>
        <div>
          Curated by {sessionUser.display_name}
        </div>
      </header>

      <div className="hall-actions">
        <NavLink to="/search-artist?mode=hall" className="add-button">
          Add
        </NavLink>
        <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>
      {loading ? (
      <p className="loading-message">Loading...</p>
    ) : (
      <div className="hall-grid">
        {songs.length === 0 ? (
          <p>No songs added yet. Click Add to start!</p>
        ) : (
          songs.map((song) => (
            <div key={song.id} className="song-card">
              {song.albumImage ? (
                <img
                  src={song.albumImage}
                  alt={`${song.song_name} Album Cover`}
                  className="album-art"
                />
              ) : (
                <div className="album-art-placeholder">Image Unavaliable!</div>
              )}
              <p className="artist-name">{song.artist_name}</p>
              <p className="song-title">{song.song_name}</p>

              {isEditing && (
                <div className="edit-actions">
                  <button
                    className="change-button"
                    onClick={() =>
                      navigate(
                        `/search-track?artistId=${song.artist_id}&mode=hall&entryId=${song.id}`
                      )
                    }
                  >
                    Edit
                  </button>
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
    )}
  </div>
);
}

export default Hall;