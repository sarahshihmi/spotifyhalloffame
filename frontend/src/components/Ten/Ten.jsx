import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux";
import { useSearchParams } from 'react-router-dom';
import { loginSpotifyUser } from '../../store/session';
import { NavLink, useNavigate } from 'react-router-dom';
import './Ten.css';
const Ten = () => {
    const dispatch = useDispatch() // hook to dispatch actions to the store to update state
    const [searchParams] = useSearchParams() // default hook from react router to use params
    const sessionUser = useSelector ((state) => state.session.user)
    const [songs, setSongs] = useState([]); // State to store songs
    const [isEditing, setIsEditing] = useState(false);

    const navigate = useNavigate();

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

  return (
    <div className="ten-container">
    <header className="ten-header">
      <h1>The Top Ten List</h1>
      <p>Curated by {sessionUser.display_name}</p>
    </header>

    <div className="ten-actions">
      <NavLink to="/search-artist?mode=ten" className="ten-add-button">
        Add
      </NavLink>
      <button
        className="ten-edit-button"
        onClick={() => setIsEditing(!isEditing)}
      >
        {isEditing ? "Done" : "Edit"}
      </button>
    </div>

    <div className="ten-grid">
      {[1, 2, 3, 4, 5, 6].map((rank) => (
        <div className="ten-song-card" key={rank}>
          {songs.find((song) => song.rank === rank) ? (
            songs
              .filter((song) => song.rank === rank)
              .map((song) => (
                <div key={song.id}>
                  {song.albumImage ? (
                    <img
                      src={song.albumImage}
                      alt={`${song.song_name} Album Cover`}
                      className="ten-album-art"
                    />
                  ) : (
                    <div className="ten-album-art-placeholder">No Image</div>
                  )}
                  <p className="ten-artist-name">{song.artist_name}</p>
                  <p className="ten-song-title">{song.song_name}</p>
                  <p className="ten-rank">
                    {rank === 1
                      ? "The All-Time Best Song"
                      : `${rank}${getSuffix(rank)} Place`}
                  </p>
                  {isEditing && (
                    <div className="ten-edit-actions">
                      <button
                        className="ten-change-button"
                        onClick={() =>
                          navigate(
                            `/search-artist?mode=ten-edit&entryId=${song.id}`
                          )
                        }
                      >
                        Change
                      </button>
                      <button
                        className="ten-delete-button"
                        onClick={() => handleDelete(song.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="ten-placeholder">
              Waiting for {rank === 1
                ? "First Place Song"
                : `${rank}${getSuffix(rank)} Place Song`}
            </div>
          )}
        </div>
      ))}
    </div>

    <div className="ten-row-last">
      {[7, 8, 9, 10].map((rank) => (
        <div className="ten-song-card" key={rank}>
          {songs.find((song) => song.rank === rank) ? (
            songs
              .filter((song) => song.rank === rank)
              .map((song) => (
                <div key={song.id}>
                  {song.albumImage ? (
                    <img
                      src={song.albumImage}
                      alt={`${song.song_name} Album Cover`}
                      className="ten-album-art"
                    />
                  ) : (
                    <div className="ten-album-art-placeholder">No Image</div>
                  )}
                  <p className="ten-artist-name">{song.artist_name}</p>
                  <p className="ten-song-title">{song.song_name}</p>
                  <p className="ten-rank">
                    {`${rank}${getSuffix(rank)} Place`}
                  </p>
                  {isEditing && (
                    <div className="ten-edit-actions">
                      <button
                        className="ten-change-button"
                        onClick={() =>
                          navigate(
                            `/search-artist?mode=ten-edit&entryId=${song.id}`
                          )
                        }
                      >
                        Change
                      </button>
                      <button
                        className="ten-delete-button"
                        onClick={() => handleDelete(song.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="ten-placeholder">
              Waiting for {`${rank}${getSuffix(rank)} Place Song`}
            </div>
          )}
        </div>
      ))}
    </div>

    <div className="ten-honorable-mentions">
      <div className="ten-honorable-mention-title">Honorable Mentions</div>
      {songs
        .filter((song) => song.rank > 10)
        .map((song) => (
          <p key={song.id}>
            {song.artist_name} - {song.song_name}
            {isEditing && (
                    <div className="ten-edit-actions">
                      <button
                        className="ten-change-button"
                        onClick={() =>
                          navigate(
                            `/search-artist?mode=ten-edit&entryId=${song.id}`
                          )
                        }
                      >
                        Change
                      </button>
                      <button
                        className="ten-delete-button"
                        onClick={() => handleDelete(song.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
          </p>
        ))}
    </div>
  </div>
  );
}

export default Ten;