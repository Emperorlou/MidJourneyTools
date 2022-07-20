// ==UserScript==
// @name         MidJourney Tools
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @match        https://www.midjourney.com/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=midjourney.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    $(document).ready(() => {
        setInterval(() => {
            if ($(".mj-tools").length == 0) {
                renderMjToolsPanel();
            }

            window.renderSavedImageIndicators();

            if (window.saveAllActive == true) {
                autoSaveNextImage();
            }
        }, 500);
    });

    function renderMjToolsPanel() {
        $(".mj-tools").remove();
        $("#searchBlock").before("<div class='mj-tools' style='z-index: 1;background: #142715;font-size: 13px;border-radius: 18px;padding: 10px;color: #999;'></div>");
        $(".mj-tools").append("<h2 class='mb-4 text-2xl font-medium text-slate-200'>MidJourney Tools</h2><p>Mouse over the image you want and press 'd' to download it</p>")
            .append("<p>Images surrounded with a green dotted line have already been downloaded before</p>");

        if (window.saveAllActive == true) {
            $(".mj-tools").append("<button onclick='window.cancelSaveAll()' style='float:right;background: #440000;padding: 5px;border-radius: 10px;font-weight: bold;'>Stop Save All</button>");
        } else {
            $(".mj-tools").append("<button onclick='window.startSaveAll()' style='float:right;background: #444;padding: 5px;border-radius: 10px;font-weight: bold;'>Save All</button>");
        }
    }

    window.saveAllActive = false;

    window.overElementType = null;
    window.overElement = null;
    $(document).on("mouseenter mousemove", "#list button img", event => {
        if (document.location.href == "https://www.midjourney.com/app/archive/") {
            window.overElementType = 1;
            window.overElement = event.target;
        }
    });
    $(document).on("mouseleave", "#list button img", event => {
        if (document.location.href == "https://www.midjourney.com/app/archive/" && window.overElement == event.target) {
            window.overElementType = null;
            window.overElement = null;
        }
    });

    $(document).on("mouseenter mousemove", "div[role='grid'] div[role='gridcell']", event => {
        window.overElementType = 2;
        window.overElement = $($(event.target).parent().parent()[0]).find("img[data-nimg='intrinsic']");
    });
    $(document).on("mouseleave", "div[role='grid'] div[role='gridcell']", event => {
        if (window.overElement == event.target) {
            window.overElementType = null;
            window.overElement = null;
        }
    });


   $(document).keydown(function( event ) {
       if ( event.which == 68 ) {
           try {
               if (window.overElement != null) {
                   const src = $(window.overElement).attr("src").replace("width=128,height=128,", "");

                   if (isUrlSaved(src)) {
                       const result = confirm("This image has already been saved, are you sure you want to save it again?");
                       if (result != true) return;
                   }

                   if (window.overElementType == 1) {

                       $(window.overElement).click();

                       setTimeout(() => {
                           $("button[title='Save with prompt']").click();

                           $("button[title='Close']").click();
                       }, 800);
                   } else if (window.overElementType == 2) {
                       window.overElement.parents("div[role='gridcell']").find("button[title='Open Options']").click();

                       setTimeout(() => {
                           $("button:contains('Save image')").click();
                       }, 50);
                   }

                   flagUrlSaved(src);
               }
           } catch (e) {
               alert("Error occurred while saving. Try again?");
           }
       }
   });

    function autoSaveNextImage() {
        const allImages = $("img[data-nimg='intrinsic']");
        for(const imgElement of allImages) {

            const img = $(imgElement);
            if (img.hasClass("rounded-full")) continue;  // Ignore the "profile" image
            const src = img.attr("src").replace("width=128,height=128,", "");

            if (isUrlSaved(src) == false) {
                img.parents("div[role='gridcell']").find("button[title='Open Options']").click();

                setTimeout(() => {
                    $("button:contains('Save image')").click();
                }, 50);

                flagUrlSaved(src);

                break;
            }
        }
    }

    window.startSaveAll = () => {

        if (document.location.href == "https://www.midjourney.com/app/archive/") {
            alert("The save-all function does not work in the archive part of the website.");
            return;
        }


        if (confirm("Are you sure you want to do this? While this process is active, EVERY image that appears will be saved. You are expected to scroll down the page slowly.\n\nYou might want to save only upscales, in that case make sure to filter on upscales only first!")) {
            window.saveAllActive = true;
            renderMjToolsPanel();
        }
    };

    window.cancelSaveAll = () => {
        window.saveAllActive = false;
        renderMjToolsPanel();
    };

    window.renderSavedImageIndicators = () => {
        const allImages = $("img[data-nimg='intrinsic']");
        for(const imgElement of allImages) {
            const img = $(imgElement);
            const src = img.attr("src").replace("width=128,height=128,", "");

            if (isUrlSaved(src))
                img.css("border", "3px green dashed");
        }
    }

    function flagUrlSaved(src) {
        localStorage.setItem("savedImage-" + src, true);
    }

    function isUrlSaved(src) {
        return localStorage.getItem("savedImage-" + src) === "true" ? true : false;
    }

})();
