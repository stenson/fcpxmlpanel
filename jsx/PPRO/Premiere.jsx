/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2014 Adobe Inc.
* All Rights Reserved.
*
* NOTICE: Adobe permits you to use, modify, and distribute this file in
* accordance with the terms of the Adobe license agreement accompanying
* it. If you have received this file from a source other than Adobe,
* then your use, modification, or distribution of it requires the prior
* written permission of Adobe. 
**************************************************************************/
#include "PPro_API_Constants.jsx"

$._PPP_={

	keepPanelLoaded: function () {
		app.setExtensionPersistent("com.robstenson.FCPXMLPanel", 0); // 0, while testing (to enable rapid reload); 1 for "Never unload me, even when not visible."
	},

	getSep: function () {
		if (Folder.fs === 'Macintosh') {
			return '/';
		} else {
			return '\\';
		}
	},

	saveProject: function () {
		app.project.save();
	},

	getActiveSequenceName: function () {
		if (app.project.activeSequence) {
			return app.project.activeSequence.name;
		} else {
			return "No active sequence.";
		}
	},

	exportFCPXML: function () {
		if (app.project.activeSequence) {
			var projPath = new File(app.project.path);
			var parentDir = projPath.parent.parent;
			var outputName = app.project.activeSequence.name;
			var xmlExtension = '.xml';
			//var outputPath = Folder.selectDialog("Choose the output directory");
			var completeOutputPath = parentDir.fsName + $._PPP_.getSep() + outputName + xmlExtension;

			app.project.activeSequence.exportAsFinalCutProXML(completeOutputPath, 1); // 1 == suppress UI
			var info = "Exported FCP XML for " + app.project.activeSequence.name + " to " + completeOutputPath + ".";
			$._PPP_.updateEventPanel(info);
		} else {
			$._PPP_.updateEventPanel("No active sequence.");
		}
	},

	updateEventPanel: function (message) {
		app.setSDKEventMessage(message, 'info');
		//app.setSDKEventMessage('Here is some information.', 'info');
		//app.setSDKEventMessage('Here is a warning.', 'warning');
		//app.setSDKEventMessage('Here is an error.', 'error');  // Very annoying; use sparingly.
	},

	clearCache: function () {
		app.enableQE();

		var MediaType_VIDEO = "228CDA18-3625-4d2d-951E-348879E4ED93"; // Magical constants from Premiere Pro's internal automation.
		var MediaType_AUDIO = "80B8E3D5-6DCA-4195-AEFB-CB5F407AB009";
		var MediaType_ANY = "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF";
		qe.project.deletePreviewFiles(MediaType_ANY);
		$._PPP_.updateEventPanel("All video and audio preview files deleted.");
	},

	extractFileNameFromPath: function (fullPath) {
		var lastDot = fullPath.lastIndexOf(".");
		var lastSep = fullPath.lastIndexOf("/");

		if (lastDot > -1) {
			return fullPath.substr((lastSep + 1), (fullPath.length - (lastDot + 1)));
		} else {
			return fullPath;
		}
	},

	persistTimelineToJSON: function () {
		var seq = app.project.activeSequence;
		if (seq) {
			var currentSeqSettings = app.project.activeSequence.getSettings();
			if (currentSeqSettings) {
				var ip = seq.getInPointAsTime();
				var op = seq.getOutPointAsTime();
				var fps = currentSeqSettings.videoFrameRate;
				var duration = seq.end;

				var projPath = new File(app.project.path);
				var parentDir = projPath.parent.parent;
				var outputName = app.project.activeSequence.name;
				var jsonExtension = '.json';
				var completeOutputPath = parentDir.fsName + $._PPP_.getSep() + outputName + jsonExtension;
				var outFile = new File(completeOutputPath);
				outFile.encoding = "UTF8";
				outFile.open("w", "TEXT", "????");

				var data = {};
				data.metadata = { "inPoint": ip.seconds, "outPoint": op.seconds, "duration": duration, "timebase": seq.timebase, "frameRate": fps.seconds };
				
				data.storyboard = [];

				var markers = seq.markers;
				if (markers) {
					var markerCount = markers.numMarkers;
					if (markerCount) {
						for (var thisMarker = markers.getFirstMarker(); thisMarker !== undefined; thisMarker = markers.getNextMarker(thisMarker)) {
							data.storyboard.push({
								name: thisMarker.name,
								start: thisMarker.start.seconds,
								end: thisMarker.end.seconds
							});
						}
					}
				}

				data.tracks = [];
				for (var ti = 0; ti < seq.videoTracks.numTracks; ti++) {
					var track = seq.videoTracks[ti];
					var trackData = {markers: [], clips: []};
					data.tracks.push(trackData);
					var firstClip = null;
					for (var ci = 0; ci < track.clips.numTracks; ci++) {
						var clip = track.clips[ci];
						trackData.clips.push({
							name: clip.name,
							start: clip.inPoint.seconds,
							end: clip.outPoint.seconds
						});
						if (!firstClip) {
							firstClip = clip;
						}
					}
					if (firstClip) {
						var pi = firstClip.projectItem;
						var markers = pi.getMarkers();
						if (markers) {
							for (var marker = markers.getFirstMarker(); marker !== undefined; marker = markers.getNextMarker(marker)) {
								trackData.markers.push({
									name: marker.name,
									start: marker.start.seconds,
									end: marker.end.seconds
								});
							}
						}
					}
				}

				outFile.writeln(JSON.stringify(data));
				projPath.close();
				outFile.close();
				//$._PPP_.updateEventPanel("Updated");
			}
		}
	},

	refreshImageBasedMedia: function () {
		//return;
		var seq = app.project.activeSequence;
		if (seq) {
			var tracks = seq.videoTracks;
			for (var ti = 0; ti < tracks.numTracks; ti++) {
				var track = tracks[ti];
				if (track.clips.numTracks > 0) {
					var pi = track.clips[0].projectItem;
					if (pi) {
						var mp = pi.getMediaPath();
						pi.changeMediaPath(mp, false);
					}
				}
			}
		}
	},

	registerSequenceSelectionChangedFxn: function () {
		var success = app.bind('onActiveSequenceSelectionChanged', $._PPP_.refreshImageBasedMedia);
	},

	registerProjectChangedFxn: function () {
		var success	= app.bind("onProjectChanged", $._PPP_.persistTimelineToJSON);
	},
	
	enableNewWorldScripting: function () {
		app.enableQE();

		var previousNWValue = qe.getDebugDatabaseEntry("ScriptLayerPPro.EnableNewWorld");
		if (previousNWValue === 'true') {
			qe.setDebugDatabaseEntry("ScriptLayerPPro.EnableNewWorld", "false");
			$._PPP_.updateEventPanel("ScriptLayerPPro.EnableNewWorld is now OFF.");
		} else {
			qe.setDebugDatabaseEntry("ScriptLayerPPro.EnableNewWorld", "true");
			$._PPP_.updateEventPanel("ScriptLayerPPro.EnableNewWorld is now ON.");
		}
	},

	logConsoleOutput: function () {
		app.enableQE();
		var logFileName = "PPro_Console_output.txt";
		var outFolder = Folder.selectDialog("Where do you want to save the log file?");
		if (outFolder) {
			var entireOutputPath = outFolder.fsName + $._PPP_.getSep() + logFileName;
			var result = qe.executeConsoleCommand("con.openlog " + entireOutputPath);
			$._PPP_.updateEventPanel("Log opened at " + entireOutputPath + ".");
		} else {
			$._PPP_.updateEventPanel("No output folder selected.");
		}
	},

	closeLog: function () {
		app.enableQE();
		qe.executeConsoleCommand("con.closelog");
	},

	clearESTKConsole: function () {
		/*var bt 		= new BridgeTalk();
		bt.target 	= 'estoolkit-4.0';
		bt.body 	= function() {
    		app.clc();
    	}.toSource()+"()";
		bt.send();*/
	},

	setLocale: function (localeFromCEP) {
		$.locale = localeFromCEP;
		$._PPP_.updateEventPanel("ExtendScript Locale set to " + localeFromCEP + ".");
	}
};
