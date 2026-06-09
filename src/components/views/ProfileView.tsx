import type { Locale, ProfileSummary, TargetKind, TargetSummary } from "../../lib/types";

interface ProfileViewProps {
  locale: Locale;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  setSelectedProfileId: (profileId: string) => void;
  targets: TargetSummary[];
  selectedTargetKind: TargetKind;
  setSelectedTargetKind: (targetKind: TargetKind) => void;
}

export function ProfileView({
  locale,
  profiles,
  selectedProfileId,
  setSelectedProfileId,
  targets,
  selectedTargetKind,
  setSelectedTargetKind,
}: ProfileViewProps) {
  return (
    <div className="workflow-grid">
      <div>
        <h3>{locale === "zh-CN" ? "配置集" : "Profiles"}</h3>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <button
              className={profile.id === selectedProfileId ? "profile-card selected" : "profile-card"}
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfileId(profile.id)}
            >
              <strong>{profile.name}</strong>
              <span>{profile.description}</span>
              <small>
                {locale === "zh-CN"
                  ? `${profile.rules} 条规则 · ${profile.skills} 个技能 · ${profile.mcpReferences} 个 MCP`
                  : `${profile.rules} rules · ${profile.skills} skills · ${profile.mcpReferences} MCP`}
              </small>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3>{locale === "zh-CN" ? "目标" : "Targets"}</h3>
        <div className="target-list">
          {targets.map((target) => (
            <button
              className={target.kind === selectedTargetKind ? "target-card selected" : "target-card"}
              key={target.kind}
              type="button"
              onClick={() => setSelectedTargetKind(target.kind)}
            >
              <strong>{target.name}</strong>
              <span>{target.status}</span>
              <small>{target.fixture ? (locale === "zh-CN" ? "模拟数据" : "Fixture") : (locale === "zh-CN" ? "真实目标" : "Real target")}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
