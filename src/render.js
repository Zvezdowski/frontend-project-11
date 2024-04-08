import onChange from 'on-change';

export default (state, elements) => {
  const watchedState = onChange(state, (path, value, previousValue) => {
    console.log(path, value, previousValue);
  });
};
