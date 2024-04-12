import axios from 'axios';
import i18n from 'i18next';
import * as yup from 'yup';
import _ from 'lodash';
import renderOnChange from './render.js';
import resources from './locales/index.js';

const parseXmlFromString = (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  return doc;
};

const normalizeUrl = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;

const createFeedState = (rssElement, { feeds }, href) => {
  const title = rssElement.querySelector('channel > title').textContent;
  const description = rssElement.querySelector('channel > description').textContent;
  const feedId = feeds.length + 1;
  return { title, description, feedId, href };
};

const createPostStates = (rssElement, { feeds }, currentFeedId = undefined) => {
  const itemElements = Array.from(rssElement.querySelectorAll('item'));

  let postStates = [];
  itemElements.forEach((itemElement) => {
    const href = itemElement.querySelector('link').textContent;
    const title = itemElement.querySelector('title').textContent;
    const postId = postStates.length + 1;
    const feedId = currentFeedId || feeds.length;
    const postState = {
      href, title, postId, feedId,
    };
    postStates = [...postStates, postState];
  });

  return postStates;
};

const initFeedUpdater = ({ href, feedId }, state) => { // feedState, state
  console.log(state);
  setTimeout(() => {
    axios(href).then(({ data }) => {
      const doc = parseXmlFromString(data.contents);
      const freshPosts = createPostStates(doc, {}, feedId);
      const existingPosts = state.posts.filter((post) => post.feedId === feedId);
      const newPosts = _.differenceBy(freshPosts, existingPosts, 'href');
      if (newPosts.length) {
        console.log('New posts: ', newPosts);
        state.posts = [...newPosts, ...state.posts];
      }
      initFeedUpdater({ href, feedId }, state);
    }).catch((e) => {
      console.log(e);
    });
  }, 5000);
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
        const normalizedUrl = normalizeUrl(url);
        axios(normalizedUrl)
          .then(({ data }) => {
            console.log(data);
            state.form.state = 'finished';
            const doc = parseXmlFromString(data.contents);
            console.log('doc', doc);
            const feedState = createFeedState(doc, state, normalizedUrl);
            state.feeds = [...state.feeds, feedState];
            state.posts = [...createPostStates(doc, state), ...state.posts];
            initFeedUpdater(feedState, state);
          })
          .catch((error) => {
            state.form.state = 'failed';
            state.form.errorType = 'notFound';
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
