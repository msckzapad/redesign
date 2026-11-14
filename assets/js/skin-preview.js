/* Только для предпросмотра /live/...: прячет старые шапку и подвал Тильды и ставит новые из макета.
   На Тильде этот файл не нужен — там новые шапка и подвал лежат на страницах Header и Footer. */
(async function () {
  var L = 'http://localhost:4173/';
  document.body.classList.add('zp', 'zp-skin');
  document.documentElement.classList.add('zp-js');
  ['#t-header', '#t-footer'].forEach(function (s) { var e = document.querySelector(s); if (e) e.setAttribute('data-zp-old', ''); });
  var html = await (await fetch(L + 'index.html')).text();
  html = html.replace(/(src|href)="assets\//g, '$1="' + L + 'assets/')
             .replace(/href="(index|gotovye-doma-i-bani|rekonstrukciya|uslugi)\.html/g, 'href="' + L + '$1.html')
             .replace(/href="https:\/\/stroidom-mozhaisk\.ru\/([^"]*)" target="_blank" rel="noopener"/g, 'href="' + L + 'live/$1"');
  var d = new DOMParser().parseFromString(html, 'text/html');
  document.body.insertAdjacentElement('afterbegin', d.querySelector('.zp-hdr'));
  document.body.appendChild(d.querySelector('.zp-ftr'));
  var s = document.createElement('script'); s.src = L + 'assets/js/zapad.js'; document.body.appendChild(s);
})();
