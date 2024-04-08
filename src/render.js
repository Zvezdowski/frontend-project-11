import onChange from 'on-change';
import _ from 'lodash';

export default (state, elements) => {
  const watchedState = onChange(state, (path, value, previousValue) => {
    switch (path) {
      case 'state.form.error':
        try {
          elements.urlInputElement.classList.remove('is-invalid');
        } catch (e) {
          return;
        }
        if (!value) {
          elements.urlInputElement.classList.add('is-invalid');
          elements.errorMessageElement.textContent = state.form.error;
        }
        break;
      case 'state.form.state':
        break;
      case 'state.rssList':
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });
  return watchedState;
};
