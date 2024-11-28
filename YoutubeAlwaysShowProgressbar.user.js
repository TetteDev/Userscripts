// ==UserScript==
// @name         YouTube Always show progress bar (and auto quality)
// @version      0.3
// @description  Youtube Shit
// @author       TetteDev
// @match        *://www.youtube.com/*
// @grant        GM_addStyle
// ==/UserScript==

const animateProgressbarUpdate = true;
// global tick count
let ticks = 0;
// Auto update the always showing progress bar every n'th timeupdate/progress ticks
const triggerTickCount = animateProgressbarUpdate ? 50 : 8; // update less frequently (also good for cpu) if we are animating the width of the progress bar

// set this to false to disable automatically setting youtube video quality
const autoSetQuality = true;
// Auto set quality every n'th timeupdate update ticks
let qualityTriggerTickCount = 25;

// available qualities to chose from
// _max will use the highest available quality for the video
//const __QUALITIES =  ['_max' ,'auto', 'highres', 'hd2880', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
const priorityTargetQuality = ["hd1440", "hd1080", "_max"];

let addedStyleSheet = undefined;
const styleText = '.ytp-autohide .ytp-chrome-bottom{opacity:1!important;width:100%!important;left:0!important;display:block!important}.ytp-autohide .ytp-chrome-bottom .ytp-progress-bar-container{bottom:-1px!important}.ytp-autohide .ytp-chrome-bottom .ytp-chrome-controls{opacity:0!important}';
if (document.getElementsByTagName('head').length === 0) {
	addedStyleSheet = GM_addStyle(styleText);
}
else {
	try {
		// Apparently prevents the page from throwing "This document requires 'TrustedHTML' assignment." errors when setting the styletext to style.innerHTML
		if (window.trustedTypes && window.trustedTypes.createPolicy) {
			window.trustedTypes.createPolicy('default', {
				createHTML: (string, sink) => string
			});
		}
		addedStyleSheet = document.createElement('style');
		addedStyleSheet.type = 'text/css';
		addedStyleSheet.innerHTML = styleText;
		document.getElementsByTagName('head')[0].appendChild(addedStyleSheet);
	} catch {
		// If this fails due to "This document requires 'TrustedHTML' assignment." just use GM_addStyle
		addedStyleSheet = GM_addStyle(styleText);
	}
}

var findVideoInterval = null;
const fnInnerFindVideoInterval = () => {
	/*
	// TODO: disable always on progressbar for livestreams?
	const isLivestream = (document.querySelector(".ytp-live-badge")?.getAttribute("disabled") ?? "false") !== "false";
	if (isLivestream) {
		if (addedStyleSheet !== undefined) {
			addedStyleSheet.remove();
			addedStyleSheet = undefined;
		}
		return;
	}
	*/

	var ytplayer = document.querySelector(".html5-video-player:not(.addedupdateevents)");
    if (!ytplayer) {
        return;
    }
	if (findVideoInterval) {
		clearInterval(findVideoInterval);
		findVideoInterval = null;
	}

    var video = ytplayer.querySelector("video");
    var progressbar = ytplayer.querySelector(".ytp-play-progress");
	// Buffer portion of the video progressbar
    var loadbar = ytplayer.querySelector(".ytp-load-progress");
    if (!video || !progressbar || !loadbar) {
		console.warn("[Always Show Progressbar] Could not find vital elements", video, progressbar, loadbar);
        return;
    }
	ytplayer.className += " addedupdateevents";

    video.addEventListener("timeupdate",function() {
		if (autoSetQuality && (ticks == 0 || (ticks % qualityTriggerTickCount === 0))) {
			const player = document.querySelector(".html5-video-player") ?? (progressbar.closest(".html5-video-player") || progressbar.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement || null);
			if (!player || player === undefined) {
				debugger;
				return;
			}
			const currentQuality = player.getPlaybackQuality();
			const availableQualities = player.getAvailableQualityLevels().filter(qual => qual !== "auto");
			const matchedQualitiesOrdered = availableQualities.filter(quality => priorityTargetQuality.includes(quality));
			if (matchedQualitiesOrdered && matchedQualitiesOrdered.length > 0) {
				if (currentQuality !== matchedQualitiesOrdered[0]) {
					player.setPlaybackQualityRange(matchedQualitiesOrdered[0]);
				}
			} else {
				if ("hd1080" in availableQualities && currentQuality !== "hd1080") player.setPlaybackQualityRange("hd1080");
				else if ("highres" in availableQualities && currentQuality !== "highres") player.setPlaybackQualityRange("highres");
				else if ("auto" in availableQualities && currentQuality !== "auto") player.setPlaybackQualityRange("auto");
				else if ("hd720" in availableQualities && currentQuality !== "hd720") player.setPlaybackQualityRange("hd720");
			}
		}

		if (animateProgressbarUpdate) {
			const transition = "transform .5s linear";
			if (progressbar.style.transition === "") {
				progressbar.style.transition = transition;
			}

			if (loadbar.style.transition === "") {
				loadbar.style.transition = transition;
			}
		}
		if (++ticks % triggerTickCount === 0) {
			progressbar.style.transform = `scaleX(${(video.currentTime/video.duration)})`;
		}
    });

	video.addEventListener("progress",function() {
		loadbar.style.transform = `scaleX(${(video.buffered.end(video.buffered.length-1)/video.duration)})`;
		progressbar.style.transform = `scaleX(${(video.currentTime/video.duration)})`;
	});
}

findVideoInterval = setInterval(fnInnerFindVideoInterval, 1000);
document.addEventListener("yt-navigate-finish", () => {
	fnInnerFindVideoInterval();
});
document.addEventListener("yt-player-updated", () => {
	fnInnerFindVideoInterval();
});