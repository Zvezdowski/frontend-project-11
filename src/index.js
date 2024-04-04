const component = () => {
  const element = document.createElement('div');
  element.innerHTML = 'fish';
  return element;
};

document.body.appendChild(component());
