export const capFirst = (str) => {
  const s = (str || '').toString()
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
