import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import './SearchArtist.css'

const SearchArtist = () => {
  const [searchInput, setSearchInput] = useState("");
  const [artistResults, setArtistResults] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Retrieve query parameters
  const mode = searchParams.get("mode") || "hall"; 
  const entryId = searchParams.get("entryId");

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/spotify/search-artists?query=${searchInput}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch artists");
      const data = await response.json();
      setArtistResults(data); // Assuming backend returns an array of artists
    } catch (err) {
      console.error("Error fetching artists:", err);
    }
  };

  const handleSelectArtist = (artistId) => {
    navigate(`/search-track?artistId=${artistId}&mode=${mode}${entryId ? `&entryId=${entryId}` : ""}`)
  };

  return (
    <div className="search-artist-container">
    <div className="search-artist-header">Select an Artist</div>
    <input
      type="text"
      className="search-artist-input"
      placeholder="Enter artist name"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
    <button         
        className={`search-artist-button ${!searchInput && "disabled"}`}
        onClick={handleSearch}
        disabled={!searchInput}>
      Search
    </button>
    <div className="search-artist-results">
      {artistResults.map((artist) => (
        <div
          key={artist.id}
          className="search-artist-card"
          onClick={() => handleSelectArtist(artist.id)}
        >
          <img
            src={artist.images?.[0]?.url}
            alt={artist.name}
            className="search-artist-image"
          />
          <p className="search-artist-name">{artist.name}</p>
        </div>
      ))}
    </div>
  </div>
  );
};

export default SearchArtist;
