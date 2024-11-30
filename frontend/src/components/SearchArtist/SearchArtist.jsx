import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
    <div>
      <h2>Select an Artist</h2>
      <input
        type="text"
        placeholder="Enter artist name"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      <div>
        {artistResults.map((artist) => (
          <div key={artist.id} onClick={() => handleSelectArtist(artist.id)}>
            <img src={artist.images?.[0]?.url} alt={artist.name} width={50} height={50} />
            <p>{artist.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchArtist;
