// ==UserScript==
// @name         chatgpt-jump
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  move github status in the first coloumn
// @author       colinkaopu
// @include      https://chatgpt.com/*
// @include      https://www.kimi.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
	//==================
	// debug
	//
	function debug(action, ...articles) {
		if (articles) {
			for (const ar of articles) {
				console.log(
					"[chatgpt jump]",
					"[",
					action,
					"]",
					ar.getBoundingClientRect().top,
					ar.textContent.substring(0, 50),
				);
			}
			return;
		}
		console.log("[chatgpt jump]", action);
	}

	//==================
	// ux
	//
	function createButton(ext_css, callback) {
		const button = document.createElement("div");

		const shape_square_css = [
			"-webkit-border-radius:2px",
			"-moz-border-radius:2px",
			"border-radius:2px",
		];

		const css = [
			"position:fixed",
			"z-index:19810330",
			"width:40px",
			"height:40px",
		].concat(ext_css);

		button.style.cssText = css.concat(shape_square_css).join(";");
		button.addEventListener("click", () => {
			callback(button);
		});

		return button;
	}

	function uxShake(element, duration = 300) {
		const start = performance.now();
		function animate(time) {
			const elapsed = time - start;
			const progress = elapsed / duration;
			const x = Math.sin(progress * 3 * Math.PI) * 10;
			element.style.transform = `translateX(${x}px)`;
			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				element.style.transform = "translateX(0)";
			}
		}
		requestAnimationFrame(animate);
	}

	function makeColor(r, g, b, o) {
		return `rgba(${r}, ${g}, ${b}, ${o})`;
	}

	function uxBorderFlash(element, duration = 1000, r, g, b) {
		const old_color = element.style.borderColor;
		const old_thick = element.style.borderWidth;
		const old_style = element.style.borderStyle;

		element.style.borderColor = makeColor(r, g, b, 0);
		element.style.borderWidth = `5px`;
		element.style.borderStyle = `solid`;

		for (let step = 0; step < duration; step = step + 100) {
			setTimeout(() => {
				element.style.borderColor = makeColor(r, g, b, 1 - step / duration);
			}, step);
		}

		setTimeout(() => {
			element.style.borderColor = old_color;
			element.style.borderWidth = old_thick;
			element.style.borderStyle = old_style;
		}, duration);
	}

	//==================
	// jump before
	//
	function isHiddenBefore(article, viewPortDom) {
		return (
			article.getBoundingClientRect().top <
			viewPortDom.getBoundingClientRect().top
		);
	}

	function jumpUp(config) {
		debug("jumpUp =========");
		let last_hidden_artile = null;

		for (const article of config.articleQueryFunc()) {
			debug("jumpUp", article);
			if (config.isGptArticleFunc(article)) {
				continue;
			}

			if (isHiddenBefore(article, config.articleViewPortQueryFunc())) {
				debug("jumpUp--->", article);
				last_hidden_artile = article;
			}
		}

		if (last_hidden_artile) {
			debug("jumpUp===>", last_hidden_artile);
			config.scrollFunc(last_hidden_artile);
			debug("jumpUp****", last_hidden_artile);
			return last_hidden_artile;
		}

		return null;
	}

	//==================
	// jump after
	//
	function isHiddenAfter(article, viewPortDom) {
		return (
			article.getBoundingClientRect().top >
			viewPortDom.getBoundingClientRect().top + 100
		);
	}

	function jumpDown(config) {
		debug("jumpDown =========");
		for (const article of config.articleQueryFunc()) {
			debug("jumpDown", article);
			if (config.isGptArticleFunc(article)) {
				continue;
			}

			if (isHiddenAfter(article, config.articleViewPortQueryFunc())) {
				debug("jumpDown--->", article);
				debug("jumpDown===>", article);
				config.scrollFunc(article);
				debug("jumpDown****", article);
				return article;
			}
		}

		return null;
	}

	//==================
	// jump
	//
	function jump(configList, jumpFunc) {
		for (const config of configList) {
			const jumpToItem = jumpFunc(config);
			if (jumpToItem) {
				return jumpToItem;
			}
		}
		return null;
	}

	function uxJump(jumpToItem, r, g, b, jumpButton) {
		if (jumpToItem) {
			uxBorderFlash(jumpToItem, 1000, r, g, b);
			return;
		}

		uxShake(jumpButton, 300);
	}

	//==================
	// jump main
	//
	const configList = [
		{
			name: "kimi",
			articleQueryFunc: () => document.querySelectorAll(".chat-content-item"),
			articleViewPortQueryFunc: () =>
				document.querySelector(".chat-detail-main"),
			isGptArticleFunc: (article) =>
				article.querySelector(".segment-assistant"),
			isUserArticleFunc: (article) => article.querySelector(".segment-user"),
			scrollFunc: (article) => {
				article.scrollIntoView();
			},
		},
		{
			name: "chatgpt",
			articleQueryFunc: () => document.querySelectorAll("section"),
			articleViewPortQueryFunc: () =>
				document.querySelector(".\\@container\\/main"),
			isGptArticleFunc: (article) =>
				article.getAttribute("data-turn") === "assistant",
			isUserArticleFunc: (article) =>
				article.getAttribute("data-turn") === "user",
			scrollFunc: (article) => {
				article.style.scrollMarginTop = "0px";
				article.scrollIntoView();
			},
		},
	];

	document.querySelectorAll(":root > body").forEach((body) => {
		body.appendChild(
			createButton(
				["background: red", "top: 400px", "right:240px"],
				(button) => {
					const jumpTo = jump(configList, jumpUp);
					uxJump(jumpTo, 255, 0, 0, button);
				},
			),
		);
		body.appendChild(
			createButton(
				["background: blue", "top: 440px", "right:240px"],
				(button) => {
					const jumpTo = jump(configList, jumpDown);
					uxJump(jumpTo, 0, 0, 255, button);
				},
			),
		);
	});
	console.log("[chatgpt jump] loaded");
})();
