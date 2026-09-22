#!/usr/bin/env node
/**
 * Test suite for metadata-mapper.js (summary card output)
 */

const assert = require('assert');
const { metadataToCard } = require('./metadata-mapper.js');

let passed = 0;
function check(label, condition) {
  assert.ok(condition, `FAILED: ${label}`);
  console.log(`  ✓ ${label}`);
  passed++;
}

const statOf = (card, label) => card.stats.find((s) => s.label === label);
const sectionOf = (card, prefix) => card.sections.find((s) => s.heading.startsWith(prefix));

console.log('\nTEST 1: Complete metadata');
{
  const card = metadataToCard({
    name: 'test-initiative',
    stage: 'building',
    nextAction: 'Ship it',
    definitionOfDone: [
      { criterion: 'A', completed: true },
      { criterion: 'B', completed: true },
      { criterion: 'C', completed: false },
    ],
    blockers: [{ blocker: 'resolved one', active: false }, { blocker: 'Missing dep', active: true }],
    progress: [{ timestamp: '2024-01-15T10:00:00Z', entry: 'Started work' }],
    questions: [{ question: 'Use X?', open: true }],
    decisions: [{ decision: 'Use Y' }],
  });
  check('stage stat is BUILDING/warn', statOf(card, 'Stage').value === 'BUILDING' && statOf(card, 'Stage').tone === 'warn');
  check('DoD stat is 2/3 at 67%', statOf(card, 'Definition of Done').value === '2/3' && statOf(card, 'Definition of Done').progress === 67);
  check('active blockers counted as 1', statOf(card, 'Active Blockers').value === '1');
  check('inactive blocker excluded from section', sectionOf(card, 'Active Blockers').items.length === 1);
  check('next action section present', sectionOf(card, 'Next Action').items[0].text === 'Ship it');
  check('DoD items carry done/todo state', sectionOf(card, 'Definition of Done').items.map((i) => i.state).join() === 'done,done,todo');
  check('progress entry has meta timestamp', !!sectionOf(card, 'Recent Progress').items[0].meta);
}

console.log('\nTEST 2: Minimal metadata');
{
  const card = metadataToCard({ name: 'sparse' });
  check('title falls back to name', card.title === 'sparse');
  check('stage shows UNKNOWN', statOf(card, 'Stage').value === 'UNKNOWN');
  check('DoD shows 0/0', statOf(card, 'Definition of Done').value === '0/0');
  check('no sections emitted for empty arrays', card.sections.length === 0);
}

console.log('\nTEST 3: Stage tone mapping');
{
  const expected = { planning: 'info', building: 'warn', review: 'info', done: 'ok', blocked: 'bad', paused: 'warn' };
  Object.entries(expected).forEach(([stage, tone]) => {
    check(`${stage} → ${tone}`, statOf(metadataToCard({ stage }), 'Stage').tone === tone);
  });
  check('unknown stage → neutral', statOf(metadataToCard({ stage: 'weird' }), 'Stage').tone === 'neutral');
}

console.log('\nTEST 4: DoD extremes');
{
  const full = metadataToCard({ definitionOfDone: [{ completed: true }, { completed: true }] });
  check('2/2 is 100% and ok tone', statOf(full, 'Definition of Done').progress === 100 && statOf(full, 'Definition of Done').tone === 'ok');
  const zero = metadataToCard({ definitionOfDone: [{ completed: false }] });
  check('0/1 is 0%', statOf(zero, 'Definition of Done').progress === 0);
  const none = metadataToCard({ definitionOfDone: [] });
  check('empty DoD does not divide by zero', statOf(none, 'Definition of Done').progress === 0);
}

console.log('\nTEST 5: Clean state tones');
{
  const card = metadataToCard({ stage: 'done', blockers: [], questions: [] });
  check('zero blockers → ok tone', statOf(card, 'Active Blockers').tone === 'ok');
  check('zero questions → ok tone', statOf(card, 'Open Questions').tone === 'ok');
}

console.log('\nTEST 6: Progress truncation');
{
  const card = metadataToCard({
    progress: Array.from({ length: 10 }, (_, i) => ({ timestamp: '2024-01-01T00:00:00Z', entry: `Entry ${i}` })),
  });
  const section = sectionOf(card, 'Recent Progress');
  check('only 5 of 10 entries rendered', section.items.length === 5);
  check('heading states the truncation', section.heading === 'Recent Progress (5 of 10)');
  const long = metadataToCard({ progress: [{ entry: 'x'.repeat(300) }] });
  check('long entry truncated to 160 chars', sectionOf(long, 'Recent Progress').items[0].text.length === 160);
}

console.log('\nTEST 7: Error handling');
{
  check('null input yields error card', !!metadataToCard(null).error);
  check('string input yields error card', !!metadataToCard('nope').error);
  check('array input yields error card', !!metadataToCard([]).error);
  check('empty object is not an error', !metadataToCard({}).error);
  check('non-array fields do not throw', !!metadataToCard({ definitionOfDone: 'bad', blockers: null }));
  check('malformed timestamp is dropped', metadataToCard({ progress: [{ entry: 'x', timestamp: 'garbage' }] }).sections[0].items[0].meta === undefined);
}

console.log('\nTEST 8: Determinism');
{
  const meta = { name: 'd', stage: 'done', definitionOfDone: [{ criterion: 'X', completed: true }], progress: [{ entry: 'e' }] };
  const runs = [0, 1, 2].map(() => JSON.stringify(metadataToCard(meta)));
  check('three runs produce identical output', runs[0] === runs[1] && runs[1] === runs[2]);
}

console.log(`\n✅ All ${passed} assertions passed.\n`);
