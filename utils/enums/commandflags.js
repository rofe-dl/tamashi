// spaces are necessary at the end!
module.exports.PLAY_FROM = {
  YOUTUBE: '-yt ',
  SPOTIFY: '-sp ',
  SOUNDCLOUD: '-sc ',
};

module.exports.phraseHasFlag = (phrase) => {
  const playFromValues = Object.values(exports.PLAY_FROM);
  for (value of playFromValues) {
    if (phrase.includes(value)) return value;
  }

  return false;
};
