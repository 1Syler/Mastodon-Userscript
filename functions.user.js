// ==UserScript==
// @name         Mastodon Easy Remote Follow
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Make the process of following someone on a different server easier
// @author       You
// @match        https://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Waits for a node to exist before returning it
    function getNode(selector) {
        return new Promise(resolve => {
            if(document.querySelector(selector)) {
                resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if(document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    async function createFollowBtn() {
        if(!document.querySelector("#remote-follow")) {
            const accountBtns = await getNode(".account__header__tabs__buttons");
            const newBtn = document.createElement("Button");
            newBtn.setAttribute('id', 'remote-follow');
            newBtn.innerText = "Remote Follow";
            newBtn.classList.add("button");
            newBtn.classList.add("logo-button");
            accountBtns.prepend(newBtn);

            document.querySelector("#remote-follow").addEventListener("click", () => {
                const userURL = document.querySelector(".account__header__tabs__name h1 small").innerText;
                window.location.href = 'https://' + myServer + '/' + userURL;
            });
        }
    }

    function scrollToBottom(pos, start, numFollowers) {
        const followers = document.querySelectorAll(".item-list article");

        if(start == numFollowers) {
            return;
        } else if(followers[start].firstElementChild) {
            const url = followers[start].querySelector(".account__display-name").href;

            if(followers[start].querySelector(".account__relationship button")) {
                const status = followers[start].querySelector(".account__relationship button").title;
                if(status !== "Follow") {
                    followers[start].style.display = "none";
                }
            }

            scrollToBottom(pos, start+1, numFollowers);
        } else {
            window.scrollTo(0, pos);
            setTimeout(() => {
                scrollToBottom(pos+80, start, numFollowers);
            }, 1000);
        }
    }

    async function createFilterBtn() {
        if(!document.querySelector("#mutuals-filter")) {
            const accountStats = await getNode(".account__header__extra__links");
            const newBtn = document.createElement("Button");
            newBtn.setAttribute('id', 'mutuals-filter');
            newBtn.innerText = "Filter Mutals";
            newBtn.style.background = "white";
            accountStats.append(newBtn);

            document.querySelector("#mutuals-filter").addEventListener("click", () => {
                const numFollowers = document.querySelectorAll(".account__header__extra__links a")[2].title;
                scrollToBottom(100, 0, numFollowers);
            });
        }
    }

    function detectPageChange() {
        let prevURL = '';
        const observer = new MutationObserver((mutations) => {
            if(location.href !== prevURL) {
                prevURL = window.location.href;

                if(host === myServer && prevURL.match(/^https:\/\/.*\/@.*\/followers$/)) {
                    createFilterBtn();
                } else if(host !== myServer && prevURL.match(/^https:\/\/.*\/@.*$/)) {
                    createFollowBtn();
                }
            }
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    const myServer = "twit.social";
    const host = window.location.host;
    const url = window.location.href;
    const body = document.querySelector("body > #mastodon");

    if(host === myServer && url.match(/^https:\/\/.*\/@.*\/followers$/) && body) {
        createFilterBtn();
    } else if(host !== myServer && url.match(/^https:\/\/.*\/@.*$/) && body) {
        createFollowBtn();
    } else if(body) {
        detectPageChange();
    }
})();
