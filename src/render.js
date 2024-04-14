import onChange from 'on-change';

const feedsContainerElement = document.querySelector('div.feeds');
const postsContainerElement = document.querySelector('div.posts');
const messageElement = document.querySelector('p.text-danger');
const urlInputElement = document.querySelector('#url-input');
const submitButtonElement = document.querySelector('form button');

const createFeedElement = ({ title, description }) => {
  const feedElement = document.createElement('li');
  feedElement.classList.add('list-group-item', 'border-0', 'border-end-0');
  feedElement.innerHTML = `<h3 class="h6 m-0">${title}</h3><p class="m-0 small text-black-50">${description}</p>`;
  return feedElement;
};

const renderFeeds = (feeds) => {
  feedsContainerElement.innerHTML = '';

  const feedCardElement = document.createElement('div');
  feedCardElement.classList.add('card', 'border-0');
  feedCardElement.innerHTML = '<div class="card-body"><h2 class="card-title h4">Фиды</h2></div>';

  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group', 'border-0', 'rounded-0');

  feeds.forEach((feed) => {
    const feedElement = createFeedElement(feed);
    ulElement.append(feedElement);
  });

  feedCardElement.append(ulElement);
  feedsContainerElement.append(feedCardElement);
};

const createPostElement = ({ href, postId, title }) => {
  const postElement = document.createElement('li');
  postElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
  postElement.innerHTML = `<a href="${href}" class="fw-bold" data-id="${postId}" target="_blank" rel="noopener noreferrer">${title}</a><button type="button" class="btn btn-outline-primary btn-sm" data-id="${postId}" data-bs-toggle="modal" data-bs-target="#modal">Просмотр</button>`;
  return postElement;
};

const renderPosts = (posts) => {
  postsContainerElement.innerHTML = '';

  const postCardElement = document.createElement('div');
  postCardElement.classList.add('card', 'border-0');
  postCardElement.innerHTML = '<div class="card-body"><h2 class="card-title h4">Посты</h2></div>';

  const ulElement = document.createElement('ul');
  ulElement.classList.add('list-group', 'border-0', 'rounded-0');

  posts.forEach((post) => {
    const postElement = createPostElement(post);
    ulElement.append(postElement);
  });

  postCardElement.append(ulElement);
  postsContainerElement.append(postCardElement);
};

const renderErrorMessage = (value, { form }, i18nInstance) => {
  try {
    messageElement.classList.remove('text-success');
    messageElement.classList.add('text-danger');
  } catch (e) {
    return;
  }

  if (value) {
    messageElement.textContent = i18nInstance.t(form.errorType);
    return;
  }
  messageElement.textContent = '';
};

const renderSuccessMessage = (i18nInstance) => {
  try {
    messageElement.classList.add('text-success');
    messageElement.classList.remove('text-danger');
  } catch (e) {
    return;
  }
  messageElement.textContent = i18nInstance.t('successMessage');
};

const renderForm = (formState, i18nInstance) => {
  try {
    urlInputElement.classList.remove('is-invalid');
  } catch (e) {
    return;
  }

  switch (formState) {
    case 'sending':
      urlInputElement.disabled = true;
      submitButtonElement.disabled = true;
      break;
    case 'failed':
      urlInputElement.disabled = false;
      submitButtonElement.disabled = false;
      urlInputElement.classList.add('is-invalid');
      break;
    case 'finished':
      urlInputElement.disabled = false;
      submitButtonElement.disabled = false;
      urlInputElement.value = '';
      urlInputElement.focus();
      renderSuccessMessage(i18nInstance);
      break;
    default:
      throw new Error(`Unknown form state: ${formState}`);
  }
};

export default (state, i18nInstance) => {
  const watchedState = onChange(state, (path, value) => {
    console.log('Render path:', path);
    switch (path) {
      case 'form.errorType':
        renderErrorMessage(value, state, i18nInstance);
        break;
      case 'form.state':
        renderForm(state.form.state, i18nInstance);
        break;
      case 'links':
        break;
      case 'feeds':
        renderFeeds(state.feeds);
        break;
      case 'posts':
        renderPosts(state.posts);
        break;
      case 'monitoring':
        break;
      default:
        throw new Error(`Unknown path: ${path}`);
    }
  });
  return watchedState;
};
