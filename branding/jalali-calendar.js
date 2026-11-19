/*
 * Jalali calendar overlay for Paca.
 *
 * Paca's date picker (react-day-picker) renders Gregorian months, but each day
 * button already carries its Jalali date in `data-day` (e.g. ۱۴۰۵/۸/۲۶). This
 * script hides the Gregorian grid and renders a Jalali month grid in the same
 * popover. Clicking a Jalali day forwards the click to the corresponding
 * hidden day button, so Paca's own range/single selection logic keeps working.
 */
(function () {
	if (typeof window === "undefined") return;

	var FA = "۰۱۲۳۴۵۶۷۸۹";
	var AR = "٠١٢٣٤٥٦٧٨٩";
	var MONTHS = [
		"فروردین",
		"اردیبهشت",
		"خرداد",
		"تیر",
		"مرداد",
		"شهریور",
		"مهر",
		"آبان",
		"آذر",
		"دی",
		"بهمن",
		"اسفند",
	];
	var WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]; // Saturday-first

	function div(a, b) {
		return ~~(a / b);
	}
	function mod(a, b) {
		return a - ~~(a / b) * b;
	}
	function toEn(value) {
		return String(value)
			.replace(/[۰-۹]/g, function (d) {
				return FA.indexOf(d);
			})
			.replace(/[٠-٩]/g, function (d) {
				return AR.indexOf(d);
			});
	}
	function faNum(value) {
		return String(value).replace(/\d/g, function (d) {
			return FA[Number(d)];
		});
	}

	// ── jalaali-js calendar math ─────────────────────────────────────────────
	var BREAKS = [
		-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
		2192, 2262, 2324, 2394, 2456, 3178,
	];

	function jalCal(jy, withoutLeap) {
		var bl = BREAKS.length,
			gy = jy + 621,
			leapJ = -14,
			jp = BREAKS[0],
			jm,
			jump,
			leap,
			leapG,
			march,
			n,
			i;

		for (i = 1; i < bl; i += 1) {
			jm = BREAKS[i];
			jump = jm - jp;
			if (jy < jm) break;
			leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
			jp = jm;
		}
		n = jy - jp;
		leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
		if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
		leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
		march = 20 + leapJ - leapG;

		if (!withoutLeap) {
			if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
			leap = mod(mod(n + 1, 33) - 1, 4);
			if (leap === -1) leap = 4;
		}
		return { leap: leap, gy: gy, march: march };
	}

	function g2d(gy, gm, gd) {
		var d =
			div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
			div(153 * mod(gm + 9, 12) + 2, 5) +
			gd -
			34840408;
		d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
		return d;
	}

	function d2g(jdn) {
		var j, i, gd, gm, gy;
		j = 4 * jdn + 139361631;
		j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
		i = div(mod(j, 1461), 4) * 5 + 308;
		gd = div(mod(i, 153), 5) + 1;
		gm = mod(div(i, 153), 12) + 1;
		gy = div(j, 1461) - 100100 + div(8 - gm, 6);
		return { gy: gy, gm: gm, gd: gd };
	}

	function j2d(jy, jm, jd) {
		var r = jalCal(jy, true);
		return (
			g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
		);
	}

	function d2j(jdn) {
		var gy = d2g(jdn).gy,
			jy = gy - 621,
			r = jalCal(jy, false),
			jdn1f = g2d(gy, 3, r.march),
			jd,
			jm,
			k;

		k = jdn - jdn1f;
		if (k >= 0) {
			if (k <= 185) {
				jm = 1 + div(k, 31);
				jd = mod(k, 31) + 1;
				return { jy: jy, jm: jm, jd: jd };
			}
			k -= 186;
		} else {
			jy -= 1;
			k += 179;
			if (r.leap === 1) k += 1;
		}
		jm = 7 + div(k, 30);
		jd = mod(k, 30) + 1;
		return { jy: jy, jm: jm, jd: jd };
	}

	function monthLength(jy, jm) {
		var ny = jm === 12 ? jy + 1 : jy;
		var nm = jm === 12 ? 1 : jm + 1;
		return j2d(ny, nm, 1) - j2d(jy, jm, 1);
	}

	function weekdayOf(jy, jm, jd) {
		var g = d2g(j2d(jy, jm, jd));
		// JS getDay(): 0 = Sunday. Persian week starts on Saturday → 0.
		return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
	}

	function todayJalali() {
		var parts = new Intl.DateTimeFormat("fa-IR", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
		}).formatToParts(new Date());
		var get = function (type) {
			var p = parts.find(function (x) {
				return x.type === type;
			});
			return Number(toEn(p ? p.value : "0"));
		};
		return { jy: get("year"), jm: get("month"), jd: get("day") };
	}

	function parseDay(value) {
		var m = toEn(value).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
		if (!m) return null;
		return { jy: Number(m[1]), jm: Number(m[2]), jd: Number(m[3]) };
	}

	function dayKey(jy, jm, jd) {
		return jy + "/" + jm + "/" + jd;
	}

	function dayNumber(jy, jm, jd) {
		return jy * 10000 + jm * 100 + jd;
	}

	// ── styling ─────────────────────────────────────────────────────────────
	var CSS = [
		".kf-jcal{width:300px;max-width:100%;padding:8px;color:var(--foreground,#111827);font-family:inherit}",
		".kf-jcal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}",
		".kf-jcal-title{font-size:14px;font-weight:700;color:var(--foreground,#111827)}",
		".kf-jcal-nav{width:28px;height:28px;border:1px solid var(--border,#e5e7eb);border-radius:8px;background:transparent;color:var(--foreground,#111827);cursor:pointer;font-family:inherit;line-height:1}",
		".kf-jcal-nav:hover{background:var(--muted,#f3f4f6)}",
		".kf-jcal-week{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px}",
		".kf-jcal-week span{text-align:center;font-size:11px;color:var(--muted-foreground,#6b7280);padding:2px 0}",
		".kf-jcal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}",
		".kf-jcal-day{height:34px;border:0;border-radius:8px;background:transparent;color:var(--foreground,#111827);font-family:inherit;font-size:12px;cursor:pointer;font-variant-numeric:tabular-nums}",
		".kf-jcal-day:hover{background:var(--muted,#f3f4f6)}",
		".kf-jcal-day.today{box-shadow:inset 0 0 0 1px var(--primary,#4f46e5)}",
		".kf-jcal-day.selected,.kf-jcal-day.range-start,.kf-jcal-day.range-end{background:var(--primary,#4f46e5);color:var(--primary-foreground,#fff);font-weight:700}",
		".kf-jcal-day.range-middle{background:color-mix(in oklab,var(--primary,#4f46e5) 14%,transparent)}",
		".kf-jcal-day:disabled{opacity:.3;cursor:default}",
		".kf-jcal-empty{height:34px}",
	].join("");

	function ensureCss() {
		if (document.getElementById("kf-jcal-css")) return;
		var style = document.createElement("style");
		style.id = "kf-jcal-css";
		style.textContent = CSS;
		(document.head || document.documentElement).appendChild(style);
	}

	// ── calendar enhancement ────────────────────────────────────────────────
	function hiddenDays(root) {
		var map = new Map();
		var buttons = root.querySelectorAll("[data-day]");
		for (var i = 0; i < buttons.length; i++) {
			var parsed = parseDay(buttons[i].getAttribute("data-day"));
			if (parsed) {
				map.set(dayKey(parsed.jy, parsed.jm, parsed.jd), buttons[i]);
			}
		}
		return map;
	}

	function selectedEntry(root) {
		var b = root.querySelector(
			'[data-selected-single="true"],[data-range-start="true"],[data-range-end="true"]',
		);
		if (!b) return null;
		return parseDay(b.getAttribute("data-day"));
	}

	function enhance(root) {
		if (root.__kfJalali) return;
		var parent = root.parentElement;
		if (!parent) return;
		root.__kfJalali = true;
		ensureCss();

		root.style.display = "none";

		// Remove stale boxes left behind by earlier enhancements/re-renders.
		parent.querySelectorAll(":scope > .kf-jcal").forEach(function (b) {
			if (!b.__kfFor || b.__kfFor === root || !b.__kfFor.isConnected) {
				b.remove();
			}
		});

		var box = document.createElement("div");
		box.className = "kf-jcal";
		box.setAttribute("dir", "rtl");
		box.__kfFor = root;
		parent.insertBefore(box, root);

		var state = { root: root, box: box, jy: 0, jm: 0, attempts: 0 };
		root.__kfJalaliState = state;

		var sel = selectedEntry(root) || todayJalali();
		state.jy = sel.jy;
		state.jm = sel.jm;

		render(state);
	}

	function clickHiddenNav(root, direction) {
		var label =
			direction > 0 ? "Go to the Next Month" : "Go to the Previous Month";
		var btn = root.querySelector('[aria-label="' + label + '"]');
		if (btn && !btn.disabled) {
			btn.click();
			return true;
		}
		return false;
	}

	function render(state) {
		var root = state.root;
		if (!root.isConnected) return;

		var map = hiddenDays(root);
		var length = monthLength(state.jy, state.jm);
		var targetStart = dayNumber(state.jy, state.jm, 1);
		var targetEnd = dayNumber(state.jy, state.jm, length);

		var min = Infinity;
		var max = -Infinity;
		map.forEach(function (_btn, key) {
			var p = key.split("/").map(Number);
			var n = dayNumber(p[0], p[1], p[2]);
			if (n < min) min = n;
			if (n > max) max = n;
		});

		// The hidden Gregorian picker shows two months. Move it until the
		// requested Jalali month is fully covered.
		if (min !== Infinity && state.attempts < 12) {
			if (targetStart < min) {
				state.attempts++;
				if (clickHiddenNav(root, -1)) {
					setTimeout(function () {
						render(state);
					}, 60);
					return;
				}
			} else if (targetEnd > max) {
				state.attempts++;
				if (clickHiddenNav(root, 1)) {
					setTimeout(function () {
						render(state);
					}, 60);
					return;
				}
			}
		}

		var today = todayJalali();

		var html = [];
		html.push('<div class="kf-jcal-head">');
		html.push(
			'<button type="button" class="kf-jcal-nav" data-kf-nav="-1" aria-label="ماه قبل">‹</button>',
		);
		html.push(
			'<span class="kf-jcal-title">' +
				MONTHS[state.jm - 1] +
				" " +
				faNum(state.jy) +
				"</span>",
		);
		html.push(
			'<button type="button" class="kf-jcal-nav" data-kf-nav="1" aria-label="ماه بعد">›</button>',
		);
		html.push("</div>");
		html.push('<div class="kf-jcal-week">');
		for (var w = 0; w < 7; w++) html.push("<span>" + WEEKDAYS[w] + "</span>");
		html.push("</div>");
		html.push('<div class="kf-jcal-grid">');

		var leading = weekdayOf(state.jy, state.jm, 1);
		for (var e = 0; e < leading; e++) {
			html.push('<span class="kf-jcal-empty"></span>');
		}

		for (var d = 1; d <= length; d++) {
			var key = dayKey(state.jy, state.jm, d);
			var btn = map.get(key);
			var classes = ["kf-jcal-day"];
			if (
				d === today.jd &&
				state.jm === today.jm &&
				state.jy === today.jy
			) {
				classes.push("today");
			}
			if (btn) {
				if (btn.getAttribute("data-selected-single") === "true")
					classes.push("selected");
				if (btn.getAttribute("data-range-start") === "true")
					classes.push("range-start");
				if (btn.getAttribute("data-range-end") === "true")
					classes.push("range-end");
				if (btn.getAttribute("data-range-middle") === "true")
					classes.push("range-middle");
				if (btn.getAttribute("data-selected") === "true" && !btn.getAttribute("data-selected-single"))
					classes.push("selected");
			}
			html.push(
				'<button type="button" class="' +
					classes.join(" ") +
					'" data-kf-day="' +
					key +
					'"' +
					(btn ? "" : " disabled") +
					'>' +
					faNum(d) +
					"</button>",
			);
		}
		html.push("</div>");
		state.box.innerHTML = html.join("");

		// header navigation
		var navs = state.box.querySelectorAll("[data-kf-nav]");
		for (var n = 0; n < navs.length; n++) {
			navs[n].addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				var delta = Number(this.getAttribute("data-kf-nav"));
				state.jm += delta;
				if (state.jm < 1) {
					state.jm = 12;
					state.jy -= 1;
				} else if (state.jm > 12) {
					state.jm = 1;
					state.jy += 1;
				}
				state.attempts = 0;
				render(state);
			});
		}

		// day selection: forward to Paca's hidden Gregorian picker
		var dayButtons = state.box.querySelectorAll("[data-kf-day]");
		for (var b = 0; b < dayButtons.length; b++) {
			dayButtons[b].addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				var day = this.getAttribute("data-kf-day");
				var currentMap = hiddenDays(root);
				var hidden = currentMap.get(day);
				if (!hidden) return;
				hidden.click();
				setTimeout(function () {
					render(state);
				}, 80);
				setTimeout(function () {
					render(state);
				}, 260);
			});
		}

		// Paca updates the hidden day attributes after a selection; mirror them.
		if (!state.observer) {
			state.observer = new MutationObserver(function () {
				clearTimeout(state.timer);
				state.timer = setTimeout(function () {
					render(state);
				}, 40);
			});
			state.observer.observe(root, {
				attributes: true,
				subtree: true,
				attributeFilter: [
					"data-selected",
					"data-selected-single",
					"data-range-start",
					"data-range-end",
					"data-range-middle",
				],
			});
		}
	}

	// ── mount observer ──────────────────────────────────────────────────────
	function scan() {
		if (document.documentElement.lang !== "fa") return;

		// Drop overlays whose calendar root has been replaced/unmounted.
		document.querySelectorAll(".kf-jcal").forEach(function (b) {
			if (b.__kfFor && !b.__kfFor.isConnected) b.remove();
		});

		var roots = document.querySelectorAll('[data-slot="calendar"]');
		for (var i = 0; i < roots.length; i++) {
			var root = roots[i];
			if (root.__kfJalali) {
				var st = root.__kfJalaliState;
				if (st && st.box.isConnected && root.isConnected) {
					if (!st.box.firstChild && root.querySelector("[data-day]")) {
						render(st);
					}
					continue;
				}
				root.__kfJalali = false;
				root.__kfJalaliState = null;
			}
			if (root.getClientRects().length === 0) {
				setTimeout(scan, 80);
				continue;
			}
			if (root.querySelector("[data-day]")) {
				enhance(root);
			} else {
				(function (r) {
					setTimeout(function () {
						if (!r.__kfJalali && r.querySelector("[data-day]")) {
							enhance(r);
						}
					}, 40);
				})(root);
			}
		}
	}

	function init() {
		scan();
		var observer = new MutationObserver(function () {
			scan();
		});
		observer.observe(document.body, { childList: true, subtree: true });
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
