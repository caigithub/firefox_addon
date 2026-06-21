//==================
// retry
//
function retry(stop_func, attremps = 10, intervalMs = 1000) {
	if (attremps <= 0) {
		return;
	}

	console.log("retry", attremps, stop_func);
	if (stop_func() === true) {
		return;
	}

	setTimeout(() => {
		retry(stop_func, attremps - 1, intervalMs);
	}, intervalMs);
}

//==================
// ui component
//
function createCloseButton(container) {
	const closeButton = document.createElement("button");
	closeButton.textContent = "×";
	// Position
	closeButton.style.position = "absolute";
	closeButton.style.top = "5px";
	closeButton.style.right = "5px";
	// Size
	closeButton.style.fontSize = "20px";
	closeButton.style.lineHeight = "1";
	// Color
	closeButton.style.color = "#666";
	closeButton.style.background = "transparent";
	// Other
	closeButton.style.border = "none";
	closeButton.style.cursor = "pointer";
	closeButton.addEventListener("click", () => {
		container.remove();
	});
	closeButton.addEventListener("mouseenter", () => {
		closeButton.style.color = "#000";
	});
	closeButton.addEventListener("mouseleave", () => {
		closeButton.style.color = "#666";
	});
	return closeButton;
}

function createHeaderContainer() {
	const container = document.createElement("div");
	// Position
	container.style.position = "fixed";
	container.style.top = "40%";
	container.style.right = "10px";
	container.style.zIndex = "9999";
	// Size
	container.style.maxHeight = "80vh";
	container.style.padding = "30px";
	// Color
	container.style.backgroundColor = "white";
	// Other
	container.style.border = "1px solid #ccc";
	container.style.overflowY = "auto";
	container.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
	container.style.cursor = "move";

	let isDragging = false;
	let currentX;
	let currentY;
	let initialX;
	let initialY;
	let xOffset = 0;
	let yOffset = 0;

	container.addEventListener("mousedown", dragStart);
	document.addEventListener("mousemove", drag);
	document.addEventListener("mouseup", dragEnd);

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

			container.style.transform = `translate(${currentX}px, ${currentY}px)`;
		}
	}

	function dragEnd() {
		initialX = currentX;
		initialY = currentY;
		isDragging = false;
	}

	const closeButton = createCloseButton(container);
	container.appendChild(closeButton);
	return container;
}

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
	headerItem.textContent = "    <empty>";

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

function createHeaderItem(header) {
	const level = parseInt(header.tagName.substring(1), 10);
	const indent = " ".repeat((level - 1) * 4);

	const headerItem = document.createElement("div");

	let header_content = header.textContent;
	const header_content_max = 40;
	if (header.textContent.length > header_content_max) {
		header_content = `${header.textContent.slice(0, header_content_max)}...`;
	}
	headerItem.textContent = indent + header_content;

	// Position
	// Size
	headerItem.style.padding = "2px 5px";
	// Color
	// Other
	headerItem.style.cursor = "pointer";
	headerItem.style.whiteSpace = "pre";
	headerItem.style.fontFamily = "monospace";

	headerItem.addEventListener("click", () => {
		header.scrollIntoView({ behavior: "smooth", block: "start" });
	});

	headerItem.addEventListener("mouseenter", () => {
		headerItem.style.backgroundColor = "#f0f0f0";
	});
	headerItem.addEventListener("mouseleave", () => {
		headerItem.style.backgroundColor = "transparent";
	});

	return headerItem;
}

function _createPinButton() {
	const pinButton = document.createElement("button");
	// Position
	//pinButton.style.position = "absolute";
	//pinButton.style.top = "5px";
	//pinButton.style.right = "5px";
	pinButton.style.marginLeft = "16px";
	// Size
	pinButton.style.width = "24px";
	pinButton.style.height = "24px";
	// Color
	pinButton.style.backgroundColor = "#4CAF50";
	pinButton.style.color = "white";
	// Other
	pinButton.style.border = "none";
	pinButton.style.borderRadius = "50%";
	pinButton.style.cursor = "pointer";
	pinButton.style.fontSize = "14px";
	pinButton.style.display = "flex";
	pinButton.style.alignItems = "center";
	pinButton.style.justifyContent = "center";
	pinButton.textContent = "📌";

	pinButton.addEventListener("mouseenter", () => {
		pinButton.style.backgroundColor = "#45a049";
	});
	pinButton.addEventListener("mouseleave", () => {
		pinButton.style.backgroundColor = "#4CAF50";
	});

	return pinButton;
}

//==================
// show reply dialog
//

let lastReplyOutlineContainer = null;
function showHeaderNavigation(replayDomList, tail) {
	if (lastReplyOutlineContainer != null) {
		document.body.removeChild(lastReplyOutlineContainer);
	}

	lastReplyOutlineContainer = createHeaderContainer();
	replayDomList.forEach((reply_dom, index) => {
		const headerDomList = reply_dom.querySelectorAll("h1, h2, h3, h4, h5, h6");

		if (headerDomList.length > 0) {
			headerDomList.forEach((header) => {
				lastReplyOutlineContainer.appendChild(createHeaderItem(header));
			});
		} else {
			lastReplyOutlineContainer.appendChild(createEmpty());
		}

		if (index < replayDomList.length - 1) {
			lastReplyOutlineContainer.appendChild(createSeperator());
		}
	});

	if (tail) {
		lastReplyOutlineContainer.appendChild(tail);
	}
	document.body.appendChild(lastReplyOutlineContainer);
}

//==================
// detect reply status
//

function continueRefresh(page) {
	console.log("[chat outline] continueRefresh");
	showOutline(page);

	if (page.getReplyStatus() === "replying") {
		setTimeout(() => continueRefresh(page), 500);
	}
}

function monitorReplyStatusChange(page, callback) {
	const target = page.getReplyStatusDom();
	if (!target) {
		return null;
	}

	let lastStatus = page.getReplyStatus();
	const observer = new MutationObserver(() => {
		const currentStatus = page.getReplyStatus();
		if (currentStatus !== lastStatus) {
			console.log(
				"[chat outline] status changed",
				lastStatus,
				"→",
				currentStatus,
			);
			callback(lastStatus, currentStatus);
			lastStatus = currentStatus;
		}
	});

	observer.observe(target, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["class", "disabled", "aria-disabled", "aria-label"],
	});

	window.addEventListener("beforeunload", () => {
		observer.disconnect();
	});

	return observer;
}

//==================
// detect current reply

function showOutline(page) {
	let tail = null;
	if (page.getReplyStatus() === "replying") {
		tail = createContinue();
	}
	showHeaderNavigation(getVisiableReplyList(page), tail);
}

function getVisiableReplyList(page) {
	const viewport = page.getReplyViewPortDom().getBoundingClientRect();
	const replyList = [];

	page.getReplyDomList().forEach((reply_dom) => {
		const reply_port = reply_dom.getBoundingClientRect();
		const offset = 20;
		if (
			reply_port.top > viewport.bottom ||
			reply_port.bottom < viewport.top + offset
		) {
			return;
		}
		replyList.push(reply_dom);
	});

	return replyList;
}

function monitorReplyVisibilityChange(page, callback) {
	const observer = new IntersectionObserver(
		() => {
			console.log("[chat outline] visibility changed");
			callback();
		},
		{
			threshold: [0, 0.5, 1],
		},
	);

	page.getReplyDomList().forEach((reply) => {
		observer.observe(reply);
	});

	window.addEventListener("beforeunload", () => {
		observer.disconnect();
	});

	return observer;
}

//==================
// main

const pageList = [
	{
		name: "kimi",
		getReplyDomList: () =>
			document.querySelectorAll(".chat-content-item .segment-assistant"),
		getReplyViewPortDom: () => document.querySelector(".chat-detail-main"),
		getReplyStatusDom: () => document.querySelector(".send-button-container"),
		getReplyStatus: function () {
			const buttonDom = this.getReplyStatusDom();
			if (buttonDom === null) {
				return "idle";
			}

			if (buttonDom.classList.contains("stop")) {
				return "replying";
			}

			return "idle";
		},
	},
];

retry(() => {
	pageList.some((page) => {
		if (page.getReplyDomList().length <= 0) {
			return false;
		}
		console.log("[chat outline]", page.name, "- load reply");

		monitorReplyVisibilityChange(page, () => {
			showOutline(page);
		});
		console.log("[chat outline]", page.name, "- monitoring reply visibility");

		return true;
	});
});

retry(() => {
	pageList.forEach((page) => {
		if (
			monitorReplyStatusChange(page, (before, after) => {
				if (before === "idle" && after === "replying") {
					continueRefresh(page);
				} else {
					showOutline(page);
				}
			})
		) {
			console.log("[chat outline]", page.name, "- monitoring reply status");
		}
	});
	return false;
});
