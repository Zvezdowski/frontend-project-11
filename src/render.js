import onChange from 'on-change';
import _ from 'lodash';

export default (state, elements) => {
  const watchedState = onChange(state, (path, value, previousValue) => {
    const changedProp = _.last(path.split('.'));
    switch (changedProp) {
      case 'error':
//        if (elements.urlInputElement.classList.contains('is-invalid')) {
//          elements.urlInputElement.classList.remove('is-invalid');
//        }
        try {
          elements.urlInputElement.classList.remove('is-invalid');
        } catch (e) {
          return;
        }
        elements.urlInputElement.classList.add('is-invalid');
        elements.errorMessageElement.textContent = state.form.error;
        break;
      case 'state':
        break;
      case 'rssList':
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });
  return watchedState;
};
