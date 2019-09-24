
function onLoaded() {
	var csInterface = new CSInterface();
	var locale	 	= csInterface.hostEnvironment.appUILocale;
	
	loadJSX();

	// register for messages
	VulcanInterface.addMessageListener(
	    VulcanMessage.TYPE_PREFIX + "com.DVA.message.sendtext",
	    function(message) {
	        var str = VulcanInterface.getPayload(message);
	        // You just received the text of every Text layer in the current AE comp.
	    }
	);

	csInterface.evalScript('$._PPP_.keepPanelLoaded()');
	//csInterface.evalScript('$._PPP_.registerProjectChangedFxn()');					// Project changed
	//csInterface.evalScript('$._PPP_.registerSequenceSelectionChangedFxn()');		// Selection within the active sequence changed
	//csInterface.evalScript('$._PPP_.registerSequenceActivatedFxn()');				// The active sequence changed
	//csInterface.evalScript('$._PPP_.registerActiveSequenceStructureChangedFxn()');	// Clips within the active sequence changed
	//csInterface.evalScript('$._PPP_.registerSequenceMessaging()');			
	csInterface.evalScript('$._PPP_.registerActiveSequenceChangedFxn()');
}

/**
* Load JSX file into the scripting context of the product. All the jsx files in 
* folder [ExtensionRoot]/jsx & [ExtensionRoot]/jsx/[AppName] will be loaded.
*/
function loadJSX() {
	var csInterface = new CSInterface();

	// get the appName of the currently used app. For Premiere Pro it's "PPRO"
	var appName = csInterface.hostEnvironment.appName;
	var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);

	// load general JSX script independent of appName
	var extensionRootGeneral = extensionPath + '/jsx/';
	csInterface.evalScript('$._ext.evalFiles("' + extensionRootGeneral + '")');

	// load JSX scripts based on appName
	var extensionRootApp = extensionPath + '/jsx/' + appName + '/';
	csInterface.evalScript('$._ext.evalFiles("' + extensionRootApp + '")');
}

function evalScript(script, callback) {
	new CSInterface().evalScript(script, callback);
}

function onClickButton(ppid) {
	var extScript = "$._ext_" + ppid + ".run()";
	evalScript(extScript);
}
