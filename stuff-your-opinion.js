(function() {
  /**
   *    Stuff Your Opinion
   *    Written by JP Sheehan
   *    Licensed under the GNU GPLv3
   *    https://github.com/jpsheehan/Stuff-Your-Opinion
   *    https://addons.mozilla.org/en-US/firefox/addon/stuff-your-opinion/
   *    https://chrome.google.com/webstore/detail/stuff-your-opinion/jhibdleohknpbgeihkplcjmaaphlmemo
   *
   *    A simple Firefox and Chrome extension to hide opinions, reviews, and sponsored content on Stuff.co.nz.
   *
   */

  /**
   * The regex pattern for extracting article ids from the URL.
   */
  const urlPattern = /\/([0-9]+)\/?/;

  /**
   * The default opacity of the opinions.
   */
  const styleOpacity = 0.05;

  /**
   * The opacity of opinions when hovered.
   */
  const styleHoverOpacity = 1.0;

  /**
   * The time taken (in seconds) to change transparency.
   */
  const styleTransitionTime = 0.3;

  /**
   * Appends a style block to the page.
   * The style block adds transparency and fading to
   * elements with the class "opinion".
   */
  const createStyleElement = function() {
    const style = document.createElement("style");
    style.textContent = `
    /* For the "Stuff Your Opinion" Firefox extension. */

    /* Make all opinions transparent. */
    .opinion {
        opacity: ${styleOpacity};
        transition: opacity ${styleTransitionTime}s;
    }
    
    /* Change opacity back to normal on hover. */
    .opinion:hover {
        opacity: ${styleHoverOpacity};
    }
    `;
    document.body.appendChild(style);
  };

  /**
   * Adds the class "opinion" to the element if it doesn't already exist.
   * @param {HTMLElement} el
   */
  const setOpinionClass = function(el) {
    if (!el.classList.contains("opinion")) {
      el.classList.add("opinion");
    }
  };

  /**
   * Gets an array of all articles that could potentially be opinions.
   * @returns {HTMLElement[]}
   */
  const getAllArticles = function() {
    return document.querySelectorAll(
      ".display-asset, .section_headlines p, #viewed li, #commented p"
    );
  };

  /**
   * Determines whether or not the article summary is an opinion.
   * @param {HTMLElement} article
   * @returns {boolean}
   */
  const isArticleAnOpinion = function(article) {
    return (
      article.innerText.includes("OPINION:") ||
      article.innerText.includes("COMMENT:") ||
      article.innerText.includes("REVIEW:") ||
      article.querySelector("img.headline-flag-stuff-nation") !== null ||
      article.querySelector(".sponsored-icon-text") !== null ||
      article.querySelector(".assignment_icon") !== null
    );
  };

  /**
   * Gets a list of all article summaries that are considered to be opinions.
   * @returns {HTMLElement[]}
   */
  const getOpinionArticles = function() {
    return [...getAllArticles()].filter(isArticleAnOpinion);
  };

  const getArticleId = function(article) {
    const url = article.querySelector("a").href;
    const results = urlPattern.exec(url);
    if (results !== null && results.length == 2) {
      return results[1];
    } else {
      return null;
    }
  };

  /**
   *
   * @param {String[]} ids An array of article ids.
   * @returns {Promise<Object>} An object containing the stored values.
   */
  const storeGetArticleStatuses = function(ids) {
    return browser.storage.local.get(ids);
  };

  const storeSetArticleStatus = function(id, isOpinion) {
    return browser.storage.local.set({ [id]: isOpinion });
  };

  /**
   * Calls the functions to hide opinions.
   */
  const init = function() {
    // add the style block to the page
    createStyleElement();

    // get all of the opinion articles
    const opinions = getOpinionArticles();

    // set their class to be "opinion"
    opinions.forEach(setOpinionClass);
    opinions
      .map(getArticleId)
      .filter(id => id !== null)
      .forEach(id => storeSetArticleStatus(id, true));
  };

  console.log("SYO START");
  const ids = [...getAllArticles()].map(getArticleId).filter(id => id !== null);
  storeGetArticleStatuses(ids).then(foo => console.log("Stored data:", foo));
  init();
  console.log("SYO FINISH");
})();
