import * as yup from 'yup';
import renderOnChange from './render.js';

export default () => {
  const initModel = () => {
    const state = {
      form: {
        state: 'filling',
        error: null,
      },
      activeRssList: [],
    };

    const urlInputElement = document.querySelector('#url-input');
    const formElement = document.querySelector('form');

    const elements = { urlInputElement, formElement };

    return {
      elements, state,
    };
  };

  const { elements, state } = initModel();

  const watchedState = renderOnChange(state, elements);

  const urlSchema = yup.string().url().required();

  elements.formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value } = elements.formElement.elements.url;
    urlSchema.validate(value)
      .then((url) => {
        watchedState.activeRssList = [...state.activeRssList, url];
      })
      .catch((error) => {
        watchedState.form.state = 'failed';
        watchedState.form.error = error.message;
      });
    console.log(state);
  });
};
