// Vite serves everything in public/ from the site root, so an icon at
// public/icons/foo.png is normally just /icons/foo.png. Building the URL
// from import.meta.env.BASE_URL instead of a hardcoded leading slash keeps
// it correct if the app is ever deployed under a sub-path (e.g. a GitHub
// Pages project site), where BASE_URL is that sub-path instead of "/".
export function iconUrl(filename) {
  return `${import.meta.env.BASE_URL}icons/${filename}`
}
