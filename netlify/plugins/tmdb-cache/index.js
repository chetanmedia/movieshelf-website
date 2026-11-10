// Keeps the downloaded TMDB film data between Netlify builds, so it's only re-downloaded once a week.
export const onPreBuild = async ({ utils }) => {
  const ok = await utils.cache.restore('./data/tmdb');
  console.log(ok ? 'tmdb-cache: restored film data' : 'tmdb-cache: nothing cached yet');
};
export const onPostBuild = async ({ utils }) => {
  const ok = await utils.cache.save('./data/tmdb');
  console.log(ok ? 'tmdb-cache: saved film data' : 'tmdb-cache: nothing to save');
};
