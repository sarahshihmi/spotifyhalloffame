import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const getCsrfTokenFromCookie = () => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const SearchTrack = () => {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [trackResults, setTrackResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [existingEntry, setExistingEntry] = useState(null); // Track existing entry
  const [showConfirmation, setShowConfirmation] = useState(false); // Toggle confirmation screen
  
  const navigate = useNavigate();

  const artistId = searchParams.get("artistId");

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `/api/spotify/search-tracks?query=${searchInput}&artistId=${artistId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("No tracks found");
          setTrackResults([]); // Show empty results instead of crashing
        } else {
          throw new Error("Failed to fetch tracks");
        }
        return;
      }
      const data = await response.json();
      setTrackResults(data.tracks); // Update with filtered tracks
    } catch (err) {
      console.error("Error fetching tracks:", err);
    }
  };

  const handleSelectTrack = (trackId) => {
    setSelectedTrack(trackId);
  };

  const handleConfirmSelection = async () => {
    try {
      const selected = trackResults.find((track) => track.id === selectedTrack);
      const token = localStorage.getItem("token");
  
      if (!token) {
        console.error("No token found in localStorage");
        throw new Error("Authorization token missing");
      }
  
      const response = await fetch("/api/hall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": getCsrfTokenFromCookie(),
        },
        body: JSON.stringify({
          artist_name: selected.artists[0].name,
          song_name: selected.name,
        }),
      });
  
      if (response.status === 409) {
        const data = await response.json();
        setExistingEntry(data.data); // Capture existing entry data
        setShowConfirmation(true); // Show confirmation screen
        return;
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to add entry to Hall of Fame");
      }
  
      navigate("/hall");
    } catch (err) {
      console.error("Error adding track to Hall of Fame:", err);
    }
  };

  const handleOverwrite = async () => {
    try {
      const selected = trackResults.find((track) => track.id === selectedTrack);
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/hall/${existingEntry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": getCsrfTokenFromCookie(),
        },
        body: JSON.stringify({
          artist_name: selected.artists[0].name,
          song_name: selected.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to overwrite Hall of Fame entry");
      }

      navigate("/hall");
    } catch (err) {
      console.error("Error overwriting Hall of Fame entry:", err);
    }
  };

  const handleKeepEntry = () => {
    setShowConfirmation(false); // Close confirmation screen
  };

  return (
    <div>
      <h2>Select a Song</h2>
      <input
        type="text"
        placeholder="Enter song name"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {showConfirmation ? (
        <div>
          <p>
            You already have <b>{existingEntry.song_name}</b> as your <b>{existingEntry.artist_name}</b> entry.
          </p>
          <button onClick={handleOverwrite}>Change it.</button>
          <button onClick={handleKeepEntry}>Keep it.</button>
        </div>
      ) : (
        <div>
          {trackResults.length > 0 ? (
            trackResults.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                style={{
                  border: track.id === selectedTrack ? "2px solid gold" : "1px solid gray",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <img src={track.album.images?.[0]?.url} alt={track.name} width={50} height={50} />
                <p>{track.name}</p>
              </div>
            ))
          ) : (
            <p>No results found. Try a different search term!</p>
          )}
          {selectedTrack && (
            <button onClick={handleConfirmSelection} style={{ marginTop: "20px" }}>
              Confirm Selection
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchTrack;
