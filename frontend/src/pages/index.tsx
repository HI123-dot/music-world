import React, { useState, FormEvent } from "react";
import styles from "../styles/Playlist.module.css";
const Playlist: React.FC = () => {
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  const handleCreatePlaylist = () => {
    setShowCreate(true);
  };

  const handleAddMusic = (e: FormEvent) => {
    e.preventDefault();
    if (linkInput.trim()) {
      setPlaylist([...playlist, linkInput.trim()]);
      setLinkInput("");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Music Sharing Program</h1>
      {!showCreate ? (
        <button onClick={handleCreatePlaylist} >
          Create Playlist
        </button>
      ) : (
        <div className="playlist-box">
          <h2 className="playlist-title">Your Playlist</h2>

          <form onSubmit={handleAddMusic} className="form-add-music">
            <input
              type="url"
              placeholder="Paste music link (YouTube, Spotify...)"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              required
              className="input-link"
            />
            <button type="submit" className="btn-add">
              Add
            </button>
          </form>

          <ul className="playlist-list">
            {playlist.length === 0 && (
              <li className="empty-text">No music added yet.</li>
            )}
            {playlist.map((link, idx) => (
              <li key={idx} className="playlist-item">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="playlist-link"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Playlist;
