import onChange from 'on-change';

export default (state, elements) => {
  console.log('troubleshooting');
  const watchedState = onChange(state, (path, value, previousValue) => {
    console.log(path, value, previousValue);
  });
  return watchedState;
};
