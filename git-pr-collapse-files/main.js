// ==UserScript==
// @name         github_pr_diff_files_expand_clopase
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  move github status in the first coloumn
// @author       colinkaopu
// @match        https://github.com/*/pull/*/files
// @match        https://github.com/*/pull/*/files?*
// @match        https://github.com/*/pull/*/commits/*
// @match        https://github.com/*/commit/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(() => {
	//==================
	//
	const retry_again = true;
	const retry_stop = false;

	function retry(title, retry_count, need_retry_func) {
		if (!need_retry_func()) {
			console.log(title, "[detect-page-loading] found");
			return;
		}

		if (retry_count <= 0) {
			console.log(title, "[detect-page-loading] NOT found");
			return;
		}

		console.log(title, "[detect-page-loading] checking");
		const seconds = 1000;
		setTimeout(() => {
			retry(title, retry_count - 1, need_retry_func);
		}, 0.5 * seconds);
	}

	//==================

	function createButton(text, click_handler) {
		var expand_btn = document.createElement("BUTTON");
		expand_btn.appendChild(document.createTextNode(text));

		expand_btn.classList.add("btn");
		expand_btn.classList.add("btn-sm");
		expand_btn.classList.add("btn-outline");
		expand_btn.classList.add("BtnGroup-item");

		expand_btn.addEventListener("click", click_handler);

		return expand_btn;
	}

	function createCopyPasteButton(name, value) {
		return createButton(name, () => {
			navigator.clipboard.writeText(value);
		});
	}

	function createLinkButton(name, value) {
		return createButton(name, () => {
			window.open(value, "_blank");
		});
	}

	function createButtonBar(buttons) {
		var div = document.createElement("div");
		div.classList.add("BtnGroup");

		buttons.forEach((b) => {
			div.appendChild(b);
		});

		return div;
	}

	//==================

	function insert_file_action_buttons(
		getFileDiffContainerDomList,
		file_action_config,
	) {
		//==================
		// enable ui
		//
		getFileDiffContainerDomList().forEach((file_diff_container_dom) => {
			console.log("[load] insert_file_action_buttons");

			const buttons = [];

			const fileInfo = file_action_config.getFileInfo(file_diff_container_dom);
			if (fileInfo) {
				buttons.push(
					createCopyPasteButton(
						"Copy diff url",
						`${fileInfo.name}\r\n${fileInfo.url}`,
					),
				);
			}

			const baseInfo = file_action_config.getBaseBranchInfo();
			if (fileInfo && baseInfo) {
				buttons.push(
					createLinkButton("Open Base", `${baseInfo.url}/${fileInfo.name}`),
				);
			}

			const yourInfo = file_action_config.getYourBranchInfo();
			if (fileInfo && yourInfo) {
				buttons.push(
					createLinkButton("Open Yours", `${yourInfo.url}/${fileInfo.name}`),
				);
			}

			file_action_config
				.getFileActionContainerDom(file_diff_container_dom)
				.appendChild(createButtonBar(buttons));
		});
	}

	function insert_expand_collapse_buttons(
		getFileDiffContainerDomList,
		expand_and_collapse_config,
	) {
		function expand_all() {
			getFileDiffContainerDomList().forEach((file_diff_dom) => {
				expand_and_collapse_config.expandFileDiff(file_diff_dom);
			});
		}

		function collapse_all() {
			getFileDiffContainerDomList().forEach((file_diff_dom) => {
				expand_and_collapse_config.collapseFileDiff(file_diff_dom);
			});
		}

		function expand_comments_only() {
			getFileDiffContainerDomList().forEach((file_diff_dom) => {
				if (
					expand_and_collapse_config.checkUserComment(file_diff_dom) ||
					expand_and_collapse_config.checkGitComments(file_diff_dom)
				) {
					expand_and_collapse_config.expandFileDiff(file_diff_dom);
					return;
				}
				expand_and_collapse_config.collapseFileDiff(file_diff_dom);
			});
		}

		//==================
		// enable ui
		//
		expand_and_collapse_config
			.getExpandCollaspeButtonContainerDom()
			.forEach((element) => {
				console.log("[load] insert_expand_collapse_buttons");
				element.appendChild(
					createButtonBar([
						createButton("Expand Commonts Only", expand_comments_only),
						createButton("Expand All", expand_all),
						createButton("Collapse All", collapse_all),
					]),
				);
			});
	}

	//==================
	function generateInfo(url_dom) {
		return {
			name: url_dom.textContent,
			url: url_dom.href,
		};
	}

	const pr_page_config = {
		//
		getFileDiffContainerDomList: () =>
			document.querySelectorAll(".file.js-details-container"),
		expand_and_collapse: {
			//
			getExpandCollaspeButtonContainerDom: () =>
				document.querySelectorAll(".pr-toolbar .js-details-container"),
			expandFileDiff: (file_diff_container_dom) => {
				file_diff_container_dom.classList.add("open");
				file_diff_container_dom.classList.add("Details--on");
			},
			collapseFileDiff: (file_diff_container_dom) => {
				file_diff_container_dom.classList.remove("open");
				file_diff_container_dom.classList.remove("Details--on");
			},
			checkUserComment: (file_diff_container_dom) => {
				let open_comment_count = 0;
				file_diff_container_dom
					.querySelectorAll("details.js-comment-container")
					.forEach((details) => {
						if (details.getAttribute("data-resolved") !== "true") {
							open_comment_count = open_comment_count + 1;
						}
					});

				return open_comment_count;
			},
			checkGitComments: (file_diff_container_dom) =>
				file_diff_container_dom.querySelectorAll(".js-inline-annotations")
					.length > 0,
		},
		file_action: {
			//
			getFileCountDom: () => document.querySelector("#files_tab_counter"),
			getFileActionContainerDom: (file_diff_container_dom) =>
				file_diff_container_dom.querySelector(".file-info"),
			getFileInfo: (file_diff_container_dom) =>
				generateInfo(
					file_diff_container_dom.querySelector(".file-info .Link--primary"),
				),
			getBaseBranchInfo: (_file_diff_container_dom) => {
				const dom = document.querySelector(".base-ref a");
				if (dom != null) {
					return generateInfo(dom);
				}

				const dom_list = document.querySelectorAll(".commit-ref");
				if (dom_list != null && dom_list.length > 1) {
					return generateInfo(dom_list[0]);
				}

				return null;
			},
			getYourBranchInfo: (_file_diff_container_dom) => {
				const dom = document.querySelector(".head-ref a");
				if (dom != null) {
					return generateInfo(dom);
				}

				const dom_list = document.querySelectorAll(".commit-ref");
				if (dom_list != null && dom_list.length > 1) {
					return generateInfo(dom_list[1]);
				}

				return null;
			},
		},
	};

	//
	retry("[expand_colapse]", 30, () => {
		const contains =
			pr_page_config.expand_and_collapse.getExpandCollaspeButtonContainerDom();

		if (contains == null) {
			return retry_again;
		}

		if (contains.length <= 0) {
			return retry_again;
		}

		insert_expand_collapse_buttons(
			pr_page_config.getFileDiffContainerDomList,
			pr_page_config.expand_and_collapse,
		);
		return retry_stop;
	});

	retry("[file_action]", 30, () => {
		const expected_file_count_dom =
			pr_page_config.file_action.getFileCountDom();
		if (!expected_file_count_dom) {
			return retry_again;
		}

		const actual_file_count_dom_list =
			pr_page_config.getFileDiffContainerDomList();
		if (!actual_file_count_dom_list) {
			return retry_again;
		}

		console.log(
			"[file_action] check : expect value = ",
			expected_file_count_dom.textContent,
			"actual value = ",
			actual_file_count_dom_list.length,
		);

		if (
			actual_file_count_dom_list.length <
			Number(expected_file_count_dom.textContent)
		) {
			console.log(
				"[file_action] check : expect value = ",
				expected_file_count_dom.textContent,
				"actual value = ",
				actual_file_count_dom_list.length,
			);
			return retry_again;
		}

		insert_file_action_buttons(
			pr_page_config.getFileDiffContainerDomList,
			pr_page_config.file_action,
		);
		return retry_stop;
	});
})();
