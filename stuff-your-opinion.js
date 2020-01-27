(function() {
  /**
   *    Stuff Your Opinion
   *    Written by JP Sheehan
   *    Licensed under the GNU GPLv3
   *    https://github.com/jpsheehan/Stuff-Your-Opinion
   *    https://addons.mozilla.org/en-US/firefox/addon/stuff-your-opinion/
   *    https://chrome.google.com/webstore/detail/stuff-your-opinion/jhibdleohknpbgeihkplcjmaaphlmemo
   *
   *    A simple Firefox extension to hide opinions, reviews, and sponsored content on Stuff.co.nz.
   *
   */
  const styleOpacity = 0.05;
  const styleHoverOpacity = 1.0;
  const styleTransitionTime = 0.3;

  // create the custom style
  function createStyleElement() {
    const style = document.createElement("style");
    style.textContent = `
    /* For the "Stuff Your Opinion" Firefox extension. */

    /* Make all opinions transparent. */
    .opinion {
        opacity: ${styleOpacity};
        transition: opacity ${styleTransitionTime}s;
    }
    
    .opinion:hover {
        opacity: ${styleHoverOpacity};
    }
    `;
    document.body.appendChild(style);
  }

  // sets the opinion class of the parent element if it has not been set
  const setOpinionClass = function(el) {
    if (!el.classList.contains("opinion")) {
      el.classList.add("opinion");
    }
  };

  const getAllArticles = function() {
    return document.querySelectorAll(".display-asset");
  };

  const isArticleAnOpinion = function(article) {
    return (
      article.innerText.includes("OPINION:") ||
      article.innerText.includes("COMMENT:") ||
      article.innerText.includes("REVIEW:") ||
      article.querySelector("img.headline-flag-stuff-nation") !== null ||
      article.querySelector(".sponsored-icon-text") !== null
    );
  };

  const getOpinionArticles = function() {
    return [...getAllArticles()].filter(isArticleAnOpinion);
  };

  // add the style block to the page
  createStyleElement();

  // get all of the opinion articles
  const opinions = getOpinionArticles();

  // set their class to be "opinion"
  opinions.forEach(setOpinionClass);
})();
