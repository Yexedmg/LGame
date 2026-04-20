import { useState, useEffect, useCallback } from "react";

const RARITY_COLORS = {
  5: { bg: "linear-gradient(135deg, #FFD700, #FFA500)", star: "#FFD700", glow: "rgba(255,215,0,0.3)", label: "5★ Legendary" },
  4: { bg: "linear-gradient(135deg, #B388FF, #7C4DFF)", star: "#B388FF", glow: "rgba(179,136,255,0.3)", label: "4★ Epic" },
  3: { bg: "linear-gradient(135deg, #64B5F6, #42A5F5)", star: "#64B5F6", glow: "rgba(100,181,246,0.3)", label: "3★ Rare" },
  2: { bg: "linear-gradient(135deg, #81C784, #66BB6A)", star: "#81C784", glow: "rgba(129,199,132,0.3)", label: "2★ Common" },
  1: { bg: "linear-gradient(135deg, #90A4AE, #78909C)", star: "#90A4AE", glow: "rgba(144,164,174,0.3)", label: "1★ Basic" },
};

const STAT_ICONS = { social: "👥", technical: "⚡", sales: "🎯", identity: "🔥" };

const DEFAULT_LOCATIONS = [
  { id: "l1", name: "Your Floor (Informatica)", type: "Daily Hub", drops: ["Same-major peers", "Weak ties (passive)", "Reputation XP", "Group project partners"], difficulty: "Easy", visited: true },
  { id: "l2", name: "Other Major Floors", type: "Exploration Zone", drops: ["Cross-pollination contacts", "Different perspectives", "Unexpected collaborations"], difficulty: "Medium", visited: false },
  { id: "l3", name: "Studievereniging", type: "Event Domain", drops: ["Company connections", "Hackathon access", "Career events", "Industry weak ties"], difficulty: "Medium", visited: false },
  { id: "l4", name: "Canteen / Common Area", type: "Social Hub", drops: ["Serendipity encounters", "Cross-major weak ties", "Casual reputation building"], difficulty: "Easy", visited: true },
  { id: "l5", name: "Minor (Other Hogeschool)", type: "Raid Zone", drops: ["Entirely new network", "New skill tree", "Study abroad contacts", "Fresh perspective"], difficulty: "Hard", visited: false },
  { id: "l6", name: "Stage / Internship", type: "Boss Domain", drops: ["Real work experience", "Professional network", "Hiring pipeline access", "Industry reputation"], difficulty: "Hard", visited: false },
  { id: "l7", name: "Faculty Offices", type: "Hidden Quest", drops: ["Industry introductions", "Project mentorship", "Reference letters", "Insider knowledge"], difficulty: "Medium", visited: false },
  { id: "l8", name: "Library / Study Spaces", type: "Grinding Zone", drops: ["Focus hours", "Random encounters", "Study group formation"], difficulty: "Easy", visited: false },
];

const DEFAULT_DATA = {
  characters: [],
  party: [],
  locations: DEFAULT_LOCATIONS,
  stats: { social: 1, technical: 1, sales: 1, identity: 1 },
  log: [],
  weeklyCheckin: null,
};

const INIT_CHAR = { id: "", name: "", rarity: 3, location: "", notes: "", tags: [], inParty: false };

export default function CollegeRPG() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [view, setView] = useState("overview");
  const [showAddChar, setShowAddChar] = useState(false);
  const [newChar, setNewChar] = useState({ ...INIT_CHAR });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", type: "", drops: "", difficulty: "Medium" });
  const [selectedChar, setSelectedChar] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [editStats, setEditStats] = useState(false);
  const [tempStats, setTempStats] = useState({ social: 1, technical: 1, sales: 1, identity: 1 });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("college-rpg-data");
        if (res?.value) setData(JSON.parse(res.value));
      } catch (e) { /* first load */ }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (newData) => {
    setData(newData);
    try { await window.storage.set("college-rpg-data", JSON.stringify(newData)); } catch (e) {}
  }, []);

  const addCharacter = () => {
    if (!newChar.name.trim()) return;
    const c = { ...newChar, id: "c" + Date.now(), tags: newChar.tags || [] };
    save({ ...data, characters: [...data.characters, c], log: [...data.log, { t: Date.now(), msg: `Pulled ${c.name} (${RARITY_COLORS[c.rarity].label})` }] });
    setNewChar({ ...INIT_CHAR });
    setShowAddChar(false);
  };

  const removeCharacter = (id) => {
    const c = data.characters.find(x => x.id === id);
    save({ ...data, characters: data.characters.filter(x => x.id !== id), party: data.party.filter(x => x !== id), log: [...data.log, { t: Date.now(), msg: `Released ${c?.name}` }] });
    setSelectedChar(null);
  };

  const toggleParty = (id) => {
    const inParty = data.party.includes(id);
    const newParty = inParty ? data.party.filter(x => x !== id) : [...data.party, id];
    save({ ...data, party: newParty });
  };

  const addLocation = () => {
    if (!newLocation.name.trim()) return;
    const loc = { id: "l" + Date.now(), name: newLocation.name, type: newLocation.type, drops: newLocation.drops.split(",").map(s => s.trim()).filter(Boolean), difficulty: newLocation.difficulty, visited: false };
    save({ ...data, locations: [...data.locations, loc] });
    setNewLocation({ name: "", type: "", drops: "", difficulty: "Medium" });
    setShowAddLocation(false);
  };

  const toggleLocationVisited = (id) => {
    save({ ...data, locations: data.locations.map(l => l.id === id ? { ...l, visited: !l.visited } : l) });
  };

  const removeLocation = (id) => {
    save({ ...data, locations: data.locations.filter(l => l.id !== id) });
    setSelectedLocation(null);
  };

  const saveStats = () => {
    save({ ...data, stats: { ...tempStats }, log: [...data.log, { t: Date.now(), msg: `Stats updated` }] });
    setEditStats(false);
  };

  const resetAll = () => {
    if (confirm("Reset everything? This can't be undone.")) {
      save({ ...DEFAULT_DATA });
      setView("overview");
    }
  };

  if (!loaded) return <div style={styles.loading}><div style={styles.loadingPulse}>Loading...</div></div>;

  const partyChars = data.characters.filter(c => data.party.includes(c.id));
  const totalChars = data.characters.length;
  const locationsExplored = data.locations.filter(l => l.visited).length;

  return (
    <div style={styles.root}>
      <div style={styles.scanline} />
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.title}>COLLEGE<span style={styles.titleAccent}>::</span>RPG</div>
          <div style={styles.subtitle}>HBO Informatica — Hogeschool Rotterdam</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.miniStat}>{totalChars} pulled</div>
          <div style={styles.miniStat}>{partyChars.length} in party</div>
          <div style={styles.miniStat}>{locationsExplored}/{data.locations.length} explored</div>
        </div>
      </div>

      {/* Nav */}
      <div style={styles.nav}>
        {["overview", "characters", "locations", "party", "log"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ ...styles.navBtn, ...(view === v ? styles.navBtnActive : {}) }}>
            {v === "overview" ? "⬡" : v === "characters" ? "👤" : v === "locations" ? "📍" : v === "party" ? "⚔️" : "📜"} {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        
        {/* OVERVIEW */}
        {view === "overview" && (
          <div>
            {/* Stats */}
            <div style={styles.sectionHeader}>
              <span>MY STATS</span>
              {!editStats ? (
                <button onClick={() => { setTempStats({ ...data.stats }); setEditStats(true); }} style={styles.smallBtn}>Edit</button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveStats} style={{ ...styles.smallBtn, background: "#00E676" }}>Save</button>
                  <button onClick={() => setEditStats(false)} style={styles.smallBtn}>Cancel</button>
                </div>
              )}
            </div>
            <div style={styles.statsGrid}>
              {Object.entries(data.stats).map(([key, val]) => (
                <div key={key} style={styles.statCard}>
                  <div style={styles.statIcon}>{STAT_ICONS[key]}</div>
                  <div style={styles.statName}>{key.toUpperCase()}</div>
                  {editStats ? (
                    <div style={styles.statEditRow}>
                      <button onClick={() => setTempStats(p => ({ ...p, [key]: Math.max(1, p[key] - 1) }))} style={styles.statEditBtn}>−</button>
                      <span style={styles.statVal}>{tempStats[key]}</span>
                      <button onClick={() => setTempStats(p => ({ ...p, [key]: Math.min(99, p[key] + 1) }))} style={styles.statEditBtn}>+</button>
                    </div>
                  ) : (
                    <div style={styles.statVal}>{val}</div>
                  )}
                  <div style={styles.statBar}>
                    <div style={{ ...styles.statBarFill, width: `${((editStats ? tempStats[key] : val) / 99) * 100}%`, background: key === "social" ? "#00E5FF" : key === "technical" ? "#FFD740" : key === "sales" ? "#FF4081" : "#B388FF" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Party Preview */}
            <div style={styles.sectionHeader}><span>ACTIVE PARTY ({partyChars.length})</span></div>
            {partyChars.length === 0 ? (
              <div style={styles.emptyState}>No party members yet. Pull characters and add them to your party.</div>
            ) : (
              <div style={styles.partyRow}>
                {partyChars.map(c => (
                  <div key={c.id} style={{ ...styles.partyMini, borderColor: RARITY_COLORS[c.rarity].star }}>
                    <div style={{ ...styles.partyMiniAvatar, background: RARITY_COLORS[c.rarity].bg }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={styles.partyMiniName}>{c.name}</div>
                    <div style={{ ...styles.rarityLabel, color: RARITY_COLORS[c.rarity].star, fontSize: 10 }}>{"★".repeat(c.rarity)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div style={styles.sectionHeader}><span>QUICK ACTIONS</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => { setView("characters"); setShowAddChar(true); }} style={styles.actionBtn}>+ New Pull</button>
              <button onClick={() => setView("locations")} style={styles.actionBtn}>🗺️ Explore Locations</button>
              <button onClick={resetAll} style={{ ...styles.actionBtn, opacity: 0.5 }}>⟲ Reset All</button>
            </div>
          </div>
        )}

        {/* CHARACTERS */}
        {view === "characters" && (
          <div>
            <div style={styles.sectionHeader}>
              <span>CHARACTERS ({totalChars})</span>
              <button onClick={() => setShowAddChar(true)} style={styles.smallBtn}>+ Pull</button>
            </div>

            {showAddChar && (
              <div style={styles.modal}>
                <div style={styles.modalTitle}>NEW PULL</div>
                <input placeholder="Name" value={newChar.name} onChange={e => setNewChar(p => ({ ...p, name: e.target.value }))} style={styles.input} />
                <div style={styles.fieldLabel}>Rarity</div>
                <div style={styles.rarityPicker}>
                  {[1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setNewChar(p => ({ ...p, rarity: r }))} style={{ ...styles.rarityBtn, ...(newChar.rarity === r ? { background: RARITY_COLORS[r].bg, color: "#fff" } : {}) }}>
                      {"★".repeat(r)}
                    </button>
                  ))}
                </div>
                <div style={styles.fieldLabel}>Met at</div>
                <select value={newChar.location} onChange={e => setNewChar(p => ({ ...p, location: e.target.value }))} style={styles.input}>
                  <option value="">Select location...</option>
                  {data.locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
                <input placeholder="Notes (optional)" value={newChar.notes} onChange={e => setNewChar(p => ({ ...p, notes: e.target.value }))} style={styles.input} />
                <input placeholder="Tags (comma separated)" value={(newChar.tags || []).join(", ")} onChange={e => setNewChar(p => ({ ...p, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} style={styles.input} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={addCharacter} style={{ ...styles.actionBtn, flex: 1 }}>Confirm Pull</button>
                  <button onClick={() => { setShowAddChar(false); setNewChar({ ...INIT_CHAR }); }} style={{ ...styles.actionBtn, flex: 1, opacity: 0.6 }}>Cancel</button>
                </div>
              </div>
            )}

            {selectedChar && (() => {
              const c = data.characters.find(x => x.id === selectedChar);
              if (!c) return null;
              return (
                <div style={styles.modal}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ ...styles.charAvatar, background: RARITY_COLORS[c.rarity].bg, width: 48, height: 48, fontSize: 20 }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#E0E0E0" }}>{c.name}</div>
                      <div style={{ color: RARITY_COLORS[c.rarity].star, fontSize: 13 }}>{"★".repeat(c.rarity)} — {RARITY_COLORS[c.rarity].label}</div>
                    </div>
                  </div>
                  {c.location && <div style={styles.detailRow}><span style={styles.detailLabel}>Met at:</span> {c.location}</div>}
                  {c.notes && <div style={styles.detailRow}><span style={styles.detailLabel}>Notes:</span> {c.notes}</div>}
                  {c.tags?.length > 0 && <div style={styles.tagRow}>{c.tags.map((t,i) => <span key={i} style={styles.tag}>{t}</span>)}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => { toggleParty(c.id); }} style={{ ...styles.actionBtn, flex: 1 }}>{data.party.includes(c.id) ? "Remove from Party" : "Add to Party"}</button>
                    <button onClick={() => removeCharacter(c.id)} style={{ ...styles.actionBtn, flex: 1, background: "rgba(255,0,0,0.15)", borderColor: "#FF5252" }}>Release</button>
                    <button onClick={() => setSelectedChar(null)} style={{ ...styles.actionBtn, flex: 1, opacity: 0.6 }}>Close</button>
                  </div>
                </div>
              );
            })()}

            {data.characters.length === 0 ? (
              <div style={styles.emptyState}>No characters pulled yet. Start exploring locations and meeting people.</div>
            ) : (
              <div style={styles.charGrid}>
                {[5,4,3,2,1].map(r => {
                  const chars = data.characters.filter(c => c.rarity === r);
                  if (chars.length === 0) return null;
                  return (
                    <div key={r}>
                      <div style={{ ...styles.rarityGroupLabel, color: RARITY_COLORS[r].star }}>{"★".repeat(r)} {RARITY_COLORS[r].label} ({chars.length})</div>
                      <div style={styles.charRow}>
                        {chars.map(c => (
                          <div key={c.id} onClick={() => setSelectedChar(c.id)} style={{ ...styles.charCard, borderColor: RARITY_COLORS[c.rarity].star, boxShadow: `0 0 12px ${RARITY_COLORS[c.rarity].glow}` }}>
                            <div style={{ ...styles.charAvatar, background: RARITY_COLORS[c.rarity].bg }}>{c.name.charAt(0).toUpperCase()}</div>
                            <div style={styles.charName}>{c.name}</div>
                            {c.location && <div style={styles.charLoc}>{c.location}</div>}
                            {data.party.includes(c.id) && <div style={styles.partyBadge}>⚔️ PARTY</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LOCATIONS */}
        {view === "locations" && (
          <div>
            <div style={styles.sectionHeader}>
              <span>LOCATIONS ({data.locations.length})</span>
              <button onClick={() => setShowAddLocation(true)} style={styles.smallBtn}>+ Add</button>
            </div>

            {showAddLocation && (
              <div style={styles.modal}>
                <div style={styles.modalTitle}>NEW LOCATION</div>
                <input placeholder="Location name" value={newLocation.name} onChange={e => setNewLocation(p => ({ ...p, name: e.target.value }))} style={styles.input} />
                <input placeholder="Type (e.g. Social Hub, Raid Zone)" value={newLocation.type} onChange={e => setNewLocation(p => ({ ...p, type: e.target.value }))} style={styles.input} />
                <input placeholder="Drops (comma separated)" value={newLocation.drops} onChange={e => setNewLocation(p => ({ ...p, drops: e.target.value }))} style={styles.input} />
                <div style={styles.fieldLabel}>Difficulty</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Easy","Medium","Hard"].map(d => (
                    <button key={d} onClick={() => setNewLocation(p => ({ ...p, difficulty: d }))} style={{ ...styles.rarityBtn, ...(newLocation.difficulty === d ? { background: d === "Easy" ? "#00E676" : d === "Medium" ? "#FFD740" : "#FF5252", color: "#111" } : {}) }}>{d}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={addLocation} style={{ ...styles.actionBtn, flex: 1 }}>Add Location</button>
                  <button onClick={() => setShowAddLocation(false)} style={{ ...styles.actionBtn, flex: 1, opacity: 0.6 }}>Cancel</button>
                </div>
              </div>
            )}

            {selectedLocation && (() => {
              const loc = data.locations.find(l => l.id === selectedLocation);
              if (!loc) return null;
              const charsHere = data.characters.filter(c => c.location === loc.name);
              return (
                <div style={styles.modal}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#E0E0E0", marginBottom: 4 }}>{loc.name}</div>
                  <div style={{ color: "#00E5FF", fontSize: 12, marginBottom: 8, letterSpacing: 1 }}>{loc.type} — {loc.difficulty}</div>
                  <div style={{ ...styles.detailLabel, marginBottom: 4 }}>OBTAINABLE DROPS:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                    {loc.drops.map((d, i) => <span key={i} style={{ ...styles.tag, background: "rgba(0,229,255,0.1)", borderColor: "#00E5FF" }}>{d}</span>)}
                  </div>
                  {charsHere.length > 0 && (
                    <>
                      <div style={{ ...styles.detailLabel, marginBottom: 4 }}>CHARACTERS MET HERE ({charsHere.length}):</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {charsHere.map(c => (
                          <span key={c.id} style={{ ...styles.tag, borderColor: RARITY_COLORS[c.rarity].star, color: RARITY_COLORS[c.rarity].star }}>{c.name} {"★".repeat(c.rarity)}</span>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { toggleLocationVisited(loc.id); }} style={{ ...styles.actionBtn, flex: 1 }}>{loc.visited ? "Mark Unexplored" : "Mark Explored"}</button>
                    {!DEFAULT_LOCATIONS.find(dl => dl.id === loc.id) && (
                      <button onClick={() => removeLocation(loc.id)} style={{ ...styles.actionBtn, flex: 1, background: "rgba(255,0,0,0.15)", borderColor: "#FF5252" }}>Delete</button>
                    )}
                    <button onClick={() => setSelectedLocation(null)} style={{ ...styles.actionBtn, flex: 1, opacity: 0.6 }}>Close</button>
                  </div>
                </div>
              );
            })()}

            <div style={styles.locationGrid}>
              {data.locations.map(loc => {
                const charsHere = data.characters.filter(c => c.location === loc.name).length;
                return (
                  <div key={loc.id} onClick={() => setSelectedLocation(loc.id)} style={{ ...styles.locationCard, ...(loc.visited ? { borderColor: "#00E676" } : {}) }}>
                    <div style={styles.locHeader}>
                      <span style={styles.locName}>{loc.name}</span>
                      {loc.visited && <span style={styles.exploredBadge}>✓</span>}
                    </div>
                    <div style={styles.locType}>{loc.type}</div>
                    <div style={styles.locDifficulty}>
                      <span style={{ color: loc.difficulty === "Easy" ? "#00E676" : loc.difficulty === "Medium" ? "#FFD740" : "#FF5252" }}>
                        {loc.difficulty === "Easy" ? "●" : loc.difficulty === "Medium" ? "●●" : "●●●"} {loc.difficulty}
                      </span>
                    </div>
                    <div style={styles.locDrops}>
                      {loc.drops.slice(0, 3).map((d, i) => <span key={i} style={styles.dropChip}>{d}</span>)}
                      {loc.drops.length > 3 && <span style={styles.dropChip}>+{loc.drops.length - 3}</span>}
                    </div>
                    {charsHere > 0 && <div style={styles.locChars}>👤 {charsHere} met here</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PARTY */}
        {view === "party" && (
          <div>
            <div style={styles.sectionHeader}><span>ACTIVE PARTY ({partyChars.length})</span></div>
            {partyChars.length === 0 ? (
              <div style={styles.emptyState}>Your party is empty. Add characters from the Characters tab.</div>
            ) : (
              <div style={styles.partyGrid}>
                {partyChars.map(c => (
                  <div key={c.id} style={{ ...styles.partyCard, borderColor: RARITY_COLORS[c.rarity].star, boxShadow: `0 0 20px ${RARITY_COLORS[c.rarity].glow}` }}>
                    <div style={{ ...styles.partyAvatar, background: RARITY_COLORS[c.rarity].bg }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#E0E0E0" }}>{c.name}</div>
                      <div style={{ color: RARITY_COLORS[c.rarity].star, fontSize: 12 }}>{"★".repeat(c.rarity)}</div>
                      {c.location && <div style={{ color: "#78909C", fontSize: 11, marginTop: 2 }}>{c.location}</div>}
                      {c.tags?.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>{c.tags.map((t,i) => <span key={i} style={{ ...styles.tag, fontSize: 10 }}>{t}</span>)}</div>}
                    </div>
                    <button onClick={() => toggleParty(c.id)} style={{ ...styles.smallBtn, background: "rgba(255,0,0,0.15)", borderColor: "#FF5252", color: "#FF5252" }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.sectionHeader}><span>BENCH</span></div>
            {data.characters.filter(c => !data.party.includes(c.id)).length === 0 ? (
              <div style={styles.emptyState}>All characters are in your party, or no characters pulled yet.</div>
            ) : (
              <div style={styles.partyGrid}>
                {data.characters.filter(c => !data.party.includes(c.id)).map(c => (
                  <div key={c.id} style={{ ...styles.partyCard, opacity: 0.6, borderColor: "#333" }}>
                    <div style={{ ...styles.partyAvatar, background: RARITY_COLORS[c.rarity].bg, width: 36, height: 36, fontSize: 14 }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#90A4AE" }}>{c.name}</div>
                      <div style={{ color: RARITY_COLORS[c.rarity].star, fontSize: 11 }}>{"★".repeat(c.rarity)}</div>
                    </div>
                    <button onClick={() => toggleParty(c.id)} style={{ ...styles.smallBtn, borderColor: "#00E676", color: "#00E676" }}>+ Party</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            <div style={styles.sectionHeader}>
              <span>ACTIVITY LOG ({data.log.length})</span>
              {data.log.length > 0 && <button onClick={() => save({ ...data, log: [] })} style={{ ...styles.smallBtn, opacity: 0.5 }}>Clear</button>}
            </div>
            {data.log.length === 0 ? (
              <div style={styles.emptyState}>No activity yet. Start pulling characters and exploring locations.</div>
            ) : (
              <div style={styles.logList}>
                {[...data.log].reverse().map((entry, i) => (
                  <div key={i} style={styles.logEntry}>
                    <span style={styles.logTime}>{new Date(entry.t).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>
                    <span style={styles.logMsg}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", background: "#0a0a0f", color: "#c0c0c0", minHeight: "100vh", position: "relative", overflow: "hidden" },
  scanline: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.015) 2px, rgba(0,229,255,0.015) 4px)", pointerEvents: "none", zIndex: 999 },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0f" },
  loadingPulse: { color: "#00E5FF", fontSize: 14, fontFamily: "monospace", animation: "pulse 1.5s infinite", letterSpacing: 2 },
  header: { padding: "20px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(0,229,255,0.1)" },
  headerLeft: {},
  headerRight: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" },
  title: { fontSize: 22, fontWeight: 800, color: "#E0E0E0", letterSpacing: 3, textTransform: "uppercase" },
  titleAccent: { color: "#00E5FF" },
  subtitle: { fontSize: 10, color: "#546E7A", letterSpacing: 2, marginTop: 2, textTransform: "uppercase" },
  miniStat: { fontSize: 10, color: "#00E5FF", background: "rgba(0,229,255,0.06)", padding: "3px 8px", borderRadius: 3, border: "1px solid rgba(0,229,255,0.15)", letterSpacing: 1 },
  nav: { display: "flex", gap: 0, borderBottom: "1px solid rgba(0,229,255,0.1)", overflowX: "auto" },
  navBtn: { flex: 1, padding: "10px 8px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#546E7A", fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, whiteSpace: "nowrap", transition: "all 0.2s" },
  navBtnActive: { color: "#00E5FF", borderBottomColor: "#00E5FF", background: "rgba(0,229,255,0.04)" },
  content: { padding: "16px" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 16, fontSize: 11, fontWeight: 700, color: "#546E7A", letterSpacing: 2, textTransform: "uppercase" },
  smallBtn: { padding: "4px 10px", background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 3, color: "#00E5FF", fontSize: 10, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 },
  actionBtn: { padding: "10px 16px", background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 4, color: "#00E5FF", fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1, transition: "all 0.2s" },
  emptyState: { color: "#37474F", fontSize: 12, fontStyle: "italic", padding: "20px 0", textAlign: "center", letterSpacing: 0.5 },
  
  // Stats
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  statCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "12px", textAlign: "center" },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statName: { fontSize: 10, color: "#546E7A", letterSpacing: 2, marginBottom: 4 },
  statVal: { fontSize: 24, fontWeight: 800, color: "#E0E0E0" },
  statBar: { height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 8, overflow: "hidden" },
  statBarFill: { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  statEditRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12 },
  statEditBtn: { width: 28, height: 28, background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 4, color: "#00E5FF", fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" },

  // Party overview
  partyRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  partyMini: { background: "rgba(255,255,255,0.02)", border: "1px solid", borderRadius: 6, padding: "8px", textAlign: "center", width: 70 },
  partyMiniAvatar: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#111", margin: "0 auto 4px" },
  partyMiniName: { fontSize: 10, color: "#E0E0E0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rarityLabel: { fontSize: 11 },

  // Characters
  charGrid: { display: "flex", flexDirection: "column", gap: 12 },
  rarityGroupLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  charRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  charCard: { background: "rgba(255,255,255,0.02)", border: "1px solid", borderRadius: 8, padding: "10px", textAlign: "center", width: 90, cursor: "pointer", transition: "all 0.2s", position: "relative" },
  charAvatar: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#111", margin: "0 auto 6px" },
  charName: { fontSize: 11, color: "#E0E0E0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  charLoc: { fontSize: 9, color: "#546E7A", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  partyBadge: { position: "absolute", top: 4, right: 4, fontSize: 8, background: "rgba(0,229,255,0.15)", padding: "1px 4px", borderRadius: 3, color: "#00E5FF" },

  // Locations
  locationGrid: { display: "flex", flexDirection: "column", gap: 8 },
  locationCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px", cursor: "pointer", transition: "all 0.2s" },
  locHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  locName: { fontSize: 13, fontWeight: 700, color: "#E0E0E0" },
  exploredBadge: { color: "#00E676", fontSize: 14, fontWeight: 700 },
  locType: { fontSize: 10, color: "#00E5FF", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" },
  locDifficulty: { fontSize: 10, marginTop: 4 },
  locDrops: { display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 },
  dropChip: { fontSize: 9, color: "#78909C", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.06)" },
  locChars: { fontSize: 10, color: "#78909C", marginTop: 6 },

  // Party view
  partyGrid: { display: "flex", flexDirection: "column", gap: 8 },
  partyCard: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid", borderRadius: 8, padding: "12px" },
  partyAvatar: { width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#111", flexShrink: 0 },

  // Modal
  modal: { background: "rgba(10,10,15,0.97)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8, padding: "16px", marginBottom: 16, boxShadow: "0 0 30px rgba(0,229,255,0.05)" },
  modalTitle: { fontSize: 13, fontWeight: 700, color: "#00E5FF", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" },
  input: { width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#E0E0E0", fontSize: 12, fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box", outline: "none" },
  fieldLabel: { fontSize: 10, color: "#546E7A", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  rarityPicker: { display: "flex", gap: 4, marginBottom: 8 },
  rarityBtn: { padding: "6px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#78909C", fontSize: 11, cursor: "pointer", fontFamily: "inherit" },

  // Details
  detailRow: { fontSize: 12, color: "#90A4AE", marginBottom: 4 },
  detailLabel: { color: "#546E7A", fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  tagRow: { display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 },
  tag: { fontSize: 10, color: "#90A4AE", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)" },

  // Log
  logList: { display: "flex", flexDirection: "column", gap: 2 },
  logEntry: { display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 11 },
  logTime: { color: "#37474F", minWidth: 60, flexShrink: 0 },
  logMsg: { color: "#90A4AE" },
};
