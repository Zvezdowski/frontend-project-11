import axios, { all } from 'axios';
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

const createFeedState = (rssElement, feedId, href) => {
  const title = rssElement.querySelector('channel > title').textContent;
  const descriptionEl = rssElement.querySelector('channel > description');
  const description = descriptionEl ? descriptionEl.textContent : '';
  return {
    title, description, feedId, href,
  };
};

const createPostStates = (rssElement, feedId) => {
  const itemElements = Array.from(rssElement.querySelectorAll('item'));
  let postStates = [];
  itemElements.forEach((itemElement) => {
    const href = itemElement.querySelector('link').textContent;
    const title = itemElement.querySelector('title').textContent;
    const postState = {
      href, title, feedId,
    };
    postStates = [...postStates, postState];
  });

  return postStates;
};

/*
const launchMonitoring = (state) => new Promise((resolve, reject) => {
  setTimeout(() => {
    const { feeds, posts } = state;
    feeds.forEach((feed) => {
      const {
        title, description, feedId, href,
      } = feed;
      axios(href)
        .then((response) => {
          const { data } = response;
          const rssDoc = parseXmlFromString(data.contents);
          if (!rssDoc) throw new Error('rss not found');
          const freshPosts = createPostStates(rssDoc, feedId);
          const existingPosts = posts.filter((post) => post.feedId === feedId);
          const newPosts = _.differenceBy(freshPosts, existingPosts, 'href');
          console.log('newPosts', newPosts);
          resolve(newPosts);
          launchMonitoring({ ...state, posts: [...newPosts, ...existingPosts] })
            .then(resolve)
            .catch(reject);
        })
        .catch((e) => {
          throw e;
        });
    });
  }, 5000, state);
});
*/
const launchMonitoring = (state) => new Promise((resolve, reject) => {
  console.log('Мониторинг запущен');
  setTimeout(() => {
    const { feeds, posts } = state;
    const promises = feeds.map((feed) => axios(feed.href));
    Promise.all(promises).then((responses) => {
      const allUnpublishedPosts = responses.flatMap((response) => {
        const { data, request } = response;
        const rssDoc = parseXmlFromString(data.contents);
        if (!rssDoc) throw new Error('rss not found');
        const { feedId } = feeds.find((feed) => feed.href === request.responseURL);
        const existingPosts = posts.filter((post) => post.feedId === feedId);
        const freshPosts = createPostStates(rssDoc, feedId);
        const unpublishedPosts = _.differenceBy(freshPosts, existingPosts, 'href');
        return unpublishedPosts;
      });
      resolve(allUnpublishedPosts);
      launchMonitoring({ ...state, posts: [...allUnpublishedPosts, posts] })
        .then(resolve)
        .catch(reject);
    }).catch((e) => {
      launchMonitoring(state)
        .then(resolve)
        .catch(reject);
      reject(e);
    });
  }, 5000);
});

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
    console.log(state);
    e.preventDefault();
    const { value } = formElement.elements.url;
    validate(value, state.links)
      .then((url) => {
        state.form.state = 'sending';
        state.form.errorType = null;
        const normalizedUrl = normalizeUrl(url);
        axios(normalizedUrl)
          .then((response) => {
            const { data } = response;
            const rssDoc = parseXmlFromString(data.contents).querySelector('rss');
            console.log('doc', rssDoc);
            if (!rssDoc) throw new Error('rss not found');
            state.form.state = 'finished';
            state.links = [...state.links, url];
            const feedId = state.feeds.length + 1;
            const feedState = createFeedState(rssDoc, feedId, normalizedUrl);
            state.feeds = [...state.feeds, feedState];
            state.posts = [...createPostStates(rssDoc, feedId), ...state.posts];
          })
          .catch(() => {
            state.form.state = 'failed';
            state.form.errorType = 'notFound';
          });
      })
      .catch((error) => {
        state.form.state = 'failed';
        state.form.errorType = error.type;
      });
    launchMonitoring(state)
      .then((allUnpublishedPosts) => {
        state.posts = [...allUnpublishedPosts, ...state.posts];
      })
      .catch((updateError) => {
        console.log(updateError);
      });
  });
};
