import axios from 'axios';
import i18n from 'i18next';
import * as yup from 'yup';
import renderOnChange from './render.js';
import resources from './locales/index.js';

const parseXmlFromString = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  return doc;
};

const normalizeUrl = (url) => `https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`;

const createFeedState = (rssElement, { feeds }) => {
  const title = rssElement.querySelector('channel > title').textContent;
  const description = rssElement.querySelector('channel > description').textContent;
  const feedId = feeds.length + 1;
  return { title, description, feedId };
};

const createPostStates = (rssElement, { feeds }) => {
  const itemElements = Array.from(rssElement.querySelectorAll('item'));

  let postStates = [];
  itemElements.forEach((itemElement) => {
    const href = itemElement.querySelector('link').textContent;
    const title = itemElement.querySelector('title').textContent;
    const postId = postStates.length + 1;
    const feedId = feeds.length;
    const postState = {
      href, title, postId, feedId,
    };
    postStates = [...postStates, postState];
  });

  return postStates;
};

export default () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  });

  const initModel = () => ({
    form: {
      state: 'filling',
      errorType: null,
    },
    links: [],
    feeds: [],
    posts: [],
  });

  const state = renderOnChange(initModel(), i18nInstance);

  console.log('initial state: ', state);

  yup.setLocale({
    string: {
      url: i18nInstance.t('url'),
      required: i18nInstance.t('required'),
      notOneOf: i18nInstance.t('notOneOf'),
    },
  });

  const validate = (url, links) => {
    const schema = yup.string()
      .url()
      .required()
      .notOneOf(links);
    return schema.validate(url);
  };

  const formElement = document.querySelector('form');
  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value } = formElement.elements.url;
    validate(value, state.links)
      .then((url) => {
        state.form.state = 'sending';
        state.form.errorType = null;
        state.links = [...state.links, url];
        axios(normalizeUrl(url))
          .then((response) => {
            state.form.state = 'finished';
            const doc = parseXmlFromString(response.data.contents);
            console.log('doc', doc);
            state.feeds = [...state.feeds, createFeedState(doc, state)];
            state.posts = [...createPostStates(doc, state), ...state.posts];
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        console.dir(error);
        state.form.state = 'failed';
        state.form.errorType = error.type;
      });
    console.log(state);
  });
};
