import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type UserProfile = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  weakPoints: string[];
  learnedWords: string[];
  updatedAt: string;
};

type ProgressEvent = {
  type: "sentence_mastered" | "vision_reviewed" | "mistake_detected";
  content?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILE_PATH = path.join(DATA_DIR, "user-profile.json");
const LEVEL_STEP = 100;

const defaultProfile = (): UserProfile => ({
  totalXp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpToNextLevel: LEVEL_STEP,
  weakPoints: [],
  learnedWords: [],
  updatedAt: new Date().toISOString(),
});

const recomputeProgress = (profile: UserProfile): UserProfile => {
  const level = Math.floor(profile.totalXp / LEVEL_STEP) + 1;
  const xpIntoLevel = profile.totalXp % LEVEL_STEP;

  return {
    ...profile,
    level,
    xpIntoLevel,
    xpToNextLevel: LEVEL_STEP,
    updatedAt: new Date().toISOString(),
  };
};

const safeUniquePush = (list: string[], value: string, limit = 20) => {
  const normalized = value.trim();
  if (!normalized) {
    return list;
  }

  const withoutDup = [normalized, ...list.filter((item) => item !== normalized)];
  return withoutDup.slice(0, limit);
};

const extractLearnedWords = (content = "") => {
  const words = content
    .toLowerCase()
    .replace(/[^a-zа-яё\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5);

  return [...new Set(words)].slice(0, 3);
};

export const readProfile = async (): Promise<UserProfile> => {
  try {
    const payload = await readFile(PROFILE_PATH, "utf-8");
    const parsed = JSON.parse(payload) as UserProfile;
    return recomputeProgress(parsed);
  } catch {
    const fresh = defaultProfile();
    await writeProfile(fresh);
    return fresh;
  }
};

export const writeProfile = async (profile: UserProfile) => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
};

export const applyProgressEvent = async (event: ProgressEvent): Promise<UserProfile> => {
  const profile = await readProfile();

  if (event.type === "sentence_mastered") {
    profile.totalXp += 15;
    const words = extractLearnedWords(event.content);
    for (const word of words) {
      profile.learnedWords = safeUniquePush(profile.learnedWords, word);
    }
  }

  if (event.type === "vision_reviewed") {
    profile.totalXp += 20;
  }

  if (event.type === "mistake_detected" && event.content) {
    profile.weakPoints = safeUniquePush(profile.weakPoints, event.content);
  }

  const updated = recomputeProgress(profile);
  await writeProfile(updated);
  return updated;
};
