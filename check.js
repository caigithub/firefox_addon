function check() {
	const articles = document.querySelectorAll("section");
	for (const article of articles) {
		const text = article.textContent.split("\n")[0].substring(0, 50);

		if (article.getAttribute("data-turn") === "user") {
			console.log(article.getBoundingClientRect().top, "user - ", text);
		} else {
			console.log(article.getBoundingClientRect().top, "assistant - ", text);
		}
	}

	console.log("==================");
	const viewport = document.querySelector(".\\@container\\/main");
	console.log(viewport.getBoundingClientRect().top);
}

check();
