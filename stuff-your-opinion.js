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

const options = {
  option_hide_comment: true,
  option_hide_article: false,
  option_hide_opinion: true,
  option_hide_review: true,
  option_hide_sponsored: true,
};

/**
 * Appends a style block to the page.
 * The style block adds transparency and fading to
 * elements with the class "opinion".
 */
function createStyleElement() {
  const style = document.createElement("style");
  style.textContent = `
  /* For showing the content if the options are changed */
  .syo-ignored, .syo-ignored:hover {
    opacity: 1.0 !important;
  }

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
function attachArticleId(article) {
  article.stuff_id = getArticleId(article);
  return article;
}

/**
 * Adds the class "opinion" to the element if it doesn't already exist.
 * @param {HTMLElement} el
 */
function setClassName(el, className) {
  const fullClassName = "syo-" + className;
  if (!el.classList.contains(fullClassName)) {
    el.classList.add(fullClassName);
  }
  if (className !== ArticleType.Article && options[`option_hide_${className}`] === false) {
    el.classList.add("syo-ignored");
  }
};

/**
 * Gets an array of all articles that could potentially be opinions.
 * @returns {HTMLElement[]}
 */
function getAllArticles() {
  return [...document.querySelectorAll(
    ".display-asset, .section_headlines p, #viewed li, #commented p"
  )];
};

function getLateLoadedArticles() {
  return [...document.querySelectorAll("#commented p")]
};

/**
 * Requests the type of article from the JSON API.
 * 
 * @param {HTMLElement} article 
 * @param {Function} callback The function to be called with the article type.
 */
function getArticleTypeFromApi(article, callback) {
  requestArticleIntroText(article.stuff_id, (introText) => {
    callback(getArticleTypeFromIntroText(introText));
  });
};

/**
 * 
 * @param {string} introText The intro text of the article.
 * @returns {ArticleType}
 */
function getArticleTypeFromIntroText(introText) {

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
function getArticleTypeFromElement(article) {

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
function getArticleId(article) {
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
function storageGetArticleType(id) {
  const key = `cache_${id}`;
  return setting_get(key);
};

/**
 * 
 * @param {string} id The id of the article.
 * @param {string} type The type of article.
 * @returns {Promise<Object>}
 */
function storageSetArticleType(id, type) {
  const key = `cache_${id}`;
  return setting_set(key, type);
};

function requestArticleIntroText(id, callback) {
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

function processCommentedList() {
  processArticles(getLateLoadedArticles());
  this.removeEventListener("click", processCommentedList);
};

function processArticles(articles) {
  articles
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
              });
            } else {
              setClassName(article, type);
              storageSetArticleType(id, type);
            }
          } else {
            setClassName(article, type);
          }
        });
      }
    });
}

function hideAll(article_type) {
  const class_name = `.syo-${article_type}`;
  document.querySelectorAll(class_name).forEach(function (element) {
    element.classList.remove("syo-ignored");
  });
}

function showAll(article_type) {
  const class_name = `.syo-${article_type}`;
  document.querySelectorAll(class_name).forEach(function (element) {
    element.classList.add("syo-ignored");
  });
}

function optionChangeHandler(option, value) {
  switch (option) {
    case "hide_opinion":
      if (value) {
        hideAll(ArticleTypes.Opinion);
      } else {
        showAll(ArticleTypes.Opinion);
      }
      break;
    case "hide_comment":
      if (value) {
        hideAll(ArticleTypes.Comment);
      } else {
        showAll(ArticleTypes.Comment);
      }
      break;
    case "hide_review":
      if (value) {
        hideAll(ArticleTypes.Review);
      } else {
        showAll(ArticleTypes.Review);
      }
      break;
    case "hide_sponsored":
      if (value) {
        hideAll(ArticleTypes.Sponsored);
      } else {
        showAll(ArticleTypes.Sponsored);
      }
      break;
  }
}

function storageChangeHandler(changes, area_name) {
  if (area_name === "local") {
    const option_keys = Object.keys(changes).filter(function (key) {
      return /^option_/.test(key);
    });
    option_keys.forEach(function (key) {
      const option = /^option_(.*)$/.exec(key)[1];
      const { oldValue, newValue } = changes[key];
      if (oldValue !== newValue) {
        optionChangeHandler(option, newValue);
      }
    })
  }
}

/**
 * Calls the functions to hide opinions.
 */
function init() {
  // add the style block to the page
  createStyleElement();

  // add an event hook to the commented stories tab
  document.querySelector("#ui-id-2").addEventListener("click", processCommentedList);

  // add an event handler for when the user changes an option
  browser.storage.onChanged.addListener(storageChangeHandler);

  browser.storage.local.get(Object.keys(options))
    .then(function (data) {
      Object
        .keys(data)
        .forEach(function (key) {
          options[key] = data[key];
        });
    })
    .finally(function () {
      console.log(options)
      // process all the articles in the page
      processArticles(getAllArticles());
    });
}

function log() {
  if (DEBUG) {
    console.log.apply(null, arguments);
  }
}

log("START")
init();
log("END")