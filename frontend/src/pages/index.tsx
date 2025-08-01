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
    <div className={styles.container}>
      <h1 className={styles.title}>Music Sharing Program</h1>
      {!showCreate ? (
        <button onClick={handleCreatePlaylist} >
          Create Playlist
        </button>
      ) : (
        <div className={styles.playlistbox}>
          <h2 className={styles.playlisttitle}>Your Playlist</h2>

          <form onSubmit={handleAddMusic} className={styles.formaddmusic}>
            <input
              type="url"
              placeholder="Paste music link (YouTube, Spotify...)"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              required
              className={styles.inputlink}
            />
            <button type="submit" className={styles.btnadd}>
              Add
            </button>
          </form>

          <ul className={styles.playlistlist}>
            {playlist.length === 0 && (
              <li className={styles.emptytext}>No music added yet.</li>
            )}
            {playlist.map((link, idx) => (
              <li key={idx} className={styles.playlistitem}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.playlistlink}
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
