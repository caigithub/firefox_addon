// ==UserScript==
// @name         chat-outline-answer
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
	// utils
	//
	function retry(description, stop_func, attremps = 10, intervalMs = 1000) {
		if (attremps <= 0) {
			console.log("[retry]", description, "- stop, max attempts reached");
			return;
		}

		//console.log("retry", attremps, stop_func);
		if (stop_func() === true) {
			console.log("[retry]", description, "- pass");
			return;
		}

		console.log(
			"[retry]",
			description,
			"- re-scheduled after",
			intervalMs,
			"ms.",
			attremps - 1,
			" attempts left",
		);
		setTimeout(() => {
			retry(description, stop_func, attremps - 1, intervalMs);
		}, intervalMs);
	}

	function debug(...args) {
		console.log("[chat outline]", ...args);
	}

	//==================
	// common ui component
	//

	function applyPosition(container, x, y) {
		container.style.transform = `translate(${x}px, ${y}px)`;
	}

	function getStoredPosition() {
		try {
			const stored = localStorage.getItem("chat-outline-position");
			if (stored == null) {
				return null;
			}

			const parsed = JSON.parse(stored);
			return {
				x: Number(parsed.x) || 0,
				y: Number(parsed.y) || 0,
			};
		} catch (error) {
			debug("failed to read stored position", error);
			return null;
		}
	}

	function savePosition(x, y) {
		try {
			localStorage.setItem("chat-outline-position", JSON.stringify({ x, y }));
		} catch (error) {
			debug("failed to save position", error);
		}
	}

	function enableDragDrop(container) {
		const storedPosition = getStoredPosition();
		let isDragging = false;
		let currentX = storedPosition?.x || 0;
		let currentY = storedPosition?.y || 0;
		let initialX;
		let initialY;
		let xOffset = currentX;
		let yOffset = currentY;

		applyPosition(container, currentX, currentY);

		function dragStart(e) {
			if (e.target.tagName === "BUTTON") return;

			initialX = e.clientX - xOffset;
			initialY = e.clientY - yOffset;

			if (e.target === container || container.contains(e.target)) {
				isDragging = true;
			}
		}

		function drag(e) {
			if (isDragging) {
				e.preventDefault();
				currentX = e.clientX - initialX;
				currentY = e.clientY - initialY;

				xOffset = currentX;
				yOffset = currentY;

				applyPosition(container, currentX, currentY);
			}
		}

		function dragEnd() {
			initialX = currentX;
			initialY = currentY;
			xOffset = currentX;
			yOffset = currentY;
			savePosition(xOffset, yOffset);
			isDragging = false;
		}

		container.addEventListener("mousedown", dragStart);
		document.addEventListener("mousemove", drag);
		document.addEventListener("mouseup", dragEnd);
	}

	function createOutlineUI() {
		const container = document.createElement("div");
		const contentContainer = document.createElement("div");
		contentContainer.dataset.role = "content";
		// Position
		container.style.position = "fixed";
		container.style.top = "30%";
		container.style.left = "300px";
		container.style.zIndex = "9999";
		// Size
		container.style.maxHeight = "50vh";
		container.style.padding = "30px";
		// Color
		container.style.backgroundColor = "white";
		// Other
		container.style.border = "1px solid #ccc";
		container.style.overflowY = "auto";
		container.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
		container.style.cursor = "move";
		contentContainer.style.position = "relative";
		contentContainer.style.zIndex = "1";
		// child
		const closeButton = createButton(" + ", "Show outline", null, (event) => {
			event.stopPropagation();
			if (isCollapsed) {
				showOutline();
			} else {
				hideOutline();
			}
		});
		container.appendChild(closeButton);
		container.appendChild(contentContainer);
		// status
		let isCollapsed = false;
		function showOutline() {
			isCollapsed = false;
			closeButton.textContent = " - ";
			closeButton.title = "Click toHide outline";
			contentContainer.style.display = "block";
		}
		function hideOutline() {
			isCollapsed = true;
			closeButton.textContent = " + ";
			closeButton.title = "Click to Show outline";
			contentContainer.style.display = "none";
		}
		enableDragDrop(container);
		showOutline();

		//
		return {
			container,
			closeButton,
			contentContainer,
			get isCollapsed() {
				return isCollapsed;
			},
		};
	}

	function createButton(text, hint, style, onClick) {
		const closeButton = document.createElement("button");
		closeButton.textContent = text;
		closeButton.title = hint;

		// Position
		closeButton.style.position = "absolute";
		closeButton.style.top = "5px";
		closeButton.style.left = "5px";
		closeButton.style.zIndex = "2";
		// Size
		closeButton.style.fontSize = "13px";
		closeButton.style.lineHeight = "1";
		closeButton.style.padding = "4px 7px";
		// Color
		closeButton.style.color = "#4b5563";
		closeButton.style.background = "#f9fafb";
		// Other
		closeButton.style.border = "1px solid #d1d5db";
		closeButton.style.cursor = "pointer";
		closeButton.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
		//
		if (style) {
			Object.assign(closeButton.style, style);
		}
		// events
		closeButton.addEventListener("click", onClick);
		closeButton.addEventListener("mouseenter", () => {
			closeButton.style.background = "#f3f4f6";
			closeButton.style.color = "#111827";
		});
		closeButton.addEventListener("mouseleave", () => {
			closeButton.style.background = "#f9fafb";
			closeButton.style.color = "#4b5563";
		});
		return closeButton;
	}

	//==================
	// outline ui component
	//

	function createSeperator() {
		const headerItem = document.createElement("div");
		headerItem.textContent = "------------------";
		headerItem.style.color = "lightgray";

		// Position
		// Size
		headerItem.style.padding = "2px 5px";
		headerItem.style.margin = "5px 0px";
		// Color
		// Other
		headerItem.style.cursor = "pointer";
		headerItem.style.whiteSpace = "pre";
		headerItem.style.fontFamily = "monospace";

		return headerItem;
	}

	function createContinue() {
		const headerItem = document.createElement("div");
		headerItem.textContent = "    ...";

		// Position
		// Size
		headerItem.style.padding = "2px 5px";
		// Color
		// Other
		headerItem.style.cursor = "pointer";
		headerItem.style.whiteSpace = "pre";
		headerItem.style.fontFamily = "monospace";

		return headerItem;
	}

	function createEmpty() {
		const headerItem = document.createElement("div");
		headerItem.textContent = "    <no outline>";

		// Position
		// Size
		headerItem.style.padding = "2px 5px";
		// Color
		// Other
		headerItem.style.cursor = "pointer";
		headerItem.style.whiteSpace = "pre";
		headerItem.style.fontFamily = "monospace";

		return headerItem;
	}

	const headerItemStyles = {
		normal: {
			color: "#374151",
			backgroundColor: "transparent",
		},
		highlight: {
			color: "#111827",
			backgroundColor: "#f0f0f0",
		},
	};

	function createHeaderItem(header, style = headerItemStyles.normal) {
		const level = parseInt(header.tagName.substring(1), 10);
		const indent = " ".repeat((level - 1) * 4);

		const headerItem = document.createElement("div");

		let headerContent = header.textContent;
		const headerContentMax = 40;
		if (header.textContent.length > headerContentMax) {
			headerContent = `${header.textContent.slice(0, headerContentMax)}...`;
		}
		headerItem.textContent = indent + headerContent;

		// Position
		// Size
		headerItem.style.padding = "2px 5px";
		// Color
		// Other
		headerItem.style.cursor = "pointer";
		headerItem.style.whiteSpace = "pre";
		headerItem.style.fontFamily = "monospace";

		const resolvedStyle = {
			...headerItemStyles.normal,
			...(style || {}),
		};
		Object.assign(headerItem.style, resolvedStyle);

		headerItem.addEventListener("click", () => {
			header.scrollIntoView({ behavior: "smooth", block: "start" });
		});

		headerItem.addEventListener("mouseenter", () => {
			Object.assign(headerItem.style, headerItemStyles.highlight);
		});
		headerItem.addEventListener("mouseleave", () => {
			Object.assign(headerItem.style, resolvedStyle);
		});

		return headerItem;
	}

	//==================
	// show outline dialog
	//

	function showReplyOutline(reply_dom, viewPortDom) {
		const headerDomList = reply_dom.querySelectorAll("h1, h2, h3, h4, h5, h6");
		if (headerDomList.length > 0) {
			headerDomList.forEach((header) => {
				if (isElmentInViewport(header, viewPortDom)) {
					outlineUI.contentContainer.appendChild(
						createHeaderItem(header, headerItemStyles.highlight),
					);
				} else {
					outlineUI.contentContainer.appendChild(
						createHeaderItem(header, headerItemStyles.normal),
					);
				}
			});
		} else {
			outlineUI.contentContainer.appendChild(createEmpty());
		}
	}

	let outlineUI = null;

	function showOutline(page) {
		if (outlineUI == null) {
			outlineUI = createOutlineUI();
			document.body.appendChild(outlineUI.container);
		} else {
			outlineUI.contentContainer.replaceChildren();
		}

		const replyDomList = page.getReplyDomList();
		const viewPortDom = page.getReplyViewPortDom();
		getVisibleList(replyDomList, viewPortDom).forEach(
			(reply_dom, reply_index) => {
				showReplyOutline(reply_dom, viewPortDom, page);
				if (reply_index < replyDomList.length - 1) {
					outlineUI.contentContainer.appendChild(createSeperator());
				}
			},
		);

		if (replyDomList.length === 0) {
			outlineUI.contentContainer.appendChild(createEmpty());
		}

		if (page.getReplyStatus() === "replying") {
			outlineUI.contentContainer.appendChild(createContinue());
		}
	}

	//==================
	// refresh
	//
	let nextRrefshedScheduled = false;
	function requestRefreshOutline(page) {
		if (nextRrefshedScheduled === true) {
			debug("requestRefreshOutline - scheduled");
			return;
		}

		setTimeout(() => {
			showOutline(page);
			nextRrefshedScheduled = false;
			debug("requestRefreshOutline - **refreshed**");
		}, 500);
		nextRrefshedScheduled = true;
	}

	//==================
	// detect reply content change
	//

	function monitorContentChange(parent, callback) {
		if (parent == null) {
			return null;
		}

		const observer = new MutationObserver(() => {
			debug("[content] changed");
			callback();
		});

		observer.observe(parent, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
		});

		window.addEventListener("beforeunload", () => {
			observer.disconnect();
			debug("status - clear observer");
		});

		return observer;
	}

	//==================
	// detect reply visibility change
	//

	function isElmentInViewport(element, viewPortDom) {
		const rect = element.getBoundingClientRect();
		const viewPortRect = viewPortDom.getBoundingClientRect();
		return rect.top >= viewPortRect.top && rect.bottom <= viewPortRect.bottom;
	}

	function isElmentOutOfViewport(element, viewPortDom) {
		const rect = element.getBoundingClientRect();
		const viewPortRect = viewPortDom.getBoundingClientRect();
		return rect.bottom < viewPortRect.top || rect.top > viewPortRect.bottom;
	}

	function getVisibleList(replyDom_list, viewport_dom) {
		const replyList = [];
		if (viewport_dom === null) {
			return replyList;
		}

		replyDom_list.forEach((reply_dom) => {
			if (isElmentOutOfViewport(reply_dom, viewport_dom)) {
				return;
			}
			replyList.push(reply_dom);
		});

		return replyList;
	}

	function visibilityObserver(name) {
		return {
			name: name,
			observedItems: [],
			observer: null,
			callback: null,
			observe: function (...items) {
				if (this.observer == null) {
					this.observer = new IntersectionObserver(
						(changed_item_list) => {
							debug(
								this.name,
								"visibility - ",
								changed_item_list.length,
								"changed",
							);
							this.callback();
						},
						{
							threshold: [0, 0.5, 1],
						},
					);
				}

				items.forEach((item) => {
					debug(
						this.name,
						"visibility - monitoring",
						item.textContent.substring(0, 30),
					);
					this.observer.observe(item);
					this.observedItems.push(item);
				});
			},
			disconnet: function () {
				if (this.observer) {
					this.observer.disconnect();
				}
				this.observedItems = [];
			},
		};
	}

	//==================
	// page config
	//
	const pageList = [
		{
			name: "kimi",
			getContentDom: () => document.querySelector(".main"),
			getReplyDomList: () =>
				document.querySelectorAll(".chat-content-item .segment-assistant"),
			getReplyViewPortDom: () => document.querySelector(".chat-detail-main"),
			getReplyStatus: () => {
				const buttonDom = document.querySelector(".send-button-container");
				if (buttonDom === null) {
					return "idle";
				}

				if (buttonDom.classList.contains("stop")) {
					return "replying";
				}

				return "idle";
			},
		},
		{
			name: "openai",
			getContentDom: () => document.querySelector(".\\@container\\/main"),
			getReplyDomList: () => {
				const replyList = [];
				document
					.querySelectorAll("div[data-message-author-role")
					.forEach((article) => {
						if (
							article.getAttribute("data-message-author-role") === "assistant"
						) {
							replyList.push(article);
						}
					});

				return replyList;
			},
			getReplyViewPortDom: () => document.querySelector(".\\@container\\/main"),
			getReplyStatus: () => {
				const buttonDom = document.querySelector(
					"#thread-bottom .composer-submit-button-color",
				);
				if (buttonDom === null) {
					return "idle";
				}

				if (buttonDom.classList.contains("composer-submit-btn")) {
					return "replying";
				}

				return "idle";
			},
		},
	];

	//==================
	// initialize
	//
	retry("[chat outline] initialization", () => {
		return pageList.some((page) => {
			const observer = visibilityObserver("header");
			observer.callback = () => {
				requestRefreshOutline(page);
			};

			const content_observer = monitorContentChange(
				page.getContentDom(),
				() => {
					const current_item_list = page
						.getContentDom()
						.querySelectorAll("h1, h2, h3, h4, h5, h6");

					if (observer.observedItems.length !== current_item_list.length) {
                        observer.disconnet();
						observer.observe(...current_item_list);
					}

					requestRefreshOutline(page);
				},
			);

			if (content_observer) {
				debug(page.name, "- content monitoring");
				requestRefreshOutline(page);
				return true;
			}

			return false;
		});
	});
})();
