/**
 * Deterministic forge metadata → summary card data
 * No LLM involvement. Pure schema-to-data mapping.
 *
 * Output is structured data (not HTML) so the canvas can escape it safely.
 */

const STAGE_TONE = {
  planning: 'info',
  building: 'warn',
  review: 'info',
  done: 'ok',
  blocked: 'bad',
  paused: 'warn',
};

function metadataToCard(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {
      title: 'Invalid metadata',
      subtitle: 'Expected a JSON object',
      stats: [],
      sections: [],
      error: 'Invalid metadata: not an object',
    };
  }

  const {
    name = 'unknown',
    displayName,
    stage = 'unknown',
    nextAction,
    outcome,
    definitionOfDone = [],
    blockers = [],
    progress = [],
    questions = [],
    decisions = [],
    updated,
  } = metadata;

  const dod = Array.isArray(definitionOfDone) ? definitionOfDone : [];
  const dodDone = dod.filter((d) => d && d.completed).length;
  const dodPct = dod.length ? Math.round((dodDone / dod.length) * 100) : 0;

  const activeBlockers = (Array.isArray(blockers) ? blockers : []).filter((b) => b && b.active);
  const openQuestions = (Array.isArray(questions) ? questions : []).filter((q) => q && q.open);
  const progressList = Array.isArray(progress) ? progress : [];

  const stats = [
    { label: 'Stage', value: String(stage).toUpperCase(), tone: STAGE_TONE[stage] || 'neutral' },
    {
      label: 'Definition of Done',
      value: `${dodDone}/${dod.length}`,
      detail: `${dodPct}%`,
      tone: dod.length && dodDone === dod.length ? 'ok' : 'neutral',
      progress: dodPct,
    },
    {
      label: 'Active Blockers',
      value: String(activeBlockers.length),
      tone: activeBlockers.length ? 'bad' : 'ok',
    },
    {
      label: 'Open Questions',
      value: String(openQuestions.length),
      tone: openQuestions.length ? 'warn' : 'ok',
    },
    {
      label: 'Decisions',
      value: String((Array.isArray(decisions) ? decisions : []).length),
      tone: 'neutral',
    },
  ];

  const sections = [];

  if (nextAction) {
    sections.push({ heading: 'Next Action', items: [{ text: String(nextAction) }] });
  }

  if (dod.length) {
    sections.push({
      heading: 'Definition of Done',
      items: dod.map((d) => ({
        text: String(d && d.criterion ? d.criterion : 'unnamed criterion'),
        state: d && d.completed ? 'done' : 'todo',
      })),
    });
  }

  if (activeBlockers.length) {
    sections.push({
      heading: 'Active Blockers',
      items: activeBlockers.map((b) => ({ text: String(b.blocker || 'unnamed blocker'), state: 'bad' })),
    });
  }

  if (openQuestions.length) {
    sections.push({
      heading: 'Open Questions',
      items: openQuestions.map((q) => ({ text: String(q.question || 'unnamed question'), state: 'warn' })),
    });
  }

  if (progressList.length) {
    sections.push({
      heading: `Recent Progress (${Math.min(5, progressList.length)} of ${progressList.length})`,
      items: progressList.slice(0, 5).map((p) => ({
        text: truncate(String((p && p.entry) || ''), 160),
        meta: formatTime(p && p.timestamp),
      })),
    });
  }

  return {
    title: displayName || name,
    subtitle: outcome ? truncate(String(outcome), 200) : undefined,
    updated: formatTime(updated),
    stats,
    sections,
  };
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function formatTime(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toLocaleString();
}

module.exports = { metadataToCard };
