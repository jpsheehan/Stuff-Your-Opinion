# Implementation

## Introduction

Stuff.co.nz is a Fairfax Media's primary news website for New Zealand.
It covers national and international news stories and also acts as a central hub for its regional newspapers.
The website itself is broken up into different categories such as "National", "Business", "Technology", etc.
Each category contains many articles.

There are also "sub-websites" for each of Fairfax's New Zealand newspapers, such as "The Press", etc.

## Motivation

Stuff also allows its users to post their own stories on the website, these articles are always marked as opinions.
The category "Stuff Nation" contains only opinion pieces, but opinions can appear in any category.
Sometimes it can be difficult to tell which stories are opinions and which are real articles, particularly on the homepage.
This is the reason why I am developing an extension to hide these by default.

There are also other articles that may want to be hidden, such as reviews, comments, and sponsored content.

## Detection

There are several ways to detect if an article is perhaps not a proper article.

### Passive Detection

An article fitting any of the following criteria should be marked for hiding:

- The "intro text" is a short sentence that describes the article, if this begins with "OPINION", "REVIEW", or "COMMENT", it should be marked as such.
- If the article is inside the "Stuff Nation" category", it must be an opinion.
- If the article title has the "Stuff Nation" icon next to it, it is an opinion.
- If the article title has the "Sponsored" badge next to it, it is sponsored content.

We assume that if the article has intro text and it doesn't begin with those three strings then it must be an article.
However, if the article does not have any intro text associated with it, we cannot be certain about its classification.
We must resort to a more active method.

### Active Detection

After datamining the Stuff Android app in early 2019, I discovered a JSON API endpoint that could be useful.
In fact I made an [NPM package](https://www.npmjs.com/package/stuft) out of it.
If the unique id number of the article is known, it can be used to query the Stuff API.
This is useful as we can pull the intro text for each article and check if it matches any of the previous criteria.

The id for each article can be extracted from its hyperlink using the following regular expression:

```re
\/([0-9]+)\/?
```

This regular expression fails on any "Stuff Play" articles as these have a different URL scheme to other articles on the site. However, we consider "Stuff Play" articles to not be opinion pieces at this stage.

In order to not hammer the API server too hard (and to improve the performance of the extension), we should cache the results of all detections in local storage.

## Pseudo-Code

The following pseudo-code should cover all the cases we care about using both passive and active detection methods and caching.
When an article is marked, it has custom class added to its `classList` member.
This allows custom styling of the article depending on its classification.

```
function mark(id, type) do
    mark the article on the page as $type
    save the association to local storage if it doesn't exist
end

foreach article on the page:

    let id = the article's id

    if the id is in local storage:

        type = get type from local storage
        mark(id, type)

    else:

        if the article is in the "stuff nation" section:

            mark(id, "opinion")

        else if the article has a "stuff nation" icon next to it:

            mark(id, "opinion")

        else if the article has a "sponsored" badge next to it:

            mark(id, "sponsored")

        else if the article has intro text:

            if the intro text starts with "OPINION", "COMMENT", or "REVIEW":

                mark(id, ...)

            else:

                mark(id, "article")

        else:

            let intro text = request the intro text from the API

            if the intro text starts with "OPINION", "COMMENT", or "REVIEW":

                mark(id, ...)

            else:

                mark(id, "article")
```
