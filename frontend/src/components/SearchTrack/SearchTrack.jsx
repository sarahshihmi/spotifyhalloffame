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
  const [selectedRank, setSelectedRank] = useState(null); // New state variable
  const [existingEntry, setExistingEntry] = useState(null); // Track existing entry
  const [conflictingEntry, setConflictingEntry] = useState(null); // Track conflicting entry for ten
  const [showConfirmation, setShowConfirmation] = useState(false); // Toggle confirmation screen
  const [loading, setLoading] = useState(false); // Loading state
  mode = searchParams.get("mode") || "hall";

  const navigate = useNavigate();

  const artistId = searchParams.get("artistId");
  const entryId = searchParams.get("entryId"); // Retrieve entryId if editing

  const handleSearch = async () => {
    try {
      setSearchPerformed(true);
      setLoading(true); // Start loading
      
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
        setLoading(false); // Stop loading
        return;
      }
      const data = await response.json();
      setTrackResults(data.tracks); // Update with filtered tracks
    } catch (err) {
      console.error("Error fetching tracks:", err);
    } finally {
      setLoading(false); // Ensure loading is stopped
    }
  };

  // ADD THIS FUNCTION BACK INTO YOUR CODE
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
        song_id: selected.id,
      };

      let endpoint = `/api/${mode}`;
      let method = "POST";

      // Check if editing a Hall of Fame entry
      if (entryId && mode === "hall") {
        endpoint = `/api/hall/${entryId}`;
        method = "PUT";
      }
      // Check if editing a Top Ten entry
      else if (entryId && mode === "ten-edit") {
        endpoint = `/api/ten/${entryId}`;
        method = "PUT";
        const rank = prompt("Enter the new rank for this song (1-15):"); // Prompt for rank
        if (!rank || isNaN(rank) || rank < 1 || rank > 15 || !Number.isInteger(Number(rank))) {
          alert("Invalid rank! Please enter a whole number between 1 and 15.");
          return;
        }
        body.rank = parseInt(rank, 10);
        setSelectedRank(parseInt(rank, 10)); // Store the rank
      }
      // Add a new Top Ten entry
      else if (mode === "ten") {
        const rank = prompt("Enter the rank for this song (1-15):");
        if (!rank || isNaN(rank) || rank < 1 || rank > 15 || !Number.isInteger(Number(rank))) {
          alert("Invalid rank! Please enter a whole number between 1 and 15.");
          return;
        }
        body.rank = parseInt(rank, 10);
        setSelectedRank(parseInt(rank, 10)); // Store the rank
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
        if (mode === "ten" || mode === "ten-edit") {
          setConflictingEntry(data.data); // For ten, capture conflicting rank or song entry
        } else if (mode === "hall") {
          setExistingEntry(data.data); // For hall, capture conflicting hall entry
        }
        setShowConfirmation(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to add or edit entry");
      }

      // Navigate back to the appropriate page after success
      navigate(mode === "hall" ? "/hall" : "/ten");
    } catch (err) {
      console.error(
        `Error adding or editing track in ${
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

      if (!selected || !token) {
        console.error("Missing selected track or token");
        throw new Error("Authorization or selection error");
      }

      // Determine endpoint and rank for update based on mode
      let endpoint;
      let rankToUpdate;

      if ((mode === "ten" || mode === "ten-edit") && conflictingEntry) {
        endpoint = `/api/ten/${conflictingEntry.id}`;
        rankToUpdate = selectedRank; // Use the stored rank
      } else if (mode === "hall" && existingEntry) {
        endpoint = `/api/hall/${existingEntry.id}`;
        // No rank needed for hall entries
      } else {
        console.error("No conflicting entry found for overwrite");
        throw new Error("Conflicting entry missing");
      }

      const body = {
        artist_name: selected.artists[0].name,
        song_name: selected.name,
        artist_id: selected.artists[0].id,
        song_id: selected.id,
      };

      if (rankToUpdate !== undefined) {
        body.rank = rankToUpdate;
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": getCsrfTokenFromCookie(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to overwrite entry");
      }

      navigate(mode === "hall" ? "/hall" : "/ten"); // Navigate back after overwrite
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
          {loading ? (
            <p className="loading-message">Loading...</p>
          ) : searchPerformed && trackResults.length === 0 ? (
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
