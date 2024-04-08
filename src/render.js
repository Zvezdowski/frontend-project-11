import onChange from 'on-change';
import _ from 'lodash';

export default (state, elements) => {
  const watchedState = onChange(state, (path, value, previousValue) => {
    const changedProp = _.last(path.split('.'));
    switch (changedProp) {
      case 'error':
        elements.formElement.elements.url.classlist.toggle('is-invalid');
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });
  return watchedState;
};
