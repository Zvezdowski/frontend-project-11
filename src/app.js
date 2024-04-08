import * as yup from 'yup';
import renderOnChange from './render.js';

export default () => {
  const initModel = () => {
    const initialState = {
      form: {
        state: 'filling',
        error: null,
      },
      rssList: [],
    };

    const urlInputElement = document.querySelector('#url-input');
    const formElement = document.querySelector('form');
    const errorMessageElement = document.querySelector('[<p class="feedback m-0 position-absolute small text-danger"></p>]');

    const elements = { urlInputElement, formElement, errorMessageElement };

    return {
      elements, initialState,
    };
  };

  const { elements, initialState } = initModel();

  const state = renderOnChange(initialState, elements);

  const urlSchema = yup.string().url().required();

  elements.formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value } = elements.formElement.elements.url;
    urlSchema.validate(value)
      .then((url) => {
        state.rssList = [...state.rssList, url];
      })
      .catch((error) => {
        state.form.state = 'failed';
        state.form.error = error.message;
      });
    console.log(state);
  });
};
