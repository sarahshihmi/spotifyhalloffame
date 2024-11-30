import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux";
import { useSearchParams } from 'react-router-dom';
import { loginSpotifyUser } from '../../store/session';
import { NavLink } from 'react-router-dom';

const Hall = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const sessionUser = useSelector((state) => state.session.user);
  const [songs, setSongs] = useState([]); // State to store songs

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      console.log("Logging in with token:", token); // Debug
      dispatch(loginSpotifyUser(token)); // Dispatch login action
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    const fetchSongs = async () => {
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
        console.log('Fetched songs:', data);
        setSongs(data.data); // Assuming data.data contains the songs
      } catch (err) {
        console.error('Error fetching songs:', err);
      }
    };

    if (sessionUser) fetchSongs();
  }, [sessionUser]); // Fetch songs only when sessionUser changes

  if (!sessionUser) {
    return <div>Please log in to view the Hall of Fame.</div>;
  }

  return (
    <div className="hall-container">
      <header className="hall-header">
        <h1>The Spotify Hall of Fame</h1>
        <p>
          By {sessionUser.firstName} {sessionUser.lastName}
        </p>
      </header>

      <div className="hall-actions">
        <button className="sort-button">Sort</button>
        <NavLink to="/search-artist?mode=hall" className="add-button">
          Add
        </NavLink>
      </div>

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
                <div className="album-art-placeholder">No Image</div>
              )}
              <p className="artist-name">{song.artist_name}</p>
              <p className="song-title">{song.song_name}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Hall;
