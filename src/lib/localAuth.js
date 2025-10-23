import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const dataDir = path.resolve(process.cwd(), 'src', 'data');
const usersFile = path.join(dataDir, 'users.json');
const profilesFile = path.join(dataDir, 'profiles.json');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
  if (!fs.existsSync(profilesFile)) fs.writeFileSync(profilesFile, '[]', 'utf8');
}

function readJson(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

export function findUserByEmail(email) {
  ensureDataFiles();
  const users = readJson(usersFile);
  return users.find(u => u.email === email) || null;
}

export function createUser({ name, email, password }) {
  ensureDataFiles();
  const users = readJson(usersFile);
  if (users.find(u => u.email === email)) {
    const err = new Error('User exists');
    err.code = 'USER_EXISTS';
    throw err;
  }
  const id = randomUUID();
  const user = { id, email, password, user_metadata: { name } };
  users.push(user);
  writeJson(usersFile, users);

  // also create profile
  const profiles = readJson(profilesFile);
  const profile = { id, email, name, role: 'user' };
  profiles.push(profile);
  writeJson(profilesFile, profiles);

  return { user };
}

export function ensureProfile({ id, email, name }) {
  ensureDataFiles();
  const profiles = readJson(profilesFile);
  let p = profiles.find(x => x.id === id || x.email === email);
  if (!p) {
    p = { id, email, name: name || email.split('@')[0], role: 'user' };
    profiles.push(p);
    writeJson(profilesFile, profiles);
  }
  return p;
}

export function verifyPassword(user, password) {
  if (!user) return false;
  return user.password === password;
}
