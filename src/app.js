import * as yup from 'yup';
import onChange from 'on-change';
import renderModel from './render.js';

export default () => {
  const initModel = () => {
    const state = {
      inputValue: '',
      activeRssList: [],
    };

    const urlInputElement = document.querySelector('#url-input');

    const elements = { urlInputElement };

    return {
      elements, state,
    };
  };

  const { elements, state } = initModel();

  onChange({ elements, state }, renderModel);

  elements.urlInputElement.addEventListener('input', (e) => {
    e.preventDefault();
    state.inputValue = e.currentTarget.value;
  });
};
