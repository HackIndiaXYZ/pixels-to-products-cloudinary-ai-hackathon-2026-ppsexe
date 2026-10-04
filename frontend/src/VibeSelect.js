import {
  FaSmile,
  FaLeaf,
  FaHeart,
  FaSnowflake,
  FaStar,
  FaBolt,
  FaUser,
  FaUserFriends,
  FaUsers,
  FaRegHeart,
} from "react-icons/fa";

const VIBES = [
  { label: "Cute", icon: <FaSmile /> },
  { label: "Natural", icon: <FaLeaf /> },
  { label: "Confident", icon: <FaStar /> },
  { label: "Romantic", icon: <FaHeart /> },
  { label: "Cool", icon: <FaSnowflake /> },
  { label: "Bold", icon: <FaBolt /> },
];

const GROUPS = [
  { label: "Solo", icon: <FaUser /> },
  { label: "Couple", icon: <FaRegHeart /> },
  { label: "Friends", icon: <FaUserFriends /> },
  { label: "Group", icon: <FaUsers /> },
];

function VibeSelect({ vibe, group, setVibe, setGroup, onContinue, loading }) {
  return (
    <section>
      <h1 className="v-h1">You bring the photos. VYBE finds the vibe.</h1>
      <p className="v-lead">
        Choose the mood you want and who is in the shot. We suggest poses to
        try, then turn your real photos into a carousel that looks planned.
      </p>

      <h2 className="v-label">Pick a vibe</h2>
      <div className="v-chips">
        {VIBES.map((v) => (
          <button
            key={v.label}
            type="button"
            className={"v-chip" + (vibe === v.label ? " is-on" : "")}
            aria-pressed={vibe === v.label}
            onClick={() => setVibe(v.label)}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      <h2 className="v-label">Who is in it</h2>
      <div className="v-tiles">
        {GROUPS.map((g) => (
          <button
            key={g.label}
            type="button"
            className={"v-tile" + (group === g.label ? " is-on" : "")}
            aria-pressed={group === g.label}
            onClick={() => setGroup(g.label)}
          >
            {g.icon}
            {g.label}
          </button>
        ))}
      </div>

      <div className="v-actions">
        <button
          type="button"
          className="v-btn"
          onClick={onContinue}
          disabled={loading || !vibe || !group}
        >
          Start my VYBE
        </button>
        <button type="button" className="v-btn-quiet" disabled title="Coming soon">
          Describe it myself (coming soon)
        </button>
      </div>
    </section>
  );
}

export default VibeSelect;