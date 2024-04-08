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
    const errorMessageElement = document.querySelector('.feedback.m-0.position-absolute.small.text-danger');

    const elements = { urlInputElement, formElement, errorMessageElement };

    return {
      elements, initialState,
    };
  };

  const { elements, initialState } = initModel();

  const state = renderOnChange(initialState, elements);

  const validate = (url, links) => {
    const schema = yup.string()
      .url()
      .required()
      .notOneOf(links);
    return schema.validate(url);
  };

  elements.formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value } = elements.formElement.elements.url;
    validate(value, state.rssList)
      .then((url) => {
        state.form.state = 'sending';
        state.form.error = null;
        state.rssList = [...state.rssList, url];
      })
      .catch((error) => {
        state.form.state = 'failed';
        state.form.error = error.message;
      });
    elements.formElement.elements.url.value = '';
    console.log(state);
  });
};
