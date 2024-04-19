import axios from 'axios';
import i18n from 'i18next';
import * as yup from 'yup';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import onChange from 'on-change';
import render from './render.js';
import resources from './locales/index.js';

const msToTimeout = 5000;

const normalizeUrl = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`;

const createFeedState = (rssElement, href, defaultFeedId) => {
  const title = rssElement.querySelector('channel > title').textContent;
  const descriptionEl = rssElement.querySelector('channel > description');
  const description = descriptionEl ? descriptionEl.textContent : '';
  const feedId = defaultFeedId || uuidv4();
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
    const descriptionEl = itemElement.querySelector('description');
    const description = descriptionEl ? descriptionEl.textContent : title;
    const postId = uuidv4();
    const postState = {
      href, title, feedId, description, postId,
    };
    postStates = [...postStates, postState];
  });
  return postStates;
};

const parseRss = (xml, href, defaultFeedId) => {
  const parser = new DOMParser();
  const rssDoc = parser.parseFromString(xml, 'text/xml').querySelector('rss');
  if (!rssDoc) throw new Error('notFound');
  const feedState = createFeedState(rssDoc, href, defaultFeedId);
  const posts = createPostStates(rssDoc, feedState.feedId);
  const rssData = { feedState, posts };
  return rssData;
};

const launchMonitoring = (state) => {
  setTimeout(() => {
    const { feeds, posts } = state;
    const promises = feeds.map((feed) => axios.get(feed.href, { timeout: msToTimeout })
      .catch((promiseError) => {
        console.log(promiseError);
        return null;
      }));
    Promise.all(promises).then((responses) => {
      const allUnpublishedPosts = responses.flatMap((response) => {
        if (!response) return [];
        const { data, request } = response;
        const { feedId } = feeds.find((feed) => feed.href === request.responseURL);
        const rssData = parseRss(data.contents, request.responseURL, feedId);
        const existingPosts = posts.filter((post) => post.feedId === feedId);
        const unpublishedPosts = _.differenceBy(rssData.posts, existingPosts, 'href');
        return unpublishedPosts;
      });
      if (allUnpublishedPosts.length) {
        state.posts = [...allUnpublishedPosts, ...state.posts];
      }
    }).finally(() => {
      launchMonitoring(state);
    });
  }, msToTimeout);
};

export default () => {
  const initModel = () => ({
    form: {
      state: 'filling',
      errorType: null,
    },
    links: [],
    feeds: [],
    posts: [],
    readPostsId: new Set(),
    modalPostId: undefined,
  });

  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then((t) => {
    const view = initModel();

    const watchedView = onChange(view, (path, value) => {
      render(view, i18nInstance, path, value);
    });

    launchMonitoring(watchedView);

    yup.setLocale({
      string: {
        url: t('url'),
        required: t('required'),
        notOneOf: t('notOneOf'),
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
      validate(value, view.links)
        .then((url) => {
          watchedView.form.state = 'sending';
          watchedView.form.errorType = null;
          const normalizedUrl = normalizeUrl(url);
          axios.get(normalizedUrl, { timeout: msToTimeout })
            .then(({ data }) => {
              const rssData = parseRss(data.contents, normalizedUrl);
              watchedView.form.state = 'finished';
              watchedView.links = [...watchedView.links, url];
              watchedView.feeds = [...watchedView.feeds, rssData.feedState];
              watchedView.posts = [...rssData.posts, ...watchedView.posts];
            })
            .catch(({ message }) => {
              watchedView.form.state = 'failed';
              watchedView.form.errorType = message === 'notFound' ? 'notFound' : 'networkError';
            });
        })
        .catch((error) => {
          watchedView.form.state = 'failed';
          watchedView.form.errorType = error.type;
        });
    });

    const modal = document.querySelector('.modal');
    modal.addEventListener('show.bs.modal', (e) => {
      const { id } = e.relatedTarget.dataset;
      watchedView.modalPostId = id;
      watchedView.readPostsId.add(id);
    });

    modal.addEventListener('hide.bs.modal', () => {
      watchedView.modalPostId = undefined;
    });
  }).catch((i18nError) => {
    console.log(i18nError);
  });
};
