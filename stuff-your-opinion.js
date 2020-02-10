(function () {
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
   * Set to true to display debug information in the console.
   */
  const DEBUG = false;

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
   * A list of article types.
   */
  const ArticleTypes = {
    Article: "article",
    Opinion: "opinion",
    Sponsored: "sponsored",
    Review: "review",
    Comment: "comment",
    Unknown: "unknown",
  };

  /**
   * Appends a style block to the page.
   * The style block adds transparency and fading to
   * elements with the class "opinion".
   */
  const createStyleElement = function () {
    const style = document.createElement("style");
    style.textContent = `
    /* For the "Stuff Your Opinion" Firefox extension. */

    /* Make all opinions transparent. */
    .syo-opinion {
        opacity: ${styleOpacity};
        transition: opacity ${styleTransitionTime}s;
    }
    
    /* Change opacity back to normal on hover. */
    .syo-opinion:hover {
        opacity: ${styleHoverOpacity};
    }

    /* Make all sponsored articles transparent. */
    .syo-sponsored {
        opacity: ${styleOpacity};
        transition: opacity ${styleTransitionTime}s;
    }
    
    /* Change opacity back to normal on hover. */
    .syo-sponsored:hover {
        opacity: ${styleHoverOpacity};
    }

    /* Make all comments transparent. */
    .syo-comment {
        opacity: ${styleOpacity};
        transition: opacity ${styleTransitionTime}s;
    }
    
    /* Change opacity back to normal on hover. */
    .syo-comment:hover {
        opacity: ${styleHoverOpacity};
    }
    
    /* Make all reviews transparent. */
    .syo-review {
        opacity: ${styleOpacity};
        transition: opacity ${styleTransitionTime}s;
    }
    
    /* Change opacity back to normal on hover. */
    .syo-review:hover {
        opacity: ${styleHoverOpacity};
    }
    `;
    document.body.appendChild(style);
  };

  /**
   * Attaches a stuff_id property to the article.
   * 
   * @param {HTMLElement} article 
   * @returns {HTMLElement}
   */
  const attachArticleId = (article) => {
    article.stuff_id = getArticleId(article);
    return article;
  }

  /**
   * Adds the class "opinion" to the element if it doesn't already exist.
   * @param {HTMLElement} el
   */
  const setClassName = function (el, className) {
    if (!el.classList.contains("syo-" + className)) {
      el.classList.add("syo-" + className);
    }
  };

  /**
   * Gets an array of all articles that could potentially be opinions.
   * @returns {HTMLElement[]}
   */
  const getAllArticles = function () {
    return [...document.querySelectorAll(
      ".display-asset, .section_headlines p, #viewed li, #commented p"
    )];
  };

  /**
   * Requests the type of article from the JSON API.
   * 
   * @param {HTMLElement} article 
   * @param {Function} callback The function to be called with the article type.
   */
  const getArticleTypeFromApi = function (article, callback) {
    requestArticleIntroText(article.stuff_id, (introText) => {
      callback(getArticleTypeFromIntroText(introText));
    });
  };

  /**
   * 
   * @param {string} introText The intro text of the article.
   * @returns {ArticleType}
   */
  const getArticleTypeFromIntroText = function (introText) {

    if (introText) {
      if (introText.includes("OPINION:")) {
        return ArticleTypes.Opinion;
      }

      if (introText.includes("COMMENT:")) {
        return ArticleTypes.Comment;
      }

      if (introText.includes("REVIEW:")) {
        return ArticleTypes.Review;
      }
    }

    return ArticleTypes.Unknown;
  }

  /**
   * 
   * @param {HTMLElement} article The article.
   * @returns {ArticleType}
   */
  const getArticleTypeFromElement = function (article) {

    const type = getArticleTypeFromIntroText(article.innerText);
    if (type !== ArticleTypes.Unknown) {
      return type;
    }

    if ((article.querySelector("img.headline-flag-stuff-nation") !== null) || (article.querySelector(".assignment_icon") !== null)) {
      return ArticleTypes.Opinion;
    }

    if (article.querySelector(".sponsored-icon-text") !== null) {
      return ArticleTypes.Sponsored;
    }

    return ArticleTypes.Unknown;
  }

  /**
   * Gets the id of the article.
   * @param {HTMLElement} article 
   * @returns {string}
   */
  const getArticleId = function (article) {
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
   * @param {String} id An article id.
   * @returns {Promise<Object>} An object containing the stored values.
   */
  const storageGetArticleType = function (id) {
    return browser.storage.local.get(id);
  };

  /**
   * 
   * @param {string} id The id of the article.
   * @param {string} type The type of article.
   */
  const storageSetArticleType = function (id, type) {
    return browser.storage.local.set({ [id]: type });
  };

  const requestArticleIntroText = function (id, callback) {
    try {
      const req = new XMLHttpRequest();
      req.addEventListener("load", function () {
        const data = JSON.parse(this.responseText);
        callback(data.intro);
      });
      req.open("GET", `https://www.stuff.co.nz/_json/${id}`);
      req.send();
    } catch (err) {
      callback(null);
    }
  };

  /**
   * Calls the functions to hide opinions.
   */
  const init = function () {
    // add the style block to the page
    createStyleElement();

    getAllArticles()
      .map(attachArticleId)
      .forEach((article) => {
        const id = article.stuff_id;
        if (id) {
          storageGetArticleType(id).then((data) => {
            let type = data[id];
            if ((typeof (type) === "undefined") || (type === ArticleTypes.Unknown)) {
              type = getArticleTypeFromElement(article);
              if (type === ArticleTypes.Unknown) {
                getArticleTypeFromApi(article, (type) => {
                  if (type === ArticleTypes.Unknown) {
                    type = ArticleTypes.Article;
                  }
                  setClassName(article, type);
                  storageSetArticleType(id, type);
                  log("Saved", id, "as", type, "(active)")
                });
              } else {
                setClassName(article, type);
                storageSetArticleType(id, type);
                log("Saved", id, "as", type, "(passive)")
              }
            } else {
              setClassName(article, type);
              log("Loaded", id, "as", type)
            }
          });
        }
      });
  };

  log("START")
  init();
  log("END")

  function log() {
    if (DEBUG) {
      console.log.apply(null, arguments);
    }
  }
})();
