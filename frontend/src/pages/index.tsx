import React, { useState, FormEvent, useEffect } from "react";
import styles from "../styles/Playlist.module.css";
import API from "../api/API";

const Playlist: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  // Keep each playlist's input separate:
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    API.getPlaylists().then((data) => setPlaylists(data));
  }, []);

  // Create a new playlist
  const handleCreatePlaylist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = await API.addPlaylist(newPlaylistName.trim());
    setPlaylists((prev) => [...prev, created]);
    setShowCreate(false);
    setNewPlaylistName("");
  };

  // Add a song to a specific playlist
  const handleAddMusic = async (e: FormEvent, playlistId: string) => {
    e.preventDefault();
    const link = linkInputs[playlistId]?.trim();
    if (!link) return;
    const newSong = await API.addSong(link, playlistId);

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, songs: [...p.songs, newSong] } : p
      )
    );
    setLinkInputs((inputs) => ({ ...inputs, [playlistId]: "" }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Music Sharing Program</h1>

      {!showCreate ? (
        <button onClick={() => setShowCreate(true)}>Create Playlist</button>
      ) : (
        <form onSubmit={handleCreatePlaylist} className={styles.formaddmusic}>
          <input
            type="text"
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            required
            className={styles.inputlink}
          />
          <button type="submit" className={styles.btnadd}>
            Add Playlist
          </button>
        </form>
      )}

      <div className={styles.playlistSelector}>
        <h2>Your Playlists</h2>
        {playlists.length === 0 && <div>No playlists yet.</div>}
        <ul className={styles.playlistlist}>
          {playlists.map((pl) => (
            <li key={pl.id} className={styles.playlistbox}>
              <div className={styles.playlisttitle}>{pl.name}</div>
              <form
                onSubmit={(e) => handleAddMusic(e, pl.id)}
                className={styles.formaddmusic}
              >
                <input
                  type="url"
                  placeholder="Paste music link"
                  value={linkInputs[pl.id] || ""}
                  onChange={(e) =>
                    setLinkInputs((inputs) => ({
                      ...inputs,
                      [pl.id]: e.target.value
                    }))
                  }
                  required
                  className={styles.inputlink}
                />
                <button type="submit" className={styles.btnadd}>
                  Add
                </button>
              </form>
              <ul className={styles.playlistlist}>
                {pl.songs.length === 0 ? (
                  <li className={styles.emptytext}>No music added yet.</li>
                ) : (
                  pl.songs.map((song) => (
                    <li key={song.id} className={styles.playlistitem}>
                      <a
                        href={song.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.playlistlink}
                      >
                        {song.link}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Playlist;
