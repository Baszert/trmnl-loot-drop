// Real data from Epic and GamerPower (26 Oct 2026), seen at three moments.
import fs from 'node:fs';
const raw = (f) => JSON.parse(fs.readFileSync(new URL('./raw/' + f, import.meta.url)));
const at = (now) => () => ({ IDX_0: raw('epic.json'), IDX_1: raw('gp_main.json'), __now: Date.parse(now) });
export const S = {
  mon: { label: 'Monday 26 Oct, 16:00', lang: 'en', off: 3600, input: at('2026-10-26T15:00Z') },
  thu: { label: 'Thursday 29 Oct, 14:00: Sker Ritual about to despawn', lang: 'en', off: 3600, input: at('2026-10-29T13:00Z') },
  drop: { label: 'Thursday 29 Oct, 17:00: new Epic drop just landed', lang: 'en', off: 3600, input: at('2026-10-29T16:00Z') },
  offline: { label: 'No connection: neither store answers', lang: 'en', off: 3600, input: () => ({ IDX_0: { error: 'timeout' }, IDX_1: { error: 'timeout' }, __now: Date.parse('2026-10-26T15:00Z') }) },
  empty: { label: 'Online, but nothing is free right now', lang: 'en', off: 3600, input: () => ({ IDX_0: { data: { Catalog: { searchStore: { elements: [] } } } }, IDX_1: { status: 0, status_message: 'No active giveaways available at the moment, please try again later.' }, __now: Date.parse('2026-10-26T15:00Z') }) },
};
