use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillMeta {
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub source: String,
    pub path: String,
}

const SKIP_DIRS: &[&str] = &["node_modules", "__pycache__", ".git"];
const MAX_LINES: usize = 20;

/// Scan a directory for skill subdirectories, each optionally containing a SKILL.md.
/// Returns an alphabetically sorted list of skill metadata.
/// Returns an empty Vec on directory-not-found or permission errors.
pub fn scan_skills(dir: &Path, source: &str) -> Vec<SkillMeta> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return Vec::new(),
    };

    let mut skills: Vec<SkillMeta> = Vec::new();

    for entry in entries.flatten() {
        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        if !file_type.is_dir() {
            continue;
        }

        let dir_name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden directories and known junk directories
        if dir_name.starts_with('.') || SKIP_DIRS.contains(&dir_name.as_str()) {
            continue;
        }

        let skill_dir = entry.path();
        let skill_md = find_skill_md(&skill_dir);

        let (title, description) = match skill_md {
            Some(md_path) => parse_skill_md(&md_path),
            None => (None, None),
        };

        skills.push(SkillMeta {
            name: dir_name,
            title,
            description,
            source: source.to_string(),
            path: skill_dir.to_string_lossy().to_string(),
        });
    }

    skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    skills
}

/// Case-insensitive search for SKILL.md in the given directory.
fn find_skill_md(dir: &Path) -> Option<std::path::PathBuf> {
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        if entry.file_type().ok()?.is_file() {
            let name = entry.file_name().to_string_lossy().to_lowercase();
            if name == "skill.md" {
                return Some(entry.path());
            }
        }
    }
    None
}

/// Parse the first MAX_LINES of a SKILL.md to extract title and description.
/// Title: first line starting with "# " (the prefix is stripped).
/// Description: first non-empty line after the title that doesn't start with "#".
fn parse_skill_md(path: &Path) -> (Option<String>, Option<String>) {
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return (None, None),
    };

    let mut title: Option<String> = None;
    let mut description: Option<String> = None;
    let mut title_found = false;

    for line in content.lines().take(MAX_LINES) {
        let trimmed = line.trim();

        if !title_found {
            if let Some(heading) = trimmed.strip_prefix("# ") {
                let heading = heading.trim();
                if !heading.is_empty() {
                    title = Some(heading.to_string());
                    title_found = true;
                }
            }
            continue;
        }

        // After title: find first non-empty, non-heading line
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        description = Some(trimmed.to_string());
        break;
    }

    (title, description)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn scan_empty_or_missing_dir_returns_empty() {
        let result = scan_skills(Path::new("/nonexistent/path/surely"), "test");
        assert!(result.is_empty());
    }

    #[test]
    fn scan_skills_finds_subdirectories() {
        let tmp = std::env::temp_dir().join("harness_skill_scan_test");
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(tmp.join("alpha-skill")).unwrap();
        fs::create_dir_all(tmp.join("beta-skill")).unwrap();
        fs::create_dir_all(tmp.join(".hidden")).unwrap();
        fs::create_dir_all(tmp.join("node_modules")).unwrap();

        // alpha has a SKILL.md
        fs::write(
            tmp.join("alpha-skill/SKILL.md"),
            "# Alpha Skill\n\nThis skill does alpha things.\n\n## Details\nMore info.",
        )
        .unwrap();

        // beta has no SKILL.md
        fs::write(tmp.join("beta-skill/README.md"), "just a readme").unwrap();

        let results = scan_skills(&tmp, "claude");
        assert_eq!(results.len(), 2);

        assert_eq!(results[0].name, "alpha-skill");
        assert_eq!(results[0].title.as_deref(), Some("Alpha Skill"));
        assert_eq!(
            results[0].description.as_deref(),
            Some("This skill does alpha things.")
        );
        assert_eq!(results[0].source, "claude");

        assert_eq!(results[1].name, "beta-skill");
        assert!(results[1].title.is_none());
        assert!(results[1].description.is_none());

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn parse_skill_md_extracts_title_and_description() {
        let tmp = std::env::temp_dir().join("harness_parse_skill_test");
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let md_path = tmp.join("SKILL.md");
        fs::write(
            &md_path,
            "# My Skill Title\n\n## Overview\n\nFirst real paragraph here.\n\nMore text.",
        )
        .unwrap();

        let (title, desc) = parse_skill_md(&md_path);
        assert_eq!(title.as_deref(), Some("My Skill Title"));
        assert_eq!(desc.as_deref(), Some("First real paragraph here."));

        let _ = fs::remove_dir_all(&tmp);
    }

    #[test]
    fn parse_skill_md_case_insensitive_find() {
        let tmp = std::env::temp_dir().join("harness_case_insensitive_test");
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        fs::write(
            tmp.join("skill.md"),
            "# lowercase title\n\nsome description",
        )
        .unwrap();

        let found = find_skill_md(&tmp);
        assert!(found.is_some());

        let (title, desc) = parse_skill_md(&found.unwrap());
        assert_eq!(title.as_deref(), Some("lowercase title"));
        assert_eq!(desc.as_deref(), Some("some description"));

        let _ = fs::remove_dir_all(&tmp);
    }
}
