(function () {
  function flash(button, message) {
    var original = button.textContent;
    button.textContent = message;
    button.classList.add('ok');
    setTimeout(function () {
      button.textContent = original;
      button.classList.remove('ok');
    }, 1400);
  }

  function sectionText(section) {
    var copy = section.cloneNode(true);
    copy.querySelectorAll('.copy-row, .lang-switch').forEach(function (node) {
      node.remove();
    });
    var text = copy.innerText.trim();
    if (section.id === 'en') {
      var title = document.querySelector('main > h1');
      if (title) text = title.innerText.trim() + '\n\n' + text;
    }
    return text;
  }

  document.querySelectorAll('.copy-btn').forEach(function (button) {
    button.addEventListener('click', async function () {
      var section = document.getElementById(button.dataset.copy);
      if (!section) return;
      var text = sectionText(section);

      try {
        await navigator.clipboard.writeText(text);
        flash(button, button.dataset.done || 'Copied');
      } catch (error) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        flash(button, button.dataset.done || 'Copied');
      }
    });
  });
}());
