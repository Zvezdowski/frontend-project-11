import onChange from 'on-change';

const renderError = (value, { state, elements }, i18nInstance) => {
  if (value) {
    elements.errorMessageElement.textContent = i18nInstance.t(state.form.errorType);
    return;
  }
  elements.errorMessageElement.textContent = '';
};

const renderForm = (formState, elements) => {
  try {
    elements.urlInputElement.classList.remove('is-invalid');
  } catch (e) {
    return;
  }

  switch (formState) {
    case 'sending':
      elements.urlInputElement.value = '';
      elements.urlInputElement.focus();
      break;
    case 'failed':
      elements.urlInputElement.classList.add('is-invalid');
      break;
    default:
      throw new Error(`Unknown form state: ${formState}`);
  }
};

export default (state, elements, i18nInstance) => {
  const watchedState = onChange(state, (path, value) => {
    console.log('Render path:', path);
    switch (path) {
      case 'form.errorType':
        renderError(value, { state, elements }, i18nInstance);
        break;
      case 'form.state':
        renderForm(state.form.state, elements);
        break;
      case 'rssList':
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });
  return watchedState;
};
