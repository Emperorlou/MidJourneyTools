// ==UserScript==
// @name         MidJourney Tools
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Currently this script is able to augment the midjourney.com website to add the ability to easily save individual images, and bulk save images.
// @author       Nik
// @match        https://www.midjourney.com/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=midjourney.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    $(document).ready(() => {
        // Monkeypatch to look for console.log of "filename: blah.png"
        console.stdlog = console.log.bind(console);
        console.logs = [];
        console.log = function(){
            console.logs.push(Array.from(arguments));
            console.stdlog.apply(console, arguments);
        }

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
        $(".mj-tools").append("<h2 class='mb-4 text-2xl font-medium text-slate-200'><a href='https://github.com/Emperorlou/MidJourneyTools' target='_blank'>MidJourney Tools</a></h2><p>Mouse over the image you want and press 'd' to download it</p>")
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


    $(document).on("keydown", "input[name='search']", event => {
        event.stopPropagation();
    });


   $(document).keydown(function( event ) {
       if ( event.which == 68 ) {
           try {
               let prompt;
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

                       setTimeout(() => {
                           prompt = window.overElement.parents("div[role='gridcell']").find("p._promptText_").text();
                           const filename = console.logs.pop()[1]
                           console.logs.length = 0
                           savePrompt(filename, prompt);
                       }, 100);

                   } else if (window.overElementType == 2) {
                       window.overElement.parents("div[role='gridcell']").find("button[title='Open Options']").click();

                       setTimeout(() => {
                           $("button:contains('Save image')").click();
                       }, 50);

                       setTimeout(() => {
                           prompt = window.overElement.parents("div[role='gridcell']").find("p._promptText_").text();
                           const filename = console.logs.pop()[1]
                           console.logs.length = 0
                           savePrompt(filename, prompt);
                       }, 100);

                   }

                   flagUrlSaved(src);
               }
           } catch (e) {
               console.logs.length = 0
               alert("Error occurred while saving. Try again?");
           }
       }
   });

    function savePrompt(filename, prompt) {
        var c = document.createElement("a");
        c.download = `${filename}.txt`;

        var t = new Blob([prompt], {
            type: "text/plain"
        });
        c.href = window.URL.createObjectURL(t);
        c.click();
        c.remove();
    }

    function autoSaveNextImage() {
        const allImages = $($("img[data-nimg='intrinsic']").get().reverse());
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
        // Old save style: savedImage-https://i.mj.run/6056d10f-86a4-46c8-a6a4-6046e525f5b7/grid_0.webp
        // New save style: savedImage-https://mj-gallery.com/cdn-cgi/image/width=640,format=webp/4930387c-bbc9-4007-a503-fc68eaad084f/grid_0.webp
        const urlID = src.replaceAll(/.*\/([A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+)\/.*/g, "$1") + "/grid_0.webp";

        localStorage.setItem("savedImage-https://i.mj.run/" + urlID, true);
    }

    function isUrlSaved(src) {
        // Old save style: savedImage-https://i.mj.run/6056d10f-86a4-46c8-a6a4-6046e525f5b7/grid_0.webp
        // New save style: savedImage-https://mj-gallery.com/cdn-cgi/image/width=640,format=webp/4930387c-bbc9-4007-a503-fc68eaad084f/grid_0.webp
        // const urlID = src.substring(src.length - 48, src.length);
        const urlID = src.replaceAll(/.*\/([A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+)\/.*/g, "$1") + "/grid_0.webp";

        return localStorage.getItem("savedImage-https://i.mj.run/" + urlID) === "true" ||
           localStorage.getItem("savedImage-https://mj-gallery.com/cdn-cgi/image/width=640,format=webp/" + urlID) === "true" ? true : false;
    }

})();
