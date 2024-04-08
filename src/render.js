import onChange from 'on-change';

export default (state, elements) => {
  const watchedState = onChange(state, (path, value, previousValue) => {
    console.log(path);
    switch (path) {
      case 'form.error':
        try {
          elements.urlInputElement.classList.remove('is-invalid');
        } catch (e) {
          return;
        }
        if (value) {
          elements.urlInputElement.classList.add('is-invalid');
          elements.errorMessageElement.textContent = state.form.error;
        }
        break;
      case 'form.state':
        break;
      case 'rssList':
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });
  return watchedState;
};
