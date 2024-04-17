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

const createFeedState = (rssElement, feedId, href) => {
  const title = rssElement.querySelector('channel > title').textContent;
  const descriptionEl = rssElement.querySelector('channel > description');
  const description = descriptionEl ? descriptionEl.textContent : '';
  return {
    title, description, feedId, href,
  };
};

const assignPostId = (originalState) => {
  const state = originalState;
  state.posts.forEach((originalPost, index, array) => {
    const post = originalPost;
    if (!Object.hasOwn(post, 'postId')) {
      post.postId = array.length - index;
    }
  });
};

const createPostStates = (rssElement, feedId) => {
  const itemElements = Array.from(rssElement.querySelectorAll('item'));
  let postStates = [];
  itemElements.forEach((itemElement) => {
    const href = itemElement.querySelector('link').textContent;
    const title = itemElement.querySelector('title').textContent;
    const descriptionEl = itemElement.querySelector('description');
    const description = descriptionEl ? descriptionEl.textContent : title;
    const postState = {
      href, title, feedId, description,
    };
    postStates = [...postStates, postState];
  });
  return postStates;
};

const launchMonitoring = (originalState) => {
  const state = originalState;
  setTimeout(() => {
    const { feeds, posts } = state;
    const promises = feeds.map((feed) => axios(feed.href, { timeout: 5000 }));
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
      if (allUnpublishedPosts.length) {
        state.posts = [...allUnpublishedPosts, ...state.posts];
        assignPostId(state);
      }
    }).finally(() => {
      launchMonitoring(state);
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
    monitoring: false,
    readPostsId: [],
    modalPostId: undefined,
  });

  const state = renderOnChange(initModel(), i18nInstance);

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
        const normalizedUrl = normalizeUrl(url);
        axios(normalizedUrl, { timeout: 15000 })
          .then((response) => {
            const { data } = response;
            const rssDoc = parseXmlFromString(data.contents).querySelector('rss');
            if (!rssDoc) {
              state.form.state = 'failed';
              state.form.errorType = 'notFound';
              return;
            }
            state.form.state = 'finished';
            state.links = [...state.links, url];
            const feedId = state.feeds.length + 1;
            const feedState = createFeedState(rssDoc, feedId, normalizedUrl);
            state.feeds = [...state.feeds, feedState];
            state.posts = [...createPostStates(rssDoc, feedId), ...state.posts];
            assignPostId(state);
          })
          .catch(() => {
            state.form.state = 'failed';
            state.form.errorType = 'networkError';
          })
          .finally(() => {
            if (!state.monitoring && state.links.length) {
              state.monitoring = true;
              launchMonitoring(state);
            }
          });
      })
      .catch((error) => {
        state.form.state = 'failed';
        state.form.errorType = error.type;
      });
  });
  const modal = document.querySelector('.modal');
  modal.addEventListener('show.bs.modal', (e) => {
    const { id } = e.relatedTarget.dataset;

    state.modalPostId = parseInt(id, 10);

    const uniqueReadPostsId = new Set(state.readPostsId);
    uniqueReadPostsId.add(id);
    state.readPostsId = Array.from(uniqueReadPostsId);
  });

  modal.addEventListener('hide.bs.modal', () => {
    state.modalPostId = undefined;
  });
};
