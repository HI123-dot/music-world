import React, { useState, FormEvent, useEffect, useRef } from "react";
import styles from "../styles/Playlist.module.css";
import API from "../api/API";

const PenIcon = ({ size = 16, color = "#16a085" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    fill={color}
    viewBox="0 0 24 24"
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34a1.25 1.25 0 0 0 0-1.77l-2-2a1.25 1.25 0 0 0-1.77 0l-1.83 1.83 3.75 3.75 1.85-1.81z" />
  </svg>
);

const Playlist: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [popupSongId, setPopupSongId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isTypingPlaylistName, setIsTypingPlaylistName] = useState(false);
  const [nameInputs, setNameInputs] = useState<Record<string, string>>({});
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Tag[]>([]);
  const [creatingTagForSong, setCreatingTagForSong] = useState<string | null>(
    null
  );
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2ecc71");

  const playlistNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    API.getPlaylists().then(setPlaylists);
    API.getTags().then(setTags);
  }, []);

  useEffect(() => {
    if (isTypingPlaylistName && playlistNameInputRef.current) {
      playlistNameInputRef.current.focus();
    }
  }, [isTypingPlaylistName]);

  const submitNewPlaylist = async () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) {
      setIsTypingPlaylistName(false);
      setNewPlaylistName("");
      return;
    }
    const created = await API.addPlaylist(trimmed);
    setPlaylists((prev) => [...prev, created]);
    setNewPlaylistName("");
    setIsTypingPlaylistName(false);
    setSelectedPlaylistId(created.id);
  };

  const handleNewPlaylistNameKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitNewPlaylist();
    } else if (e.key === "Escape") {
      setIsTypingPlaylistName(false);
      setNewPlaylistName("");
    }
  };

  const handleAddMusic = async (e: FormEvent, playlistId: string) => {
    e.preventDefault();
    const name = nameInputs[playlistId]?.trim() || "Untitled";
    const link = linkInputs[playlistId]?.trim();
    if (!link) return;
    const newSong = await API.addSong(name, link, playlistId);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId ? { ...p, songs: [...p.songs, newSong] } : p
      )
    );
    setNameInputs((inputs) => ({ ...inputs, [playlistId]: "" }));
    setLinkInputs((inputs) => ({ ...inputs, [playlistId]: "" }));
  };

  const handleDeleteSong = async (playlistId: string, songId: string) => {
    await API.deleteSong(playlistId, songId);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          : p
      )
    );
    setPopupSongId(null);
    setCreatingTagForSong(null);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await API.deletePlaylist(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) setSelectedPlaylistId(null);
  };

  const songHasTag = (song: Song, tag: Tag) =>
    song.tags.some((t) => t.id === tag.id);

  const handleTagSong = async (
    playlistId: string,
    songId: string,
    tagId: string
  ) => {
    const tagToAdd = tags.find((t) => t.id === tagId);
    if (!tagToAdd) return;
    const prevPlaylists = [...playlists];
    setPlaylists((pls) =>
      pls.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              songs: p.songs.map((s) => {
                if (s.id !== songId) return s;
                if (s.tags.some((t) => t.id === tagId)) return s;
                return { ...s, tags: [...s.tags, tagToAdd] };
              }),
            }
          : p
      )
    );
    try {
      await API.tagSong(songId, tagId);
    } catch (error) {
      setPlaylists(prevPlaylists);
      console.error("Failed to tag song:", error);
    }
  };

  const handleDeleteTag = async (
    playlistId: string,
    songId: string,
    tagId: string
  ) => {
    const prevPlaylists = [...playlists];
    setPlaylists((pls) =>
      pls.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              songs: p.songs.map((s) => {
                if (s.id !== songId) return s;
                return {
                  ...s,
                  tags: s.tags.filter((t) => t.id !== tagId),
                };
              }),
            }
          : p
      )
    );
    try {
      await API.deleteTag(songId, tagId);
    } catch (error) {
      setPlaylists(prevPlaylists);
      console.error("Failed to delete tag from song:", error);
    }
  };

  const handleCreateTagForSong = async (songId: string, e: FormEvent) => {
    e.preventDefault();
    try {
      const newTag = await API.addTag(newTagColor, newTagName);
      setTags((prev) => [...prev, newTag]);
      await API.tagSong(songId, newTag.id);
      const refreshedPlaylists = await API.getPlaylists();
      setPlaylists(refreshedPlaylists);
    } catch (error) {
      console.error("Failed to create and tag new tag:", error);
    }
    setNewTagName("");
    setNewTagColor("#2ecc71");
    setCreatingTagForSong(null);
    setPopupSongId(songId);
  };

  const handlePlaylistsHeadingClick = () => {
    setSelectedPlaylistId(null);
    setPopupSongId(null);
    setCreatingTagForSong(null);
  };

  return (
    <div
      style={{
        fontFamily: "monospace, monospace",
        backgroundColor: "#f9fafb",
        color: "#222",
        padding: "1rem",
      }}
    >
      <h1
        className={styles.title}
        style={{ color: "#16a085", fontWeight: 700, marginBottom: "1rem" }}
      >
        Music Sharing Program
      </h1>

      <div
        className={styles.playlistSelector}
        style={{ display: "flex", gap: "2rem" }}
      >
        <div
          style={{
            width: "22%",
            backgroundColor: "#dff0ea",
            borderRadius: 8,
            padding: "1rem",
            boxShadow: "0 2px 6px rgba(22, 160, 133, 0.2)",
            userSelect: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              fontWeight: 700,
              color: "#16a085",
              fontSize: "1.25rem",
              cursor: "pointer",
            }}
            onClick={handlePlaylistsHeadingClick}
            title="Show all playlists"
          >
            {!isTypingPlaylistName && (
              <>
                <button
                  aria-label="Create new playlist"
                  title="Create new playlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTypingPlaylistName(true);
                  }}
                  style={{
                    backgroundColor: "#16a085",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    padding: "0 0.5rem",
                    cursor: "pointer",
                    borderRadius: 4,
                    lineHeight: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  +
                </button>
                <span>Playlists</span>
              </>
            )}
            {isTypingPlaylistName && (
              <input
                ref={playlistNameInputRef}
                type="text"
                placeholder="New playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={handleNewPlaylistNameKeyDown}
                onBlur={() => {
                  setIsTypingPlaylistName(false);
                  setNewPlaylistName("");
                }}
                style={{
                  flexGrow: 1,
                  borderRadius: 5,
                  border: "1px solid #16a085",
                  padding: "0.3rem 0.5rem",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
            )}
          </div>
          {playlists.length === 0 && (
            <div style={{ color: "#7f8c8d", fontFamily: "monospace" }}>
              No playlists yet.
            </div>
          )}
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontFamily: "monospace",
              cursor: "pointer",
            }}
          >
            {playlists.map((pl) => (
              <li
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                style={{
                  backgroundColor:
                    selectedPlaylistId === pl.id ? "#a2d9ce" : "#cde5df",
                  padding: "0.75rem 1rem",
                  marginBottom: "0.5rem",
                  borderRadius: 6,
                  boxShadow:
                    selectedPlaylistId === pl.id
                      ? "1px 2px 5px rgba(22, 160, 133, 0.6)"
                      : "1px 2px 5px rgba(22, 160, 133, 0.3)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 600,
                  color: "#004d40",
                }}
              >
                <span>{pl.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlaylist(pl.id);
                  }}
                  aria-label="Delete playlist"
                  title="Delete playlist"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#e74c3c",
                    fontSize: "1.25rem",
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flexGrow: 1 }}>
          {(selectedPlaylistId
            ? playlists.filter((p) => p.id === selectedPlaylistId)
            : playlists
          ).map((pl) => (
            <div
              key={pl.id}
              style={{
                marginBottom: "2rem",
                backgroundColor: "#f0f3f4",
                padding: "1rem",
                borderRadius: 8,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                fontFamily: "monospace",
              }}
            >
              <h3
                style={{
                  marginBottom: "0.75rem",
                  color: "#34495e",
                  fontWeight: 700,
                }}
              >
                {pl.name}
              </h3>
              <form
                onSubmit={(e) => handleAddMusic(e, pl.id)}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <input
                  placeholder="Song Title"
                  value={nameInputs[pl.id] || ""}
                  onChange={(e) =>
                    setNameInputs((inputs) => ({
                      ...inputs,
                      [pl.id]: e.target.value,
                    }))
                  }
                  required
                  className={styles.inputlink}
                  style={{
                    flex: 2,
                    borderRadius: 5,
                    border: "1px solid #16a085",
                    padding: "0.4rem 0.75rem",
                    fontFamily: "monospace",
                  }}
                />
                <input
                  type="url"
                  placeholder="Music Link"
                  value={linkInputs[pl.id] || ""}
                  onChange={(e) =>
                    setLinkInputs((inputs) => ({
                      ...inputs,
                      [pl.id]: e.target.value,
                    }))
                  }
                  required
                  className={styles.inputlink}
                  style={{
                    flex: 3,
                    borderRadius: 5,
                    border: "1px solid #16a085",
                    padding: "0.4rem 0.75rem",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  type="submit"
                  className={styles.btnadd}
                  style={{
                    backgroundColor: "#16a085",
                    color: "white",
                    borderRadius: 5,
                    border: "none",
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                >
                  Add Song
                </button>
              </form>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontFamily: "monospace",
                }}
              >
                {pl.songs.length === 0 ? (
                  <li style={{ color: "#7f8c8d", fontStyle: "italic" }}>
                    No music added yet.
                  </li>
                ) : (
                  pl.songs.map((song) => (
                    <li
                      key={song.id}
                      style={{
                        position: "relative",
                        backgroundColor: "white",
                        padding: "1rem",
                        borderRadius: 8,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                        width: "300px",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        cursor: "default",
                        fontFamily: "monospace",
                      }}
                    >
                      <a
                        href={song.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontWeight: 600,
                          color: "#16a085",
                          textDecoration: "none",
                          flexGrow: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={song.name}
                      >
                        {song.name}
                      </a>

                      <button
                        aria-label="Edit song"
                        title="Edit song"
                        onClick={() =>
                          setPopupSongId(popupSongId === song.id ? null : song.id)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <PenIcon size={18} color="#16a085" />
                      </button>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          minWidth: 80,
                          flexShrink: 0,
                          alignItems: "flex-start",
                          userSelect: "none",
                        }}
                      >
                        {song.tags.length > 0 ? (
                          song.tags.map((tag) => (
                            <span
                              key={tag.id}
                              title={tag.name}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontWeight: 600,
                                color: "#222",
                                fontSize: 14,
                                cursor: "default",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  backgroundColor: tag.tagColor,
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  display: "inline-block",
                                }}
                              />
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#7f8c8d",
                              fontStyle: "italic",
                              whiteSpace: "nowrap",
                            }}
                          >
                            No tags
                          </span>
                        )}
                      </div>

                      {popupSongId === song.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            right: 0,
                            background: "white",
                            borderRadius: 8,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            padding: "1rem",
                            width: 300,
                            zIndex: 20,
                            fontFamily: "monospace",
                            userSelect: "none",
                          }}
                        >
                          <button
                            onClick={() => handleDeleteSong(pl.id, song.id)}
                            style={{
                              backgroundColor: "#e74c3c",
                              color: "white",
                              border: "none",
                              borderRadius: 6,
                              padding: "0.5rem 1rem",
                              marginBottom: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 700,
                              width: "100%",
                              fontSize: "1rem",
                            }}
                          >
                            Delete Song
                          </button>

                          <div style={{ marginBottom: "0.75rem" }}>
                            <strong>Tags:</strong>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.75rem",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {tags.length > 0 ? (
                              tags.map((tag) => (
                                <button
                                  key={tag.id}
                                  style={{
                                    backgroundColor: tag.tagColor,
                                    opacity: songHasTag(song, tag) ? 0.6 : 1,
                                    cursor: "pointer",
                                    borderRadius: 15,
                                    border: "none",
                                    padding: "0.4rem 1rem",
                                    fontWeight: 700,
                                    color: "#fff",
                                    fontSize: "0.9rem",
                                  }}
                                  onClick={() => {
                                    if (songHasTag(song, tag)) {
                                      handleDeleteTag(pl.id, song.id, tag.id);
                                    } else {
                                      handleTagSong(pl.id, song.id, tag.id);
                                    }
                                  }}
                                  title={
                                    songHasTag(song, tag)
                                      ? `Click to remove tag "${tag.name}"`
                                      : `Click to add tag "${tag.name}"`
                                  }
                                >
                                  {tag.name}
                                  {songHasTag(song, tag) ? " ✓" : ""}
                                </button>
                              ))
                            ) : (
                              <span
                                style={{
                                  fontSize: "1rem",
                                  color: "#aaa",
                                }}
                              >
                                No tags yet
                              </span>
                            )}
                          </div>
                          <div>
                            {creatingTagForSong !== song.id ? (
                              <button
                                onClick={() => setCreatingTagForSong(song.id)}
                                style={{
                                  backgroundColor: "#3498db",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "0.5rem 1.2rem",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  fontSize: "1rem",
                                  width: "100%",
                                }}
                              >
                                + Create New Tag
                              </button>
                            ) : (
                              <form
                                onSubmit={(e) =>
                                  handleCreateTagForSong(song.id, e)
                                }
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.5rem",
                                }}
                              >
                                <input
                                  type="text"
                                  placeholder="Tag name"
                                  value={newTagName}
                                  onChange={(e) =>
                                    setNewTagName(e.target.value)
                                  }
                                  required
                                  style={{
                                    borderRadius: 6,
                                    border: "1px solid #3498db",
                                    padding: "0.6rem",
                                    fontSize: "1rem",
                                    fontFamily: "monospace",
                                  }}
                                  autoFocus
                                />
                                <input
                                  type="color"
                                  value={newTagColor}
                                  onChange={(e) =>
                                    setNewTagColor(e.target.value)
                                  }
                                  style={{
                                    height: "40px",
                                    width: "70px",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                />
                                <button
                                  type="submit"
                                  style={{
                                    backgroundColor: "#3498db",
                                    color: "white",
                                    borderRadius: 6,
                                    border: "none",
                                    padding: "0.6rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontSize: "1rem",
                                    width: "100%",
                                  }}
                                >
                                  Create & Tag
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCreatingTagForSong(null)}
                                  style={{
                                    backgroundColor: "#e74c3c",
                                    color: "white",
                                    borderRadius: 6,
                                    border: "none",
                                    padding: "0.6rem",
                                    cursor: "pointer",
                                    fontSize: "1rem",
                                    width: "100%",
                                  }}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Playlist;
