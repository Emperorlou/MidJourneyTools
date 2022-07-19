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

    $(document).on("mouseenter", "div[role='grid'] img[data-nimg='intrinsic']", event => {
        window.overElementType = 2;
        window.overElement = event.target;
    });
    $(document).on("mouseleave", "div[role='grid'] img[data-nimg='intrinsic']", event => {
        if (window.overElement == event.target) {
            window.overElementType = null;
            window.overElement = null;
        }
    });


   $(document).keydown(function( event ) {
       if ( event.which == 68 ) {
           if (window.overElement != null) {
               const src = $(window.overElement).attr("src").replace("width=128,height=128,", "");

               if (window.overElementType == 1) {

                   $(window.overElement).click();

                   setTimeout(() => {
                       $("button[title='Save with prompt']").click();

                       $("button[title='Close']").click();
                   }, 800);
               } else if (window.overElementType == 2) {
                   $($("div[role='grid'] img[data-nimg='intrinsic']")[0]).parents("div[role='gridcell']").find("button[title='Open Options']").click();

                   setTimeout(() => {
                       $("button:contains('Save image')").click();
                   }, 50);
               }
           }
       }
   });




function downloadURI(uri, name)
{
    var link = document.createElement("a");
    // If you don't know the name or want to use
    // the webserver default set name = ''
    link.setAttribute('download', name);
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function downloadFile(filePath){
    var link=document.createElement('a');
    link.href = filePath;
    link.download = filePath.substr(filePath.lastIndexOf('/') + 1);
    link.click();
}




 const JpgToPngConvertor = (() =>{
    function convertor(imageFileBlob, options) {
      options = options || {};

      const defaults = {};
      const settings = extend(defaults, options);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext("2d");
      const imageEl = createImage();
      const downloadLink = settings.downloadEl || createDownloadLink();

      function createImage(options) {
        options = options || {};
        const img = (Image) ? new Image() : document.createElement('img');
        img.crossOrigin = "anonymous";

        img.style.width = (options.width) ? options.width + 'px' : 'auto';
        img.style.height = (options.height) ? options.height + 'px' : 'auto';

        return img;
      }

      function extend(target, source) {
        for (let propName in source) {
          if (source.hasOwnProperty(propName)) {
            target[propName] = source[propName];
          }
        }

        return target;
      }

      function createDownloadLink() {
        return document.createElement('a');
      }

      function download() {
        if ('click' in downloadLink) {
          downloadLink.click();
        } else {
         downloadLink.dispatchEvent(createClickEvent());
        }
      }

      function updateDownloadLink(jpgFileName, pngBlob) {
        const linkEl = downloadLink;
        const pngFileName = jpgFileName.replace(/jpe?g/i, 'png');

        linkEl.setAttribute('download', pngFileName);
        linkEl.href = window.URL.createObjectURL(pngBlob);

        // If there is custom download link we don't download automatically
        if (settings.downloadEl) {
          settings.downloadEl.style.display = 'block';
        } else {
          download();
        }
      }

      function createClickEvent() {
        if ('MouseEvent' in window) {
          return new MouseEvent('click');
        } else {
          const evt = document.createEvent("MouseEvents");
          evt.initMouseEvent("click", true, true, window);
          return evt;
        }
      }

      function process() {
        const imageUrl = imageFileBlob;

        imageEl.onload = (e) => {
          canvas.width = e.target.width;
          canvas.height = e.target.height;
          ctx.drawImage(e.target, 0, 0, e.target.width, e.target.height);
          //canvas.toBlob(updateDownloadLink.bind(window, imageUrl.substring(imageUrl.lastIndexOf("/") + 1, imageUrl.lastIndexOf("."))) + ".png", 'image/png', 1);
          canvas.toBlob(updateDownloadLink.bind(window, "test.png"), 'image/png', 1);
        };

        imageEl.src = imageUrl;
        if (settings.downloadEl) {
          settings.downloadEl.style.display = 'none';
        }
      }

      return {
        process: process
      };
    }

    return convertor;
  })();
})();
