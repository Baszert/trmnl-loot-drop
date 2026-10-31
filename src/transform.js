// Loot Drop: free games right now and soon. IDX_0 Epic freeGamesPromotions, IDX_1 GamerPower giveaways (type=game).
// Epic lists sales next to giveaways; only a 0% discount price is free.
function transform(input) {
  try {
    var now = Math.round((input.__now || Date.now()) / 1000);
    var secs = function (d) { return d ? Math.round(Date.parse(d.replace(' ', 'T') + (/Z|[+-]\d\d:?\d\d$/.test(d) ? '' : 'Z')) / 1000) : null; };
    var key = function (t) { return t.toLowerCase().replace(/\(.*?\)|giveaway|key|[^a-z0-9]/g, ''); };
    var items = [], seen = {};
    // The same game can come from both sources ("Home" and "Home - A Unique Horror Adventure"): keep the first, take the claim count.
    var add = function (it) {
      var k = key(it.title), dup = items.filter(function (x) { var a = key(x.title); return a === k || (k.length > 3 && a.length > 3 && (a.indexOf(k) === 0 || k.indexOf(a) === 0)); })[0];
      if (dup) { if (it.claims && !dup.claims) dup.claims = it.claims; if (!dup.url) dup.url = it.url; return; }
      items.push(it);
    };

    // Epic: the weekly free games, and the ones already announced.
    var els = ((((input.IDX_0 || {}).data || {}).Catalog || {}).searchStore || {}).elements;
    var okEpic = Array.isArray(els); els = els || [];
    els.forEach(function (e) {
      var p = e.promotions || {};
      var pick = function (groups) {
        return (groups || []).reduce(function (a, g) { return a.concat(g.promotionalOffers || []); }, [])
          .filter(function (o) { return o.discountSetting && o.discountSetting.discountPercentage === 0; })[0];
      };
      var cur = pick(p.promotionalOffers), up = pick(p.upcomingPromotionalOffers), o = cur || up;
      if (!o) return;
      var img = function (types) { var k = (e.keyImages || []).filter(function (i) { return types.indexOf(i.type) >= 0; })[0]; return k ? k.url : ''; };
      var price = ((e.price || {}).totalPrice || {});
      add({
        title: e.title, store: 'EPIC', kind: cur || (Date.parse(o.startDate) / 1000 <= now) ? 'now' : 'next',
        worth: price.originalPrice ? price.originalPrice / Math.pow(10, (price.currencyInfo || {}).decimals || 2) : 0,
        cur: (price.currencyCode || 'EUR'),
        starts: secs(o.startDate), ends: secs(o.endDate),
        wide: img(['OfferImageWide', 'DieselStoreFrontWide', 'Thumbnail']), tall: img(['OfferImageTall', 'Thumbnail']),
        url: 'https://store.epicgames.com/p/' + ((((e.catalogNs || {}).mappings || [])[0] || {}).pageSlug || e.productSlug || e.urlSlug),
        claims: null
      });
    });

    // GamerPower: giveaways on every other store (and Epic extras).
    var STORES = [['Epic Games Store', 'EPIC'], ['Steam', 'STEAM'], ['GOG', 'GOG'], ['Itch.io', 'ITCH'], ['Prime Gaming', 'PRIME'], ['Ubisoft', 'UBI'], ['EA', 'EA'], ['Xbox', 'XBOX'], ['PlayStation', 'PS'], ['Nintendo', 'NSW'], ['Android', 'MOBILE'], ['iOS', 'MOBILE'], ['VR', 'VR'], ['DRM-Free', 'DRM-FREE']];
    // TRMNL hands a top-level JSON array over as { data: [...] }.
    // GamerPower answers {status: 0} when nothing matches: that is a working source with no giveaways.
    var gp = input.IDX_1, okGp = Array.isArray(gp) || Array.isArray((gp || {}).data) || (gp && gp.status === 0);
    if (gp && !Array.isArray(gp)) gp = Array.isArray(gp.data) ? gp.data : [];
    (gp || []).forEach(function (g) {
      if (g.status && g.status !== 'Active') return;
      var store = 'PC';
      STORES.some(function (s) { if ((g.platforms || '').indexOf(s[0]) >= 0) { store = s[1]; return true; } return false; });
      var m = /\(([^)]+)\)/.exec(g.title);
      if ((store === 'DRM-FREE' || store === 'PC') && m) store = m[1].toUpperCase().replace(/\s+/g, '').slice(0, 9);
      add({
        title: g.title.replace(/\s*\([^)]*\)\s*(Key\s*)?Giveaway$/i, '').replace(/\s*Giveaway$/i, ''),
        store: store, kind: 'now',
        worth: parseFloat(String(g.worth).replace(/[^0-9.]/g, '')) || 0, cur: 'USD',
        starts: secs(g.published_date), ends: g.end_date && g.end_date !== 'N/A' ? secs(g.end_date) : null,
        wide: g.image || g.thumbnail || '', tall: '', claims: g.users || null,
        url: g.open_giveaway_url || g.gamerpower_url || ''
      });
    });

    // Rarity by what it would have cost.
    items.forEach(function (it) {
      it.left = it.ends ? it.ends - now : null;
      it.window = it.ends && it.starts ? it.ends - it.starts : null;
      it.hp = it.left != null && it.window ? Math.max(0, Math.min(100, Math.round(it.left / it.window * 100))) : null;
      it.store_name = ({ EPIC: 'Epic Games', STEAM: 'Steam', GOG: 'GOG', ITCH: 'itch.io', PRIME: 'Prime Gaming', UBI: 'Ubisoft', EA: 'EA app', XBOX: 'Xbox', PS: 'PlayStation', NSW: 'Switch', MOBILE: 'Mobile', VR: 'VR' })[it.store] || it.store;
      it.worth_txt = it.worth ? (it.cur === 'EUR' ? '€' : '$') + it.worth.toFixed(2) : '';
    });
    // Big stores first, then by value.
    var RANK = { EPIC: 0, STEAM: 0, GOG: 0, PRIME: 1, UBI: 1, EA: 1 };
    var live = items.filter(function (i) { return i.kind === 'now' && (i.ends == null || i.ends > now); })
      .sort(function (a, b) { return ((RANK[a.store] != null ? RANK[a.store] : 2) - (RANK[b.store] != null ? RANK[b.store] : 2)) || b.worth - a.worth; });
    var next = items.filter(function (i) { return i.kind === 'next' && i.starts > now; }).sort(function (a, b) { return a.starts - b.starts; });
    var total = live.reduce(function (s, i) { return s + i.worth; }, 0);
    var d = new Date(now * 1000), t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    var week = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
    var fresh = live.filter(function (i) { return i.starts && now - i.starts < 86400; }).length;
    var status = okEpic && okGp ? 'ok' : okEpic || okGp ? 'partial' : 'offline';
    return { loot: { now: now, week: week, fresh: fresh, status: status, live: live, next: next, total: Math.round(total), count: live.length } };
  } catch (err) {
    return { loot: { error: String(err), status: 'offline', live: [], next: [], count: 0, total: 0, now: Math.round(Date.now() / 1000) } };
  }
}
if (typeof module !== 'undefined') module.exports = transform;
