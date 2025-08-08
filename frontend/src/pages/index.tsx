import React, { useState, FormEvent, useEffect } from "react";
import styles from "../styles/Playlist.module.css";
import API from "../api/API";

const Playlist: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Tag[]>([]);
  const [expandedTagPanel, setExpandedTagPanel] = useState<string | null>(null);
  const [creatingTagForSong, setCreatingTagForSong] = useState<string | null>(
    null
  );
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#526afe");

  // Load playlists and tags once on mount
  useEffect(() => {
    API.getPlaylists().then(setPlaylists);
    API.getTags().then(setTags);
  }, []);

  // Create playlist
  const handleCreatePlaylist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const created = await API.addPlaylist(newPlaylistName.trim());
    setPlaylists((prev) => [...prev, created]);
    setShowCreate(false);
    setNewPlaylistName("");
  };

  // Add song to playlist
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

  // Delete song
  const handleDeleteSong = async (playlistId: string, songId: string) => {
    await API.deleteSong(songId);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          : p
      )
    );
    if (expandedTagPanel === songId) setExpandedTagPanel(null);
    if (creatingTagForSong === songId) setCreatingTagForSong(null);
  };

  // Delete playlist
  const handleDeletePlaylist = async (playlistId: string) => {
    await API.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  // Check if song already has the tag
  const songHasTag = (song: Song, tag: Tag) =>
    song.tags.some((t) => t.id === tag.id);

  // Optimistic tag song with existing tag
  const handleTagSong = async (
    playlistId: string,
    songId: string,
    tagId: string
  ) => {
    const tagToAdd = tags.find((t) => t.id === tagId);
    if (!tagToAdd) return;

    // Optimistically update UI by adding tag to song
    setPlaylists((pls) =>
      pls.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              songs: p.songs.map((s) => {
                if (s.id !== songId) return s;
                // Avoid duplicates
                if (s.tags.some((t) => t.id === tagId)) return s;
                return { ...s, tags: [...s.tags, tagToAdd] };
              })
            }
          : p
      )
    );

    try {
      // Sync with backend
      const updatedSong = await API.tagSong(songId, tagId);
      // Replace with latest backend data
      setPlaylists((pls) =>
        pls.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                songs: p.songs.map((s) => (s.id === songId ? updatedSong : s))
              }
            : p
        )
      );
    } catch (error) {
      // Rollback if API call fails
      setPlaylists((pls) =>
        pls.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                songs: p.songs.map((s) => {
                  if (s.id !== songId) return s;
                  return {
                    ...s,
                    tags: s.tags.filter((t) => t.id !== tagId)
                  };
                })
              }
            : p
        )
      );
      console.error("Failed to tag song:", error);
    }
  };

  const handleCreateTagForSong = async (
    playlistId: string,
    songId: string,
    e: FormEvent
  ) => {
    e.preventDefault();

    try {
      // Create the new tag in backend
      const newTag = await API.addTag(newTagColor, newTagName);

      // Optimistically update the global tags list to include the new tag (so it appears in the modal)
      setTags((prev) => [...prev, newTag]);

      // Do NOT optimistically update song tags here (remove previous tag addition)
      // Instead call tagSong and update UI only after success
      const updatedSong = await API.tagSong(songId, newTag.id);

      // Update playlists with authoritative updated song info
      setPlaylists((pls) =>
        pls.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                songs: p.songs.map((s) => (s.id === songId ? updatedSong : s))
              }
            : p
        )
      );
    } catch (error) {
      // On failure, you may want to remove new tag from global tags list
      // (if you optimistically added it above)
      setTags((prev) => prev.filter((t) => t.id !== newTag?.id));

      console.error("Failed to create and tag new tag:", error);
    }

    setNewTagName("");
    setNewTagColor("#526afe");
    setCreatingTagForSong(null);
    setExpandedTagPanel(songId);
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
              <div className={styles.playlistTitleRow}>
                <div className={styles.playlisttitle}>{pl.name}</div>
                <button
                  className={styles.playlistDeleteBtn}
                  onClick={() => handleDeletePlaylist(pl.id)}
                  aria-label="Delete playlist"
                  title="Delete playlist"
                >
                  {/* Trash icon SVG */}
                  <svg height="20" width="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M6 7V15C6 15.55 6.45 16 7 16H13C13.55 16 14 15.55 14 15V7M3 7H17M8 7V15M12 7V15M4 7V17C4 17.55 4.45 18 5 18H15C15.55 18 16 17.55 16 17V7"
                      stroke="#f06c7a"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="8"
                      y="2"
                      width="4"
                      height="2"
                      rx="1"
                      stroke="#f06c7a"
                      strokeWidth="1.3"
                    />
                  </svg>
                </button>
              </div>
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
                      {/* Render tag pills below the link */}
                      <div className={styles.songTags}>
                        {song.tags &&
                          song.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className={styles.tagPill}
                              style={{ background: tag.tagColor }}
                            >
                              {tag.name}
                            </span>
                          ))}
                      </div>
                      <div className={styles.songMainRow}>
                        <button
                          className={styles.songBtn}
                          onClick={() => handleDeleteSong(pl.id, song.id)}
                          aria-label="Delete song"
                          title="Delete song"
                        >
                          🗑️
                        </button>
                        <button
                          className={styles.songBtn}
                          onClick={() =>
                            setExpandedTagPanel(
                              expandedTagPanel === song.id ? null : song.id
                            )
                          }
                          aria-label="Tag song"
                          title="Tag song"
                        >
                          🏷️ Tag
                        </button>
                      </div>
                      {expandedTagPanel === song.id && (
                        <div className={styles.tagPanel}>
                          <div className={styles.tagPanelHeader}>
                            <span style={{ fontWeight: 500 }}>
                              Add tag to song
                            </span>
                            <button
                              onClick={() => setExpandedTagPanel(null)}
                              className={styles.tagPanelClose}
                              aria-label="Close tag panel"
                              title="Close tag panel"
                            >
                              ×
                            </button>
                          </div>
                          <div className={styles.tagMenuTags}>
                            {tags.length > 0 ? (
                              tags.map((tag) => (
                                <button
                                  key={tag.id}
                                  className={styles.tagPill}
                                  style={{
                                    background: tag.tagColor,
                                    opacity: songHasTag(song, tag) ? 0.6 : 1,
                                    cursor: songHasTag(song, tag)
                                      ? "not-allowed"
                                      : "pointer"
                                  }}
                                  disabled={songHasTag(song, tag)}
                                  onClick={() =>
                                    handleTagSong(pl.id, song.id, tag.id)
                                  }
                                >
                                  {tag.name}
                                  {songHasTag(song, tag) ? " (Tagged)" : ""}
                                </button>
                              ))
                            ) : (
                              <span
                                style={{ fontSize: "0.95em", color: "#aaa" }}
                              >
                                No tags yet
                              </span>
                            )}
                          </div>
                          <div className={styles.createTagBox}>
                            {creatingTagForSong !== song.id ? (
                              <button
                                className={styles.btnadd}
                                style={{ marginTop: 10 }}
                                onClick={() => setCreatingTagForSong(song.id)}
                              >
                                + Create New Tag
                              </button>
                            ) : (
                              <form
                                className={styles.tagCreateForm}
                                onSubmit={(e) =>
                                  handleCreateTagForSong(pl.id, song.id, e)
                                }
                              >
                                <label
                                  className={styles.label}
                                  htmlFor={`new-tag-name-${song.id}`}
                                >
                                  Tag name
                                </label>
                                <input
                                  id={`new-tag-name-${song.id}`}
                                  type="text"
                                  value={newTagName}
                                  onChange={(e) =>
                                    setNewTagName(e.target.value)
                                  }
                                  placeholder="ex: Happy"
                                  required
                                  className={styles.inputlink}
                                  style={{ width: "100%" }}
                                />
                                <label
                                  className={styles.label}
                                  htmlFor={`new-tag-color-${song.id}`}
                                >
                                  Tag color
                                </label>
                                <input
                                  id={`new-tag-color-${song.id}`}
                                  type="color"
                                  value={newTagColor}
                                  onChange={(e) =>
                                    setNewTagColor(e.target.value)
                                  }
                                  style={{
                                    marginBottom: "10px",
                                    marginTop: "2px",
                                    height: "36px",
                                    width: "64px",
                                    padding: "0",
                                    border: "none",
                                    background: "none",
                                    display: "block"
                                  }}
                                />
                                <button
                                  type="submit"
                                  className={styles.btnadd}
                                  style={{ width: "100%", marginTop: 9 }}
                                >
                                  Create & Tag
                                </button>
                                <button
                                  type="button"
                                  className={styles.songBtn}
                                  style={{ marginTop: 3 }}
                                  onClick={() => setCreatingTagForSong(null)}
                                >
                                  Cancel
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      )}
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
