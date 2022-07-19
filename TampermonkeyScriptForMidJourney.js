// ==UserScript==
// @name         MidJourney Tools
// @namespace    http://tampermonkey.net/
// @version      0.1
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
        $("#searchBlock").prepend("<div class='mj-tools' style='z-index: 1;'></div>");
        $(".mj-tools").append("<h2 class='mb-4 text-2xl font-medium text-slate-200'>MidJourney Tools</h2><p>Mouse over the image you want and press 'd' to download it (available in the <a href='/app/archive'>Archive</a> section only)</p>");
    });

    window.overElementType = null;
    window.overElement = null;
    $(document).on("mouseenter", "#list button img", event => {
        window.overElementType = 1;
        window.overElement = event.target;
    });
    $(document).on("mouseleave", "#list button img", event => {
        if (window.overElement == event.target) {
            window.overElementType = null;
            window.overElement = null;
        }
    });

    //$(document).on("mouseenter", "div[role='grid'] img[data-nimg='intrinsic']", event => {
    $(document).on("mouseenter", "div[role='grid'] div[role='gridcell']", event => {
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
               }
           } catch (e) {
               alert("Error occurred while saving. Try again?");
           }
       }
   });

})();
