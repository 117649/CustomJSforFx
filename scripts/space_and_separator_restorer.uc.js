// Restore 'Space & Separator' items script for Firefox 60+ by Aris
//
// Default browser scripts always remove spaces and separators from default palette, so
// because of that they are added to an own toolbar now.
//
// - spaces and separators can be moved to any toolbar
// - to remove spaces or separators move them into palette
// - configuration toolbar behaves like a default toolbar, items and buttons can be placed on it
// - configuration toolbar is not visible outside customizing mode
// - default "Flexible Space" item is hidden from palette and added to configuration toolbar
// [!] BUG: do not move spaces, flexible spaces or separator to configuration toolbar or it will cause glitches
// [!] BUG: do not move 'main space' item to palette or it will get lost until next time customizing mode gets opened


Components.utils.import("resource:///modules/CustomizableUI.jsm");
var {Services} = Components.utils.import("resource://gre/modules/Services.jsm", {});

var AddSeparator = {
  init: function() {
	  
	var tb_config_label = "Configuration Toolbar";
	var tb_spacer_label = "Space";
	var tb_sep_label = "Separator";
	var tb_spring_label = "Flexible Space";
  
	try {
		
	  var tb_config = document.createElement("toolbar");
	  tb_config.setAttribute("id","configuration_toolbar");
	  tb_config.setAttribute("customizable","true");
	  tb_config.setAttribute("class","toolbar-primary chromeclass-toolbar");
	  tb_config.setAttribute("mode","icons");
	  tb_config.setAttribute("iconsize","small");
	  tb_config.setAttribute("toolboxid","navigator-toolbox");
	  tb_config.setAttribute("context","toolbar-context-menu");
	  tb_config.setAttribute("toolbarname", tb_config_label);
	  tb_config.setAttribute("label", tb_config_label);
	  tb_config.setAttribute("lockiconsize","true");
	  tb_config.setAttribute("defaultset","toolbarspacer,toolbarseparator");
	  
	  document.querySelector('#navigator-toolbox').appendChild(tb_config);
	  
	  
	  var tb_label = document.createElement("label");
	  tb_label.setAttribute("label", tb_config_label+": ");
	  tb_label.setAttribute("value", tb_config_label+": ");
	  tb_label.setAttribute("id","tb_config_tb_label");
	  tb_label.setAttribute("removable","false");
	  
	  tb_config.appendChild(tb_label);
	  
	  
	  var tb_spacer = document.createElement("toolbarspacer");
	  tb_spacer.setAttribute("id","spacer");
	  tb_spacer.setAttribute("class","chromeclass-toolbar-additional");
	  tb_spacer.setAttribute("customizableui-areatype","toolbar");
	  tb_spacer.setAttribute("removable","false");
	  tb_spacer.setAttribute("label", tb_spacer_label);
	  
	  tb_config.appendChild(tb_spacer);
	
	  
	  var tb_sep = document.createElement("toolbarseparator");
	  tb_sep.setAttribute("id","separator");
	  tb_sep.setAttribute("class","chromeclass-toolbar-additional");
	  tb_sep.setAttribute("customizableui-areatype","toolbar");
	  tb_sep.setAttribute("removable","false");
	  tb_sep.setAttribute("label", tb_sep_label);
	  	  
	  tb_config.appendChild(tb_sep);
	  
	 
	  var tb_spring = document.createElement("toolbarspring");
	  tb_spring.setAttribute("id","spring");
	  tb_spring.setAttribute("class","chromeclass-toolbar-additional");
	  tb_spring.setAttribute("customizableui-areatype","toolbar");
	  tb_spring.setAttribute("removable","false");
	  tb_spring.setAttribute("label", tb_spring_label);
	  	  
	  tb_config.appendChild(tb_spring);

	  
	  // CSS
	  var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

	  var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent('\
	  \
		#configuration_toolbar { \
	      -moz-appearance: none !important; \
		  background-color: var(--toolbar-bgcolor); \
		  background-image: var(--toolbar-bgimage); \
		  background-clip: padding-box; \
		  color: var(--toolbar-color, inherit); \
		} \
		#main-window:not([customizing]) #configuration_toolbar { \
		  visibility: collapse; \
		}\
		#main-window[customizing] #configuration_toolbar #tb_config_tb_label { \
		  font-weight: bold !important; \
		}\
		#main-window[customizing] #configuration_toolbar :-moz-any(#spacer,#separator,#spring) { \
		  -moz-margin-start: 20px; \
		}\
		#main-window[customizing] #configuration_toolbar :-moz-any(#wrapper-spacer,#wrapper-separator,#wrapper-spring) .toolbarpaletteitem-label { \
		  display: block !important; \
		  -moz-margin-end: 20px; \
		}\
		#main-window[customizing] #wrapper-spacer #spacer { \
		  margin: 2px 0 !important; \
		}\
		#main-window[customizing] #configuration_toolbar #wrapper-spring #spring { \
		  margin: -1px 0 !important; \
		  min-width: 80px !important; \
		}\
		#main-window[customizing] #configuration_toolbar > * { \
		  padding: 10px !important; \
		}\
		#main-window[customizing] #configuration_toolbar > :-moz-any(#wrapper-spacer,#wrapper-separator,#wrapper-spring) { \
		  border: 1px dotted !important; \
		  -moz-margin-start: 2px !important; \
		  -moz-margin-end: 2px !important; \
		}\
		#main-window[customizing] toolbarspacer { \
		  border: 1px solid !important; \
		}\
		toolbar[orient="vertical"] toolbarseparator { \
		  -moz-appearance: none !important; \
		  border-bottom: 1px solid !important; \
		  margin: 1px 2px !important; \
		  height: 1px !important; \
		  width: 18px !important; \
		}\
		toolbar[orient="vertical"] toolbarspacer { \
		  -moz-appearance: none !important; \
		  height: 18px !important; \
		  width: 18px !important; \
		}\
		#customization-palette toolbarpaletteitem[id^="wrapper-customizableui-special-spring"], \
		#customization-palette-container :-moz-any(#spring,#wrapper-spring) { \
		  display: none !important; \
		}\
	  \
	  '), null, null);

	  sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
	
	} catch(e){}	

  }

}

setTimeout(function(){
  AddSeparator.init();
},500);
