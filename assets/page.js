/* PLANERVO – helyi keresőoldalak: a lábléc és az admin „Aloldalak szövegei” menüjében mentett szöveg */
(async function () {
  const TX = await loadTextsSafe();
  applyDataTexts(TX);
  applyPageTexts(document.body.dataset.page, TX);
})();
