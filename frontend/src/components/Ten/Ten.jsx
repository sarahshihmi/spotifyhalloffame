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

      return (
        <div className="ten-container">
            <header className="ten-header">
                <h1>The Top Ten List</h1>
                <p>
                    By {sessionUser.firstName} {sessionUser.lastName}
                </p>
            </header>

            <div className="ten-actions">
                <button className = "sort-button">Sort</button>
                <NavLink to ='/search-artist?mode=ten' className="add-button">Add</NavLink>
            </div>

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
                        </div>
                    ))
                )}
            </div>
        </div>
      )
};

export default Ten;
