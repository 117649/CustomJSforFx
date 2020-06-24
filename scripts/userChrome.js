// 'Alternative search bar' script for Firefox 60-68 by Aris
//
// Initial search modification script was based on 'search revert' script by '2002Andreas':
// https://www.camp-firefox.de/forum/viewtopic.php?f=16&t=112673&start=2010#p1099758
//
// Initial "old search" script ported from old Firefox versions by Aris
//
// Feature: search glass is always visible at search bars end (like with old search)
// Feature: search button shows current search engines icon (like with old search)
// Feature: search buttons dropmarker is always visible (like with old search)
//
// Option: clear search input after search
// Option: revert to first search engine in list after search
// Option: old search engine selection popup ([!] FIREFOX 64-68 only [!])
// Option: hide 'add engines' '+' indicator
// Option: hide 'oneoff' search engines (engines at popups bottom)
// Option: hide placeholder text 'Search'
// Option: swap the icons of search engine button and go button
// Option: show search engine names instead of icons only
// Option: select search engine by scrolling mouse wheel over search bars button
// Option: hide popup when using 'CTRL or MOUSE WHEEL + UP&DOWN keys' to switch engine
//
// [!] Option 'old search engine selection popup': the menuitem to add new new search engine is not present!
//     Use menuitem inside default popup instead.
// [!] Default browser feature: if search bar is focused with 'CTRL + K' or 'CTRL + E', one can switch 
//     through search engines with 'CTRL + UP&DOWN keys' and 'CTRL + MOUSE WHEELs UP&DOWN scrolling'! 
// [!] Default browser feature: search engine can be changed inside default/modern popup by right-clicking
//     search icon and selecting 'Set As Default Search Engine' menuitem


// Configuration area - start (all false beside last by default)
var clear_searchbar_after_search = false; // clear input after search (true) or not (false)
var revert_to_first_engine_after_search = false; // revert to first engine (true) or not (false)
var select_engine_by_scrolling_over_button = true; // select search engine by scrolling mouse wheel over search bars button (true) or not (false)
var hide_oneoff_search_engines = false; // hide 'one off' search engines (true) or not (false)
var hide_addengines_plus_indicator = false; // hide add engines '+' sign (true) or not (false)
var hide_placeholder = false; // hide placeholder (true) or not (false)
var switch_glass_and_engine_icon = false; // swap icons of search engine button and go button (true) or not (false)
var show_search_engine_names = false; // show search engine names (true) or not (false)
var show_search_engine_names_with_scrollbar = false; // show search engine names with scrollbars (true) or not (false)
var show_search_engine_names_with_scrollbar_height = '170px'; // higher values show more search engines
var initialization_delay_value = 1000; // some systems might require a higher value than '1' second (=1000ms) and on some even '0' is enough
var searchsettingslabel = "Search Settings";
var hide_popup_when_selecting_engine_with_hotkeys = true; // hide popup when using 'CTRL or MOUSE WHEEL + UP&DOWN keys' to switch engine (true) or not (false)

var select_engine_by_click_oneoffs_button = true;
// Configuration area - end

var isInCustomize = 1; //start at 1 to set it once at startup

var AltSearchbar = {
	init: async function () {

		await until(_ => Services.search.isInitialized == true);

		function until(conditionFunction) {

			const poll = resolve => {
				if (conditionFunction()) resolve();
				else setTimeout(_ => { console.log('waiting'); poll(resolve); }, 400);
			}

			return new Promise(poll);
		}

		// setTimeout(function () {
		try {
			var searchbar = document.getElementById("searchbar");
			var appversion = parseInt(Services.appinfo.version);

			updateStyleSheet();

			if (hide_placeholder)
				hideSearchbarsPlaceholder();

			if (select_engine_by_scrolling_over_button)
				selectEngineByScrollingOverButton();

			if (select_engine_by_click_oneoffs_button)
				selectEngineByClickOneoffsButton();

			// select search engine by scrolling mouse wheel over search bars button
			function selectEngineByScrollingOverButton() {
				searchbar.addEventListener("DOMMouseScroll", (event) => {
					if (event.originalTarget.classList.contains("searchbar-search-button")) {
						searchbar.selectEngine(event, event.detail > 0);
					}
				}, true);
			};

			// left click on off select engine
			function selectEngineByClickOneoffsButton() {
				var searchoneoffs = searchbar.textbox.popup.oneOffButtons;
				searchoneoffs.buttons.addEventListener("click", (event) => {
					if (!(event instanceof KeyboardEvent) && (event.button == 0)) {
						event.stopPropagation();
						event.target.setAttribute("anonid", "search-one-offs-context-set-default");
						searchoneoffs._contextEngine = event.target.engine;

						// searchoneoffs.oncommand(event);

						let currentEngine = Services.search.currentEngine;

						if (!searchoneoffs.getAttribute("includecurrentengine")) {
							// Make the target button of the context menu reflect the current
							// search engine first. Doing this as opposed to rebuilding all the
							// one-off buttons avoids flicker.
							let button = searchoneoffs._buttonForEngine(searchoneoffs._contextEngine);
							button.id = searchoneoffs._buttonIDForEngine(currentEngine);
							let uri = "chrome://browser/skin/search-engine-placeholder.png";
							if (currentEngine.iconURI)
								uri = currentEngine.iconURI.spec;
							button.setAttribute("image", uri);
							button.setAttribute("tooltiptext", currentEngine.name);
							button.engine = currentEngine;
						}

						Services.search.currentEngine = searchoneoffs._contextEngine;
						searchoneoffs._contextEngine = null;
						
					}
				}, true);
			};

			// hide placeholder
			function hideSearchbarsPlaceholder() {
				searchbar.getElementsByClassName('searchbar-textbox')[0].removeAttribute("placeholder");
			};



			// setIcon function taken from browsers internal 'searchbar.js' file and added modifications
			searchbar.setIcon = function (element, uri) {
				element.setAttribute("src", uri);
				updateStyleSheet();
			};

			// override selectEngine function and remove automatic popup opening
			if (hide_popup_when_selecting_engine_with_hotkeys) searchbar.selectEngine = async function (aEvent, isNextEngine) {

				// Stop event bubbling now, because the rest of this method is async.
				aEvent.preventDefault();
				aEvent.stopPropagation();

				// Find the new index.
				let engines = await this.engines;
				let currentName = this.currentEngine.name;
				let newIndex = -1;
				let lastIndex = engines.length - 1;
				for (let i = lastIndex; i >= 0; --i) {
					if (engines[i].name == currentName) {
						// Check bounds to cycle through the list of engines continuously.
						if (!isNextEngine && i == 0) {
							newIndex = lastIndex;
						} else if (isNextEngine && i == lastIndex) {
							newIndex = 0;
						} else {
							newIndex = i + (isNextEngine ? 1 : -1);
						}
						break;
					}
				}

				this.currentEngine = engines[newIndex];
			};

			// main style sheet
			function updateStyleSheet() {
				var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
				console.log(appversion)
				var hide_oneoff_search_engines_code = '';
				var show_search_engine_names_code = '';
				var show_search_engine_names_with_scrollbar_code = '';
				var hide_addengines_plus_indicator_code = '';
				var switch_glass_and_engine_icon_code = '';

				if (hide_oneoff_search_engines)
					hide_oneoff_search_engines_code = ' \
		  #PopupSearchAutoComplete .search-panel-header, \
		  #PopupSearchAutoComplete .search-one-offs { \
			display: none !important; \
		  } \
		';

				if (hide_addengines_plus_indicator)
					hide_addengines_plus_indicator_code = ' \
	     .searchbar-search-button[addengines=true]::after { \
		   visibility: hidden !important; \
		 } \
	   ';

				if (show_search_engine_names && !hide_oneoff_search_engines && appversion < 66)
					show_search_engine_names_code = ' \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) { \
		  display: block !important; \
		  width: 100% !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) > * { \
		  width: 100%; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item { \
		  -moz-appearance:none !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  border: unset !important; \
		  height: 22px !important; \
		  background-image: unset !important; \
		  -moz-padding-start: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item:not([tooltiptext]) { \
		  display: none !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item .button-box { \
		  position: absolute !important; \
		  -moz-padding-start: 4px !important; \
		  margin-top: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item::after { \
		  -moz-appearance: none !important; \
		  display: inline !important; \
		  content: attr(tooltiptext) !important; \
		  position: relative !important; \
		  top: -9px !important; \
		  -moz-padding-start: 25px !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  white-space: nowrap !important; \
		} \
		';

				if (show_search_engine_names && !hide_oneoff_search_engines && appversion >= 66 && appversion < 70)
					show_search_engine_names_code = ' \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) { \
		  display: block !important; \
		  width: 100% !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) > * { \
		  width: 100%; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item { \
		  -moz-appearance:none !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  border: unset !important; \
		  height: 22px !important; \
		  background-image: unset !important; \
		  -moz-padding-start: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item:not([tooltiptext]) { \
		  display: none !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item .button-box { \
		  position: absolute !important; \
		  -moz-padding-start: 4px !important; \
		  margin-top: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item::after { \
		  -moz-appearance: none !important; \
		  display: inline !important; \
		  content: attr(tooltiptext) !important; \
		  position: relative !important; \
		  top: -9px !important; \
		  -moz-padding-start: 25px !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  white-space: nowrap !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="21"] { \
		  min-height: 21px !important; \
		  height: 21px !important; \
		  max-height: 21px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="42"] { \
		  min-height: 42px !important; \
		  height: 42px !important; \
		  max-height: 42px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="63"] { \
		  min-height: 63px !important; \
		  height: 63px !important; \
		  max-height: 63px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="84"] { \
		  min-height: 84px !important; \
		  height: 84px !important; \
		  max-height: 84px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="105"] { \
		  min-height: 105px !important; \
		  height: 105px !important; \
		  max-height: 105px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="126"] { \
		  min-height: 126px !important; \
		  height: 126px !important; \
		  max-height: 126px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="147"] { \
		  min-height: 147px !important; \
		  height: 147px !important; \
		  max-height: 147px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="168"] { \
		  min-height: 168px !important; \
		  height: 168px !important; \
		  max-height: 168px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="189"] { \
		  min-height: 189px !important; \
		  height: 189px !important; \
		  max-height: 189px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="210"] { \
		  min-height: 210px !important; \
		  height: 210px !important; \
		  max-height: 210px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree scrollbar { \
		  display: none !important; \
		  visibility: collapse !important; \
		  opacity: 0 !important; \
		} \
		';

				if (show_search_engine_names && !hide_oneoff_search_engines && appversion >= 70)
					show_search_engine_names_code = ' \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item { \
		  -moz-appearance:none !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  border: unset !important; \
		  height: 22px !important; \
		  background-image: unset !important; \
		  -moz-padding-start: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item:not([tooltiptext]) { \
		  display: none !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item .button-box { \
		  position: absolute !important; \
		  -moz-padding-start: 4px !important; \
		  margin-top: 3px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs .searchbar-engine-one-off-item::after { \
		  -moz-appearance: none !important; \
		  display: inline !important; \
		  content: attr(tooltiptext) !important; \
		  position: relative !important; \
		  top: -9px !important; \
		  -moz-padding-start: 25px !important; \
		  min-width: 0 !important; \
		  width: 100% !important; \
		  white-space: nowrap !important; \
		} \
		#PopupSearchAutoComplete .search-panel-one-offs { \
		  min-height: unset !important; \
		  height: unset !important; \
		  max-height: unset !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) { \
		  width: 100% !important; \
		  display: block !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree:not([collapsed="true"]) > * { \
		  width: 100%; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="18"] { \
		  min-height: 18px !important; \
		  height: 18px !important; \
		  max-height: 18px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="36"] { \
		  min-height: 36px !important; \
		  height: 36px !important; \
		  max-height: 36px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="54"] { \
		  min-height: 54px !important; \
		  height: 54px !important; \
		  max-height: 54px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="72"] { \
		  min-height: 72px !important; \
		  height: 72px !important; \
		  max-height: 72px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="90"] { \
		  min-height: 90px !important; \
		  height: 90px !important; \
		  max-height: 90px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="108"] { \
		  min-height: 108px !important; \
		  height: 108px !important; \
		  max-height: 108px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="126"] { \
		  min-height: 126px !important; \
		  height: 126px !important; \
		  max-height: 126px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="144"] { \
		  min-height: 144px !important; \
		  height: 144px !important; \
		  max-height: 144px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="162"] { \
		  min-height: 162px !important; \
		  height: 162px !important; \
		  max-height: 162px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree[height="180"] { \
		  min-height: 180px !important; \
		  height: 180px !important; \
		  max-height: 180px !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree scrollbar { \
		  display: none !important; \
		  visibility: collapse !important; \
		  opacity: 0 !important; \
		} \
		#PopupSearchAutoComplete .search-panel-tree { \
		  overflow-y: hidden !important; \
		} \
   		';

				if (show_search_engine_names_with_scrollbar && !hide_oneoff_search_engines && show_search_engine_names)
					show_search_engine_names_with_scrollbar_code = ' \
		#PopupSearchAutoComplete .search-one-offs { \
		  height: '+ show_search_engine_names_with_scrollbar_height + ' !important; \
		  max-height: '+ show_search_engine_names_with_scrollbar_height + ' !important; \
		  overflow-y: scroll !important; \
		  overflow-x: hidden !important; \
		} \
		\
		';

				if (switch_glass_and_engine_icon)
					switch_glass_and_engine_icon_code = ' \
		.search-go-button { \
		  list-style-image: url('+ document.getElementById("searchbar").currentEngine.iconURI.spec + ') !important; \
		  transform: scaleX(1) !important; \
		} \
		.searchbar-search-button { \
		  list-style-image: url("chrome://browser/skin/search-glass.svg") !important; \
		  -moz-context-properties: fill, fill-opacity !important; \
		  fill-opacity: 1.0 !important; \
		  fill: #3683ba !important; \
		} \
		.searchbar-search-button:hover { \
		  fill: #1d518c !important; \
		} \
		.searchbar-search-button:active { \
		  fill: #00095d !important; \
		} \
		\
		';

				var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(' \
		\
		#searchbuttonpopup {\
		  -moz-margin-start: -1px; \
		} \
		.searchbar-search-button { \
		  list-style-image: url('+ document.getElementById("searchbar").currentEngine.iconURI.spec + ') !important; \
		  -moz-image-region: unset !important; \
		} \
		.search-go-button { \
		  list-style-image: url("chrome://browser/skin/search-glass.svg") !important; \
		  -moz-context-properties: fill, fill-opacity !important; \
		  fill-opacity: 1.0 !important; \
		  fill: #3683ba !important; \
		  transform: scaleX(-1) !important; \
		  background: unset !important; \
		  margin-inline-end: 4px !important; \
		} \
		.search-go-button:hover { \
		  fill: #1d518c !important; \
		} \
		.search-go-button:active { \
		  fill: #00095d !important; \
		} \
		.search-go-button[hidden="true"] { \
		  display: block !important; \
		} \
		.searchbar-search-button[addengines=true] > .searchbar-search-icon-overlay, \
		.searchbar-search-button:not([addengines=true]) > .searchbar-search-icon-overlay { \
		  list-style-image: url("chrome://global/skin/icons/arrow-dropdown-12.svg") !important; \
		  -moz-context-properties: fill !important; \
		  margin-inline-start: -6px !important; \
		  margin-inline-end: 2px !important; \
		  width: 11px !important; \
		  height: 11px !important; \
		} \
		.searchbar-search-button[addengines=true] > .searchbar-search-icon-overlay { \
		  margin-top: 0px !important; \
		} \
		.searchbar-search-button[addengines=true]::after { \
		  content: " " !important; \
		  background: url("chrome://browser/skin/search-indicator-badge-add.svg") center no-repeat !important; \
		  display: block !important; \
		  visibility: visible !important; \
		  width: 11px !important; \
		  height: 11px !important; \
		  -moz-margin-start: 18px !important; \
		  margin-top: -11px !important; \
		  position: absolute !important; \
		} \
		.searchbar-search-button[addengines=true] > .searchbar-search-icon-overlay { \
		  visibility: visible !important; \
		} \
		'+ hide_addengines_plus_indicator_code + ' \
		'+ hide_oneoff_search_engines_code + ' \
		'+ show_search_engine_names_code + ' \
		'+ show_search_engine_names_with_scrollbar_code + ' \
		'+ switch_glass_and_engine_icon_code + ' \
		\
	  '), null, null);
	  console.log(uri)
				// remove old style sheet
				if (sss.sheetRegistered(uri, sss.AGENT_SHEET)) {
					sss.unregisterSheet(uri, sss.AGENT_SHEET);
				}

				sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

			};

		} catch (e) { console.log(e) }
		// }, 1000);

	}
}

/* initialization delay workaround */
document.addEventListener("DOMContentLoaded", AltSearchbar.init(), false);
