export function categorySlug(name) {
    const raw = (name || '').toString().trim().toLowerCase()
    const map = {
      'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y',
      'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch',
      'ш':'sh','щ':'shch','ю':'yu','я':'ya','ь':'',"'":'', '’':'', 'ʼ':'', '`':'',
    }

    const translit = raw
      .split('')
      .map(ch => (Object.prototype.hasOwnProperty.call(map, ch) ? map[ch] : ch))
      .join('')

    const slug = translit
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/^-+|-+$/g, '')

    return slug
}

export function legacyCategorySlug(name) {
  return String(name || "").trim().replace(/\s+/g, "").replace(/[^0-9A-Za-zА-Яа-яІЇЄҐієїґ\-]/g, "");
}

export function categoryPaths(categories) {
  const byId = new Map(categories.map(category => [String(category._id), category]));
  const paths = new Map();
  for (const category of categories) {
    let node = category;
    const parts = [];
    const seen = new Set();
    while (node) {
      const id = String(node._id);
      if (seen.has(id) || parts.length >= 3) { parts.length = 0; break; }
      seen.add(id);
      parts.unshift(categorySlug(node.name));
      if (!node.parent) break;
      node = byId.get(String(node.parent));
      if (!node) { parts.length = 0; break; }
    }
    if (parts.length && parts.every(Boolean)) paths.set(String(category._id), "/" + parts.join("/"));
  }
  return paths;
}
