const sessions = new Map();
const log = (...args) => console.log('[planner]', ...args);
const logError = (...args) => console.error('[planner]', ...args);

// Optional Workers AI hook. If env.AI + env.PLANNER_MODEL are configured, this
// can be used to enrich replies. For now we rely on the deterministic planner
// below and treat this as a future enhancement.
const tryWorkersAI = async (_messages, env) => {
  if (!env.AI || !env.PLANNER_MODEL) return null;
  try {
    return await env.AI.run(env.PLANNER_MODEL, {
      messages: [
        { role: 'system', content: 'You are WeCal AI Planner. You write concise replies.' },
        ..._messages,
      ],
    });
  } catch (err) {
    console.warn('Workers AI fallback failed', err);
    return null;
  }
};

const parseJsonSafe = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseWithLLM = async ({ message, history, nowISO, timezone, env }) => {
  if (!env.AI || !env.PLANNER_MODEL) return null;
  const prompt = [
    {
      role: 'system',
      content:
        'You extract structured scheduling data from a single user message. ' +
        'Return ONLY valid JSON. No prose.',
    },
    {
      role: 'user',
      content:
        `Current time ISO: ${nowISO}\n` +
        `Timezone: ${timezone}\n` +
        `Recent user messages (oldest to newest): ${JSON.stringify(history || [])}\n` +
        `Message to parse: ${message}\n` +
        'Return JSON with keys: ' +
        '{ "title": string|null, "titleExplicit": boolean, "attendees": string[], "mentionsAttendees": boolean, ' +
        '"dateRange": {"start":"YYYY-MM-DD","end":"YYYY-MM-DD"}|null, ' +
        '"time": {"hour":0-23,"minute":0-59,"requiresClarification":boolean}|null, ' +
        '"durationMinutes": number|null, "location": string|null }. ' +
        'Use null for unknowns. Attendees should be names as written. ' +
        'If the title is not explicitly provided (e.g., "title: lunch" or "called lunch"), set titleExplicit=false. ' +
        'If the user does not mention inviting anyone, set mentionsAttendees=false.',
    },
  ];

  try {
    log('llm parse enabled', { model: env.PLANNER_MODEL });
    const result = await env.AI.run(env.PLANNER_MODEL, { messages: prompt, temperature: 0 });
    const text = result?.response || result?.text || result?.output || JSON.stringify(result);
    return parseJsonSafe(text);
  } catch (err) {
    console.warn('LLM parse failed', err);
    return null;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const safeParse = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseTime = (timeStr) => {
  if (!timeStr) return [0, 0];
  const [h, m = 0] = String(timeStr).split(':').map((v) => Number(v) || 0);
  return [h, m];
};

const toDateWithTime = (dateStr, timeStr, tz) => {
  return zonedDateTimeFromParts(dateStr, timeStr, tz);
};

const toISO = (date) => new Date(date).toISOString();

const getTzParts = (date, tz) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
};

const toISODateInTz = (date, tz) => {
  const parts = getTzParts(date, tz);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(
    parts.day
  ).padStart(2, '0')}`;
};

const zonedTimeToUtc = (year, month, day, hour, minute, tz) => {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const tzParts = getTzParts(utcDate, tz);
  const asUtc = Date.UTC(tzParts.year, tzParts.month - 1, tzParts.day, tzParts.hour, tzParts.minute);
  const diff = asUtc - utcDate.getTime();
  return new Date(utcDate.getTime() - diff);
};

const zonedDateTimeFromParts = (dateStr, timeStr, tz) => {
  const [year, month, day] = dateStr.split('-').map((v) => Number(v));
  const [hour, minute = 0] = String(timeStr || '0:0').split(':').map((v) => Number(v) || 0);
  return zonedTimeToUtc(year, month, day, hour, minute, tz);
};

const weekdayFromYmd = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).getUTCDay();

const addDaysToYmd = (year, month, day, delta) => {
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + delta);
  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
  };
};

const formatSlot = (slot, tz) => {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const opts = {
    timeZone: tz || 'UTC',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${start.toLocaleString('en-US', opts)} - ${end.toLocaleTimeString('en-US', {
    timeZone: tz || 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const detectDurationMinutes = (text) => {
  if (!text) return null;
  if (/half\s*hour/i.test(text)) return 30;
  if (/quarter\s*hour/i.test(text)) return 15;
  const match = text.match(/(\d+)\s*(hours|hour|hrs|hr)/i);
  if (match) return Number(match[1]) * 60;
  const minMatch = text.match(/(\d+)\s*(minutes|minute|mins|min)/i);
  if (minMatch) return Number(minMatch[1]);
  return null;
};

const detectSlotChoice = (text) => {
  const match = text.match(/option\s*(\d)|slot\s*(\d)|#(\d)/i);
  if (match) {
    const num = match.slice(1).find(Boolean);
    return num ? Number(num) - 1 : null;
  }
  return null;
};

const detectSendIntent = (text) => /send it|send invite|book it|confirm|yes\b/i.test(text);

const detectLocation = (text) => {
  const match = text.match(/\b(at|in)\s+([A-Za-z0-9\s,'-]{3,})/i);
  if (match) return match[2].trim();
  return null;
};

const detectTime = (text) => {
  if (!text) return null;
  if (/\boption\s*\d+\b/i.test(text)) return null;
  if (/noon/i.test(text)) return { hour: 12, minute: 0, hasAmPm: true, requiresClarification: false };
  if (/midnight/i.test(text)) return { hour: 0, minute: 0, hasAmPm: true, requiresClarification: false };
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3] ? match[3].toLowerCase() : null;
  const hasAmPm = Boolean(meridiem);
  const isAmbiguousRange = !hasAmPm && hour >= 5 && hour <= 11;
  let isPm = meridiem === 'pm';

  // Do not assume for ambiguous morning/evening range; require clarification.
  if (!hasAmPm && !isAmbiguousRange && hour >= 1 && hour <= 11) isPm = true;

  if (isPm && hour < 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;

  return { hour, minute, hasAmPm, requiresClarification: isAmbiguousRange };
};

const toISODate = (date, tz) => toISODateInTz(date, tz);

const nextDow = (fromDate, targetDow, allowSame = false) => {
  const base = new Date(fromDate);
  let delta = targetDow - base.getDay();
  if (delta < 0 || (!allowSame && delta === 0)) delta += 7;
  const next = new Date(base);
  next.setDate(base.getDate() + delta);
  return next;
};

const detectRelativeRange = (text, nowISO, tz) => {
  const lower = String(text || '').toLowerCase();
  const base = nowISO ? new Date(nowISO) : new Date();
  const baseParts = getTzParts(base, tz);

  if (/\btoday\b/.test(lower)) {
    const iso = toISODate(base, tz);
    return { start: iso, end: iso };
  }
  if (/\btomorrow\b/.test(lower)) {
    const next = addDaysToYmd(baseParts.year, baseParts.month, baseParts.day, 1);
    const iso = `${String(next.year).padStart(4, '0')}-${String(next.month).padStart(2, '0')}-${String(
      next.day
    ).padStart(2, '0')}`;
    return { start: iso, end: iso };
  }
  if (/\bnext\s+week\b/.test(lower)) {
    const todayDow = weekdayFromYmd(baseParts.year, baseParts.month, baseParts.day);
    let delta = 1 - todayDow;
    if (delta <= 0) delta += 7;
    const nextMonday = addDaysToYmd(baseParts.year, baseParts.month, baseParts.day, delta);
    const nextSunday = addDaysToYmd(nextMonday.year, nextMonday.month, nextMonday.day, 6);
    const start = `${nextMonday.year}-${String(nextMonday.month).padStart(2, '0')}-${String(
      nextMonday.day
    ).padStart(2, '0')}`;
    const end = `${nextSunday.year}-${String(nextSunday.month).padStart(2, '0')}-${String(
      nextSunday.day
    ).padStart(2, '0')}`;
    return { start, end };
  }
  if (/\bnext\s+weekend\b/.test(lower)) {
    const todayDow = weekdayFromYmd(baseParts.year, baseParts.month, baseParts.day);
    let delta = 6 - todayDow;
    if (delta <= 0) delta += 7;
    const nextSaturday = addDaysToYmd(baseParts.year, baseParts.month, baseParts.day, delta);
    const nextSunday = addDaysToYmd(nextSaturday.year, nextSaturday.month, nextSaturday.day, 1);
    const start = `${nextSaturday.year}-${String(nextSaturday.month).padStart(2, '0')}-${String(
      nextSaturday.day
    ).padStart(2, '0')}`;
    const end = `${nextSunday.year}-${String(nextSunday.month).padStart(2, '0')}-${String(
      nextSunday.day
    ).padStart(2, '0')}`;
    return { start, end };
  }
  if (/\bthis\s+weekend\b/.test(lower) || /\bweekend\b/.test(lower)) {
    const todayDow = weekdayFromYmd(baseParts.year, baseParts.month, baseParts.day);
    let delta = 6 - todayDow;
    if (delta < 0) delta += 7;
    const saturday = addDaysToYmd(baseParts.year, baseParts.month, baseParts.day, delta);
    const sunday = addDaysToYmd(saturday.year, saturday.month, saturday.day, 1);
    const start = `${saturday.year}-${String(saturday.month).padStart(2, '0')}-${String(
      saturday.day
    ).padStart(2, '0')}`;
    const end = `${sunday.year}-${String(sunday.month).padStart(2, '0')}-${String(
      sunday.day
    ).padStart(2, '0')}`;
    return { start, end };
  }
  return null;
};

const detectDateRange = (text, nowISO, tz) => {
  if (!text) return null;
  const isoDates = Array.from(text.matchAll(/\d{4}-\d{2}-\d{2}/g)).map((m) => m[0]);
  if (isoDates.length === 1) return { start: isoDates[0], end: isoDates[0] };
  if (isoDates.length >= 2) return { start: isoDates[0], end: isoDates[1] };

  const slashDates = Array.from(text.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g));
  if (slashDates.length) {
    const yearDefault = (nowISO ? new Date(nowISO) : new Date()).getFullYear();
  const parseSlash = (match) => {
    const month = Number(match[1]);
    const day = Number(match[2]);
    const yearRaw = match[3] ? Number(match[3]) : yearDefault;
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const date = new Date(Date.UTC(year, month - 1, day));
    return toISODate(date, tz);
  };
    const parsed = slashDates.map((m) => parseSlash(m));
    if (parsed.length === 1) return { start: parsed[0], end: parsed[0] };
    return { start: parsed[0], end: parsed[1] };
  }

  return detectRelativeRange(text, nowISO, tz);
};

const weekdayMap = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const detectNextWeekday = (text, nowISO, tz) => {
  const lower = text.toLowerCase();
  const found = Object.keys(weekdayMap).find((day) => lower.includes(day));
  if (!found) return null;

  const targetDow = weekdayMap[found];
  const base = nowISO ? new Date(nowISO) : new Date();
  const baseParts = getTzParts(base, tz);
  const todayDow = weekdayFromYmd(baseParts.year, baseParts.month, baseParts.day);
  let delta = targetDow - todayDow;
  if (delta <= 0) delta += 7; // next occurrence in the future

  const targetDate = addDaysToYmd(baseParts.year, baseParts.month, baseParts.day, delta);
  const iso = `${String(targetDate.year).padStart(4, '0')}-${String(targetDate.month).padStart(
    2,
    '0'
  )}-${String(targetDate.day).padStart(2, '0')}`;
  return { start: iso, end: iso };
};

const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const editDistance = (a, b) => {
  if (!a || !b) return Math.max(a.length, b.length);
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const fuzzyMatchFriends = (text, friends) => {
  const normalizedText = normalizeName(text);
  if (!normalizedText) return { matches: [], ambiguous: false, candidates: [] };

  const textTokens = normalizedText.split(' ').filter(Boolean);
  const exactMatches = friends.filter((friend) => {
    const normalizedUser = normalizeName(friend.username);
    if (!normalizedUser) return false;
    const tokens = normalizedUser.split(' ').filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => textTokens.includes(token));
  });
  if (exactMatches.length === 1) {
    return { matches: exactMatches, ambiguous: false, candidates: [] };
  }
  if (exactMatches.length > 1) {
    return { matches: [], ambiguous: true, candidates: exactMatches };
  }
  const scored = friends.map((friend) => {
    const username = String(friend.username || '');
    const normalizedUser = normalizeName(username);
    if (!normalizedUser) return { friend, score: 0 };
    if (normalizedText.includes(normalizedUser)) return { friend, score: 1 };

    const userTokens = normalizedUser.split(' ').filter(Boolean);
    let tokenScore = 0;
    userTokens.forEach((token) => {
      if (token.length >= 3 && textTokens.includes(token)) tokenScore = Math.max(tokenScore, 0.85);
    });

    let bestEdit = 0;
    textTokens.forEach((token) => {
      if (token.length < 3) return;
      const dist = editDistance(token, normalizedUser);
      const score = 1 - dist / Math.max(token.length, normalizedUser.length);
      if (score > bestEdit) bestEdit = score;
    });

    return { friend, score: Math.max(tokenScore, bestEdit) };
  });

  const matches = scored.filter((entry) => entry.score >= 0.8).sort((a, b) => b.score - a.score);
  if (matches.length <= 1) {
    return { matches: matches.map((m) => m.friend), ambiguous: false, candidates: [] };
  }

  const topScore = matches[0].score;
  const close = matches.filter((m) => topScore - m.score <= 0.05);
  if (close.length >= 2) {
    return {
      matches: [],
      ambiguous: true,
      candidates: close.map((m) => m.friend),
    };
  }

  return { matches: [matches[0].friend], ambiguous: false, candidates: [] };
};

const mentionsParticipants = (text) =>
  /\bwith\b|\bfriends?\b|\bteam\b|\bgroup\b|\banyone\b|\binvite\b|\bbring\b|\badd\b|\binclude\b/i.test(
    text || ''
  );

const mentionsSolo = (text) =>
  /\b(just me|only me|solo|by myself|no one else|no attendees)\b/i.test(text || '');

const detectParticipantPhrase = (text) => {
  if (!text) return null;
  const inviteMatch = String(text).match(
    /\binvite\s+([a-z0-9\s'-]{2,}?)(?=\s+(to|for|on|at|this|next|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i
  );
  if (inviteMatch && inviteMatch[1]) return inviteMatch[1].trim();

  const match = String(text).match(
    /\bwith\s+([a-z0-9\s'-]{2,}?)(?=\s+(on|at|for|tomorrow|today|next|this|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i
  );
  return match && match[1] ? match[1].trim() : null;
};

const detectTitle = (text) => {
  if (!text) return null;
  const quoted = text.match(/"([^"]+)"|'([^']+)'/);
  if (quoted) return quoted[1] || quoted[2];

  const lower = text.toLowerCase();
  const patterns = [
    /\binvite\s+[a-z0-9\s'-]{2,}?\s+to\s+([a-z0-9][a-z0-9\s'-]{2,}?)(?=\s+(on|for|at|tomorrow|today|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i,
    /\b(schedule|plan|book|set up|setup|arrange)\s+(a|an|the)?\s*([a-z0-9][a-z0-9\s'-]{2,}?)(?=\s+(with|on|for|at|tomorrow|today|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i,
    /\b(send|create|make)\s+(a|an|the)?\s*([a-z0-9][a-z0-9\s'-]{2,}?)(?=\s+(invite|invitation)\b|$)/i,
    /\b(invite|invitation)\s+(for|to)?\s*([a-z0-9][a-z0-9\s'-]{2,}?)(?=\s+(with|on|for|at|tomorrow|today|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i,
  ];
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    const candidateIndex = match && match[1] && pattern.source.includes('invite\\s+') ? 1 : 3;
    if (match && match[candidateIndex]) {
      const candidate = match[candidateIndex].trim();
      if (candidate.length >= 2) {
        const cleaned = candidate
          .replace(/\b(with|on|for|at|tomorrow|today|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*$/i, '')
          .trim();
        if (cleaned.length >= 2) {
          return cleaned
            .split(' ')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      }
    }
  }

  return null;
};

const isShortExplicitTitle = (text) => {
  if (!text) return false;
  const cleaned = String(text).trim();
  if (!cleaned) return false;
  if (/\b(am|pm|today|tomorrow|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at)\b/i.test(cleaned)) {
    return false;
  }
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  return wordCount <= 3;
};

const normalizeTitleCandidate = (title) => {
  if (!title) return null;
  const cleaned = String(title).replace(/\s+/g, ' ').trim();
  if (cleaned.length < 2) return null;
  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const stripAttendeeNamesFromTitle = (title, attendeeNames = []) => {
  if (!title) return null;
  if (!attendeeNames.length) return normalizeTitleCandidate(title);
  const titleTokens = String(title)
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean);
  const attendeeTokens = attendeeNames
    .flatMap((name) => normalizeName(name).split(' ').filter(Boolean));
  const filtered = titleTokens.filter(
    (token) => !attendeeTokens.includes(normalizeName(token))
  );
  const trimmedLead = filtered.filter(
    (token, idx) => !(idx === 0 && ['to', 'with', 'for'].includes(token.toLowerCase()))
  );
  return normalizeTitleCandidate(trimmedLead.join(' '));
};

const applyHintsFromText = (draft, text, friends, nowISO, options = {}) => {
  const {
    allowTime = true,
    allowReset = true,
    allowTitle = true,
    allowParticipants = true,
    participantText = null,
  } = options;
  let changed = false;
  if (allowParticipants && !draft.pendingAttendantClarification) {
    const matchTarget = participantText || text;
    const matchResult = fuzzyMatchFriends(matchTarget, friends);
    if (matchResult.ambiguous && matchResult.candidates.length) {
      draft.pendingAttendantClarification = true;
      draft.pendingAttendantOptions = matchResult.candidates;
    } else {
      matchResult.matches.forEach((f) => {
        if (!draft.participantIds.includes(f.id)) {
          draft.participants.push(f);
          draft.participantIds.push(f.id);
          changed = true;
        }
      });
    }
  }

  const duration = detectDurationMinutes(text);
  if (duration && duration !== draft.durationMinutes) {
    draft.durationMinutes = duration;
    changed = true;
  }

  if (allowTime) {
    const desiredTime = detectTime(text);
    if (desiredTime) {
      if (desiredTime.requiresClarification) {
        draft.pendingTimeClarification = desiredTime;
        draft.requestedTime = null;
      } else {
        draft.requestedTime = desiredTime;
        draft.pendingTimeClarification = null;
      }
      changed = true;
    }
  }

  const location = detectLocation(text);
  if (location && !draft.location) {
    draft.location = location;
    changed = true;
  }

  const range =
    detectDateRange(text, nowISO, draft.timezone) ||
    detectNextWeekday(text, nowISO, draft.timezone);
  if (range) {
    const existing = draft.dateRange ? JSON.stringify(draft.dateRange) : null;
    const next = JSON.stringify(range);
    if (existing !== next) {
      draft.dateRange = range;
      changed = true;
    }
  }

  if (allowTitle) {
    const inferredTitle = detectTitle(text);
    if (inferredTitle) {
      const explicitTitle = /\b(title|called|named|titled)\b/i.test(text || '');
      const sanitized = stripAttendeeNamesFromTitle(inferredTitle, draft.participants.map((p) => p.username));
      if (sanitized && (!draft.title || explicitTitle)) {
        draft.title = sanitized;
        changed = true;
      }
    }
  }

  if (mentionsParticipants(text) && draft.participantIds.length === 0) {
    draft.needsParticipants = true;
  }

  if (changed && allowReset) {
    draft.proposedSlots = [];
    draft.pendingSlotIndex = null;
  }

  return changed;
};

const applyParsedSignals = (draft, parsed, friends, messageText = '') => {
  if (!parsed || typeof parsed !== 'object') return false;
  let changed = false;

  const explicitTitle = Boolean(parsed.titleExplicit) || isShortExplicitTitle(messageText);

  if (parsed.location && !draft.location) {
    draft.location = parsed.location;
    changed = true;
  }

  if (parsed.durationMinutes && parsed.durationMinutes !== draft.durationMinutes) {
    draft.durationMinutes = parsed.durationMinutes;
    changed = true;
  }

  if (parsed.time) {
    if (parsed.time.requiresClarification) {
      draft.pendingTimeClarification = parsed.time;
      draft.requestedTime = null;
    } else {
      draft.requestedTime = parsed.time;
      draft.pendingTimeClarification = null;
    }
    changed = true;
  }

  if (parsed.dateRange?.start) {
    const next = JSON.stringify(parsed.dateRange);
    const existing = draft.dateRange ? JSON.stringify(draft.dateRange) : null;
    if (next !== existing) {
      draft.dateRange = parsed.dateRange;
      changed = true;
    }
  }

  const matched = [];
  if (Array.isArray(parsed.attendees) && parsed.attendees.length) {
    parsed.attendees.forEach((name) => {
      const match = fuzzyMatchFriends(name, friends);
      if (match.ambiguous && match.candidates.length) {
        draft.pendingAttendantClarification = true;
        draft.pendingAttendantOptions = match.candidates;
      } else if (match.matches.length) {
        match.matches.forEach((f) => matched.push(f));
      }
    });

    matched.forEach((f) => {
      if (!draft.participantIds.includes(f.id)) {
        draft.participants.push(f);
        draft.participantIds.push(f.id);
        changed = true;
      }
    });
  }

  if (parsed.mentionsAttendees && matched.length === 0 && messageText) {
    const fallbackMatch = fuzzyMatchFriends(messageText, friends);
    if (fallbackMatch.ambiguous && fallbackMatch.candidates.length) {
      draft.pendingAttendantClarification = true;
      draft.pendingAttendantOptions = fallbackMatch.candidates;
    } else if (fallbackMatch.matches.length) {
      fallbackMatch.matches.forEach((f) => {
        if (!draft.participantIds.includes(f.id)) {
          draft.participants.push(f);
          draft.participantIds.push(f.id);
          changed = true;
        }
      });
    }
  }

  if (parsed.title || explicitTitle) {
    const attendeeNames = [
      ...(parsed.attendees || []),
      ...draft.participants.map((p) => p.username).filter(Boolean),
    ];
    const candidateTitle = explicitTitle ? messageText : parsed.title;
    const sanitizedTitle = stripAttendeeNamesFromTitle(candidateTitle, attendeeNames);
    if (sanitizedTitle && (explicitTitle || !draft.title)) {
      draft.title = sanitizedTitle;
      changed = true;
    }
  }

  if (parsed.mentionsAttendees && draft.participantIds.length === 0) {
    draft.needsParticipants = true;
    changed = true;
  } else if (parsed.mentionsAttendees && draft.participantIds.length > 0) {
    draft.needsParticipants = false;
    changed = true;
  }

  if (!parsed.mentionsAttendees && draft.participantIds.length === 0) {
    draft.needsParticipants = false;
  }

  return changed;
};

const mergeIntervals = (intervals) => {
  if (!intervals.length) return [];
  const sorted = intervals
    .map((i) => ({ start: new Date(i.start), end: new Date(i.end) }))
    .sort((a, b) => a.start - b.start);

  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr.start <= last.end) {
      if (curr.end > last.end) last.end = curr.end;
    } else {
      merged.push(curr);
    }
  }
  return merged.map((i) => ({ start: i.start.toISOString(), end: i.end.toISOString() }));
};

const subtractBusy = (windowStart, windowEnd, busyIntervals, durationMinutes) => {
  const merged = mergeIntervals(busyIntervals);
  const free = [];
  let cursor = windowStart;

  merged.forEach((slot) => {
    const busyStart = new Date(slot.start);
    if (busyStart > cursor) {
      free.push({ start: cursor.toISOString(), end: new Date(busyStart).toISOString() });
    }
    const busyEnd = new Date(slot.end);
    if (busyEnd > cursor) cursor = busyEnd;
  });

  if (cursor < windowEnd) {
    free.push({ start: cursor.toISOString(), end: new Date(windowEnd).toISOString() });
  }

  return free.filter((s) => new Date(s.end) - new Date(s.start) >= durationMinutes * 60 * 1000);
};

const dateKeyInTz = (date, tz) => toISODateInTz(date, tz);

const findSharedSlots = (allBusy, rangeStartISO, rangeEndISO, durationMinutes, requestedTime, tz) => {
  const slots = [];
  const cursor = new Date(rangeStartISO);
  const end = new Date(rangeEndISO);

  while (cursor <= end && slots.length < 6) {
    const cursorKey = dateKeyInTz(cursor, tz);
    const dayStart = zonedDateTimeFromParts(cursorKey, '08:00', tz);
    const dayEnd = zonedDateTimeFromParts(cursorKey, '20:00', tz);

    const busyToday = allBusy.filter((b) => {
      const start = new Date(b.start);
      return dateKeyInTz(start, tz) === cursorKey;
    });

    const free = subtractBusy(dayStart, dayEnd, busyToday, durationMinutes);

    const pickSlotFromFree = () => {
      for (const slot of free) {
        const startISO = slot.start;
        const endISO = slot.end;
        const intervalStart = new Date(startISO);
        const intervalEnd = new Date(endISO);

        let candidateStart = new Date(intervalStart);
        if (requestedTime) {
          const preferred = zonedDateTimeFromParts(
            cursorKey,
            `${String(requestedTime.hour).padStart(2, '0')}:${String(requestedTime.minute).padStart(
              2,
              '0'
            )}`,
            tz
          );
          if (preferred < intervalStart) candidateStart = intervalStart;
          else if (preferred >= intervalStart && preferred < intervalEnd) candidateStart = preferred;
        }

        const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
        if (candidateEnd <= intervalEnd) {
          return {
            start: candidateStart.toISOString(),
            end: candidateEnd.toISOString(),
          };
        }
      }
      return null;
    };

    const chosen = pickSlotFromFree();
    if (chosen) slots.push(chosen);

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots.slice(0, 3);
};

const buildCommitmentIntervals = (events, windowStartISO, windowEndISO, tz) => {
  const windowStart = new Date(windowStartISO);
  const windowEnd = new Date(windowEndISO);
  const intervals = [];

  events.forEach((event) => {
    const date = event.date || event.event_date;
    const startTime = event.startTime || event.starttime || event.start_time;
    const endTime = event.endTime || event.endtime || event.end_time;
    if (!date || !startTime || !endTime) return;

    const target = zonedDateTimeFromParts(date, '00:00', tz);
    if (target < windowStart || target > windowEnd) return;
    intervals.push({
      start: toISO(toDateWithTime(date, startTime, tz)),
      end: toISO(toDateWithTime(date, endTime, tz)),
    });
  });

  return intervals;
};

const apiClient = (env, authHeader) => {
  const base = env.API_BASE_URL || 'http://localhost:5000';
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers.Authorization = authHeader;
  log('using API base', base);

  const parseJson = (text) => {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Failed to parse JSON: ${err.message}`);
    }
  };

  const getFriends = async (userId) => {
    const url = `${base}/api/social/${userId}/get-friends`;
    const res = await fetch(url, { headers });
    const text = await res.text();
    if (!res.ok) {
      logError('get-friends failed', res.status, 'url', url, 'body', text);
      throw new Error(`get-friends failed (${res.status})`);
    }
    return parseJson(text);
  };

  const getUserSchedule = async (userId) => {
    const url = `${base}/api/users/${userId}/get-events`;
    const res = await fetch(url, { headers });
    const text = await res.text();
    if (!res.ok) {
      logError('get-events failed', res.status, 'url', url, 'body', text);
      throw new Error(`get-events failed (${res.status})`);
    }
    const data = parseJson(text);
    return data.rows || [];
  };

  const createInvite = async ({
    hostId,
    friendIds,
    startISO,
    endISO,
    title,
    location,
    note,
    timezone,
  }) => {
    log('createInvite called', {
      hostId,
      friendIdsCount: friendIds.length,
      startISO,
      endISO,
      title,
    });
    const start = new Date(startISO);
    const end = new Date(endISO);
    const toTimeStr = (date) => {
      const parts = getTzParts(date, timezone);
      return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
    };

    const payload = {
      name: title,
      startTime: toTimeStr(start),
      endTime: toTimeStr(end),
      date: toISODateInTz(start, timezone),
    };

    const eventUrl = `${base}/api/users/${hostId}/add-event`;
    const eventRes = await fetch(eventUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const eventText = await eventRes.text();
    if (!eventRes.ok) {
      logError('add-event failed', eventRes.status, 'url', eventUrl, 'body', eventText);
      throw new Error(`add-event failed (${eventRes.status})`);
    }
    const eventData = parseJson(eventText);
    const eventId = eventData.eventId;

    const dateLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(start);

    for (const friendId of friendIds) {
      const content =
        `${title} on ${dateLabel} at ${toTimeStr(start)} ` +
        (location ? `@ ${location} ` : '') +
        (note ? `- ${note}` : '');
      const url = `${base}/api/social/${hostId}/${friendId}/send-message`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'event_invite',
          content,
          payload: { ...payload, eventId },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        logError('send-message (invite) failed', res.status, 'url', url, 'body', text);
        throw new Error(`send-message failed (${res.status})`);
      }
    }

    return { eventId };
  };

  const notifyInvite = async ({ inviteId, friendIds, message }) => {
    for (const friendId of friendIds) {
      const url = `${base}/api/social/${inviteId}/${friendId}/send-message`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'message',
          content: message || 'A new invite is ready for you.',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        logError('notify send-message failed', res.status, 'url', url, 'body', text);
        throw new Error(`notify failed (${res.status})`);
      }
    }
  };

  return { getFriends, getUserSchedule, createInvite, notifyInvite };
};

const ensureSession = (sessionId) => {
  if (sessions.size > 200) {
    const oldest = [...sessions.entries()].sort((a, b) => a[1].lastTouched - b[1].lastTouched)[0];
    if (oldest) sessions.delete(oldest[0]);
  }
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      lastTouched: Date.now(),
      history: [],
      draft: {
        title: null,
        participants: [],
        participantIds: [],
        durationMinutes: null,
        dateRange: null,
        timezone: null,
        location: null,
        note: null,
        proposedSlots: [],
        pendingSlotIndex: null,
        requestedTime: null,
        pendingTimeClarification: null,
        needsParticipants: false,
        pendingAttendantClarification: false,
        pendingAttendantOptions: [],
      },
    });
  }
  const session = sessions.get(sessionId);
  session.lastTouched = Date.now();
  return session;
};

const collectMissing = (draft) => {
  const missing = [];
  if (!draft.title) missing.push('title');
  if (!draft.dateRange) missing.push('date range');
  if (!draft.durationMinutes) missing.push('duration');
  if (draft.needsParticipants && !draft.participantIds.length) missing.push('attendants');
  // Title, location are optional; timezone defaults to UTC if not provided.
  return missing;
};

const buildActionsForSlots = (slots, tz) =>
  slots.map((slot, idx) => ({
    label: `Option ${idx + 1}`,
    value: `option ${idx + 1}`,
    hint: formatSlot(slot, tz),
  }));

const plannerReply = async (payload, env, authHeader) => {
  const { userId, message, sessionId: incomingSessionId, timezone: clientTz } = payload;
  const sessionId = incomingSessionId || crypto.randomUUID();
  log('incoming chat', { userId, sessionId, message });
  if (!env.AI || !env.PLANNER_MODEL) {
    log('llm parse disabled', { reason: 'env.AI or PLANNER_MODEL missing' });
  }
  const session = ensureSession(sessionId);
  const draft = session.draft;
  draft.timezone = draft.timezone || clientTz || 'UTC';
  draft.durationMinutes = draft.durationMinutes || 60;
  draft.needsParticipants = draft.needsParticipants || false;
  draft.pendingAttendantClarification = draft.pendingAttendantClarification || false;
  draft.pendingAttendantOptions = draft.pendingAttendantOptions || [];

  const client = apiClient(env, authHeader);

  // Keep friend list and attempts handy
  let friends = [];
  try {
    friends = await client.getFriends(userId);
  } catch (err) {
    logError('Failed to load friends', err);
  }

  const candidateUsers = friends;

  const slotChoice = detectSlotChoice(message);
  const wantsSend = detectSendIntent(message);

  const freezeContext = draft.proposedSlots.length > 0 && (wantsSend || slotChoice !== null);

  session.history.push(message);
  if (session.history.length > 8) session.history = session.history.slice(-8);

  if (!freezeContext) {
    const contextText = session.history.join(' ');
    applyHintsFromText(draft, contextText, candidateUsers, payload.clientTimeISO, {
      allowTime: false,
      allowReset: true,
      allowTitle: false,
      allowParticipants: false,
    });
  }

  let parsed = null;
  if (!freezeContext) {
    parsed = await parseWithLLM({
      message: String(message || ''),
      history: session.history.slice(-4),
      nowISO: payload.clientTimeISO || new Date().toISOString(),
      timezone: draft.timezone,
      env,
    });
  }

  let changed = false;
  if (parsed) {
    log('parsed signals', {
      title: parsed.title || null,
      attendees: parsed.attendees || [],
      mentionsAttendees: parsed.mentionsAttendees,
      dateRange: parsed.dateRange || null,
      time: parsed.time || null,
      durationMinutes: parsed.durationMinutes || null,
      location: parsed.location || null,
    });
    changed = applyParsedSignals(draft, parsed, candidateUsers, String(message || ''));
    log('draft after parse', {
      title: draft.title,
      participantIds: draft.participantIds,
      needsParticipants: draft.needsParticipants,
      dateRange: draft.dateRange,
      requestedTime: draft.requestedTime,
      durationMinutes: draft.durationMinutes,
    });
  } else {
    const participantPhrase = detectParticipantPhrase(String(message || ''));
    const matchResultCurrent = fuzzyMatchFriends(
      participantPhrase || String(message || ''),
      candidateUsers
    );

    if (
      mentionsParticipants(message) &&
      !matchResultCurrent.ambiguous &&
      matchResultCurrent.matches.length > 0
    ) {
      draft.pendingAttendantClarification = false;
      draft.pendingAttendantOptions = [];
    }

    changed = applyHintsFromText(draft, String(message || ''), candidateUsers, payload.clientTimeISO, {
      allowTime: true,
      allowReset: !wantsSend && !freezeContext,
      allowTitle: !mentionsParticipants(message),
      allowParticipants: true,
      participantText: participantPhrase,
    });

    if (mentionsParticipants(message)) {
      if (matchResultCurrent.ambiguous || matchResultCurrent.matches.length === 0) {
        draft.needsParticipants = true;
      } else {
        draft.needsParticipants = false;
      }
    } else if (draft.participantIds.length === 0) {
      draft.needsParticipants = false;
    }

    if (!wantsSend && !freezeContext && mentionsSolo(message)) {
      draft.participants = [];
      draft.participantIds = [];
      draft.needsParticipants = false;
      draft.pendingAttendantClarification = false;
      draft.pendingAttendantOptions = [];
    }

    log('draft after heuristics', {
      title: draft.title,
      participantIds: draft.participantIds,
      needsParticipants: draft.needsParticipants,
      dateRange: draft.dateRange,
      requestedTime: draft.requestedTime,
      durationMinutes: draft.durationMinutes,
    });
  }

  if (changed && !freezeContext) {
    draft.proposedSlots = [];
    draft.pendingSlotIndex = null;
  }

  if (draft.pendingTimeClarification) {
    const { hour } = draft.pendingTimeClarification;
    return {
      sessionId,
      replyText: `Did you mean ${hour}:00 am or ${hour}:00 pm? Reply with \"${hour}am\" or \"${hour}pm\" to continue.`,
      actions: [
        { label: `${hour}:00 AM`, value: `${hour}am` },
        { label: `${hour}:00 PM`, value: `${hour}pm` },
      ],
      requiresConfirmation: false,
      draftInvite: null,
    };
  }

  if (draft.pendingAttendantClarification && draft.pendingAttendantOptions.length) {
    const lowerMessage = String(message || '').toLowerCase();
    const selected = draft.pendingAttendantOptions.find((option) =>
      lowerMessage.includes(String(option.username || '').toLowerCase())
    );
    if (selected) {
      if (!draft.participantIds.includes(selected.id)) {
        draft.participants.push(selected);
        draft.participantIds.push(selected.id);
      }
      draft.pendingAttendantClarification = false;
      draft.pendingAttendantOptions = [];
    } else {
      return {
        sessionId,
        replyText: `Which attendant did you mean?`,
        actions: draft.pendingAttendantOptions.map((option) => ({
          label: option.username,
          value: option.username,
        })),
        requiresConfirmation: false,
        draftInvite: null,
      };
    }
  }

  const missing = collectMissing(draft);
  if (missing.length) {
    const onlyTitle = missing.length === 1 && missing[0] === 'title';
    const onlyAttendees = missing.length === 1 && missing[0] === 'attendants';
    const onlyDate = missing.length === 1 && missing[0] === 'date range';
    const onlyDuration = missing.length === 1 && missing[0] === 'duration';
    const prompt = onlyTitle
      ? 'What should I call it?'
      : onlyAttendees
        ? 'Who should I invite?'
        : onlyDate
          ? 'What day should this be?'
          : onlyDuration
            ? 'How long should it be?'
            : `I need ${missing.join(', ')}. Share a date, how long, and who should attend (defaults to you).`;
    return {
      sessionId,
      replyText: prompt,
      actions: [],
      requiresConfirmation: false,
      draftInvite: null,
    };
  }

  // Only recompute slots when we don't have any yet
  if (!draft.proposedSlots.length) {
    const participantIds = [userId, ...draft.participantIds];
    let schedules;
    try {
      schedules = await Promise.all(
        participantIds.map(async (id) => ({
          id,
          events: await client.getUserSchedule(id),
        }))
      );
    } catch (err) {
      logError('Failed to load schedules', err);
      throw err;
    }

    const allBusy = schedules.flatMap((sched) =>
      buildCommitmentIntervals(
        sched.events,
        draft.dateRange.start,
        draft.dateRange.end,
        draft.timezone
      )
    );

    const slots = findSharedSlots(
      allBusy,
      zonedDateTimeFromParts(draft.dateRange.start, '00:00', draft.timezone).toISOString(),
      zonedDateTimeFromParts(draft.dateRange.end, '23:59', draft.timezone).toISOString(),
      draft.durationMinutes,
      draft.requestedTime,
      draft.timezone
    );

    draft.proposedSlots = slots;
    if (!slots.length) {
      return {
        sessionId,
        replyText: 'I could not find a mutual time in that range. Should I look at a wider range or different times?',
        actions: [],
        requiresConfirmation: false,
        draftInvite: null,
      };
    }

    const single = slots.length === 1;
    const replyLines = single
      ? `${draft.title}: ${formatSlot(slots[0], draft.timezone)}.`
      : slots
          .map((slot, idx) => `Option ${idx + 1}: ${formatSlot(slot, draft.timezone)}`)
          .join('\n');

    return {
      sessionId,
      replyText: single
        ? `${replyLines} Confirm.`
        : `Options for ${draft.title}:\n${replyLines}\nReply with the option number, then Confirm.`,
      actions: buildActionsForSlots(slots, draft.timezone),
      requiresConfirmation: true,
      draftInvite: {
        title: draft.title,
        timezone: draft.timezone,
        location: draft.location,
        options: draft.proposedSlots,
        participants: draft.participantIds,
      },
    };
  }

  // We already have options; look for selection/confirmation
  if (slotChoice !== null && draft.proposedSlots[slotChoice]) {
    draft.pendingSlotIndex = slotChoice;
  }

  const selected =
    draft.pendingSlotIndex !== null
      ? draft.proposedSlots[draft.pendingSlotIndex]
      : draft.proposedSlots[0];

  log('send intent check', {
    wantsSend,
    slotChoice,
    pendingSlotIndex: draft.pendingSlotIndex,
    proposedSlotsCount: draft.proposedSlots.length,
    freezeContext,
  });

  if (wantsSend && selected) {
    const result = await client.createInvite({
      hostId: userId,
      friendIds: draft.participantIds,
      startISO: selected.start,
      endISO: selected.end,
      title: draft.title,
      location: draft.location,
      note: draft.note,
      timezone: draft.timezone,
    });

    const attendeeNames = draft.participants.map((p) => p.username).filter(Boolean);

    session.draft = {
      title: null,
      participants: [],
      participantIds: [],
      durationMinutes: null,
      dateRange: null,
      timezone: draft.timezone,
      location: null,
      note: null,
      proposedSlots: [],
      pendingSlotIndex: null,
      requestedTime: null,
      pendingTimeClarification: null,
      pendingAttendantClarification: false,
      pendingAttendantOptions: [],
      needsParticipants: false,
    };

    const replyText =
      draft.participantIds.length > 0
        ? `Added ${draft.title} to your calendar and sent invites to ${attendeeNames.join(
            ', '
          )} for ${formatSlot(selected, draft.timezone)}. Status is pending until everyone accepts.`
        : `Added ${draft.title} to your calendar for ${formatSlot(selected, draft.timezone)}.`;

    return {
      sessionId,
      replyText,
      actions: [],
      requiresConfirmation: false,
      draftInvite: {
        title: draft.title,
        startISO: selected.start,
        endISO: selected.end,
        participants: draft.participantIds,
        eventId: result.eventId,
      },
    };
  }

  if (selected) {
    return {
      sessionId,
      replyText: `I have ${formatSlot(selected, draft.timezone)} queued. Tap Confirm to send the invite or pick a different option.`,
      actions: buildActionsForSlots(draft.proposedSlots, draft.timezone),
      requiresConfirmation: true,
      draftInvite: {
        title: draft.title,
        startISO: selected.start,
        endISO: selected.end,
        participants: draft.participantIds,
      },
    };
  }

  return {
    sessionId,
    replyText: 'I am ready to schedule. Tell me which option to use and say "send it" to confirm.',
    actions: buildActionsForSlots(draft.proposedSlots, draft.timezone),
    requiresConfirmation: true,
    draftInvite: null,
  };
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (request.method === 'POST' && url.pathname === '/chat') {
      try {
        const payload = await request.json();
        if (!payload.userId || !payload.message) {
          return jsonResponse({ error: 'userId and message are required' }, 400);
        }

        const reply = await plannerReply(payload, env, request.headers.get('authorization'));
        return jsonResponse(reply);
      } catch (err) {
        logError('chat handler error', err);
        return jsonResponse(
          { replyText: 'Sorry, I could not process that request. Please try again shortly.' },
          500
        );
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
