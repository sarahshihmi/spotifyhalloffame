import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import './SearchTrack.css'

const getCsrfTokenFromCookie = () => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const SearchTrack = ({ mode }) => {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [trackResults, setTrackResults] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false); 
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [existingEntry, setExistingEntry] = useState(null); // Track existing entry
  const [conflictingEntry, setConflictingEntry] = useState(null); // Track conflicting entry for ten
  const [showConfirmation, setShowConfirmation] = useState(false); // Toggle confirmation screen
  mode = searchParams.get("mode") || "hall";

  const navigate = useNavigate();

  const artistId = searchParams.get("artistId");
  const entryId = searchParams.get("entryId"); // Retrieve entryId if editing

  const handleSearch = async () => {
    try {
      setSearchPerformed(true); 
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
          setTrackResults([]);
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

      const body = {
        artist_name: selected.artists[0].name,
        song_name: selected.name,
        artist_id: selected.artists[0].id,
      };

      let endpoint = `/api/${mode}`;
      let method = "POST";

      if (mode === "ten-edit" && entryId) {
        endpoint = `/api/ten/${entryId}`;
        method = "PUT";
      } else if (mode === "ten") {
        const rank = prompt("Enter the rank for this song (1-15):");
        if (!rank || isNaN(rank) || rank < 1 || rank > 15 || !Number.isInteger(Number(rank))) {
          alert("Invalid rank! Please enter a whole number between 1 and 15.");
          return;
        }
        body.rank = parseInt(rank, 10);
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": getCsrfTokenFromCookie(),
        },
        body: JSON.stringify(body),
      });

      if (response.status === 409) {
        const data = await response.json();
        if (mode === "ten") {
          setConflictingEntry(data.data); // For ten, capture conflicting rank entry
        } else if (mode === "hall") {
          setExistingEntry(data.data); // For hall, capture conflicting hall entry
        }
        setShowConfirmation(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to add entry");
      }

      navigate(`/${mode === "ten-edit" ? "ten" : mode}`);
    } catch (err) {
      console.error(
        `Error adding track to ${
          mode === "hall" ? "Hall of Fame" : "Top Ten List"
        }:`,
        err
      );
    }
  };

  const handleOverwrite = async () => {
    try {
      const selected = trackResults.find((track) => track.id === selectedTrack);
      const token = localStorage.getItem("token");

      let endpoint = `/api/hall/${existingEntry?.id}`;
      if (mode === "ten" && conflictingEntry) {
        endpoint = `/api/ten/${conflictingEntry.id}`;
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": getCsrfTokenFromCookie(),
        },
        body: JSON.stringify({
          artist_name: selected.artists[0].name,
          song_name: selected.name,
          artist_id: selected.artists[0].id,
          rank: conflictingEntry?.rank || undefined, // Include rank for ten
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to overwrite entry");
      }

      navigate(mode === "hall" ? "/hall" : "/ten");
    } catch (err) {
      console.error("Error overwriting entry:", err);
    }
  };

  const handleKeepEntry = () => {
    setShowConfirmation(false); // Close confirmation screen
    setConflictingEntry(null); // Reset conflicting entry
    setExistingEntry(null); // Reset existing entry
  };

  return (
    <div className="search-track-container">
    <div className="search-track-header">Select a Song</div>
    <input
      type="text"
      className="search-track-input"
      placeholder="Enter song name"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
    <button
      onClick={handleSearch}
      className={`search-track-button ${!searchInput ? "disabled" : ""}`}
      disabled={!searchInput}
    >
      Search
    </button>
  
    {showConfirmation ? (
      <div className="search-track-confirmation">
        {conflictingEntry ? (
          <div>
            You currently have <b>{conflictingEntry.song_name}</b> as Rank{" "}
            <b>{conflictingEntry.rank}</b>.
          </div>
        ) : (
          <div>
            You currently have <b>{existingEntry.song_name}</b> as your{" "}
            <b>{existingEntry.artist_name}</b> entry.
          </div>
        )}
        <button className="search-track-confirmation-button" onClick={handleOverwrite}>
          Change it.
        </button>
        <button className="search-track-confirmation-button" onClick={handleKeepEntry}>
          Keep it.
        </button>
      </div>
    ) : (
      <div className="search-track-results">
        {searchPerformed && trackResults.length === 0 ? (
          <p className="no-results-message">No results found. Try a different search term!</p>
        ) : (
          <>
            {trackResults.map((track) => (
              <div
                key={track.id}
                className={`search-track-card ${
                  track.id === selectedTrack ? "selected" : ""
                }`}
                onClick={() => handleSelectTrack(track.id)}
              >
                <img
                  src={track.album.images?.[0]?.url}
                  alt={track.name}
                  className="search-track-image"
                />
                <p className="search-track-name">{track.name}</p>
              </div>
            ))}
            {/* Show confirm button only if there has been a search and a track is selected */}
            {searchPerformed && selectedTrack && (
              <button
                className={`search-track-confirm-button ${
                  !selectedTrack ? "disabled" : ""
                }`}
                onClick={handleConfirmSelection}
                disabled={!selectedTrack}
              >
                Confirm Selection
              </button>
            )}
          </>
        )}
      </div>
    )}
  </div>
  
  );
};

export default SearchTrack;
