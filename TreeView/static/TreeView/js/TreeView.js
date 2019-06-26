
var urlCreateExperiment = location.protocol + "//" + window.location.host + "/TreeView/getCreateExperiment/";
var urlCreateRoot = location.protocol + "//" + window.location.host + "/TreeView/getCreateRootFolder/";
var urlCreateFolder = location.protocol + "//" + window.location.host + "/TreeView/getCreateFolder/";
var urlCreateOmeroFile = location.protocol + "//" + window.location.host + "/TreeView/getCreateOmeroFile/";
var urlCreateRlFile = location.protocol + "//" + window.location.host + "/TreeView/getCreateRlFile/";
var urlGetFileInfo = location.protocol + "//" + window.location.host + "/TreeView/getFileInforamtion/";
var urlGetOpenFile = location.protocol + "//" + window.location.host + "/TreeView/getOpenFile/";
var urlGetCloseFile = location.protocol + "//" + window.location.host + "/TreeView/getCloseFile/";
var urlGetReadFileData = location.protocol + "//" + window.location.host + "/TreeView/getReadFileData/";
var urlRenameFile = location.protocol + "//" + window.location.host + "/TreeView/getRenameFile/";
var urlRemoveFile = location.protocol + "//" + window.location.host + "/TreeView/getRemoveFile/";
var urlGetOmeroFiles = location.protocol + "//" + window.location.host + "/TreeView/getOmeroFiles/";
var urlGetUserFiles = location.protocol + "//" + window.location.host + "/TreeView/getUserFiles/";
var urlAddUserFileToFolder = location.protocol + "//" + window.location.host + "/TreeView/addUserFileToFolder/";

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

//function getStreamSupport() {
//    import { createWriteStream, supported, version } from 'StreamSaver'
//    const { createWriteStream, supported, version } = require('StreamSaver')
//    const { createWriteStream, supported, version } = window.streamSaver
//    return supported;
//}

//we need this security cookie to push POST requests to the server
var csrftoken = getCookie('csrftoken');
var rootNodeId = "";
var imageSelectPopup;

function StartUp() {
	return new Promise(function(resolve, reject) {
		if(currentExperimentId > 0)
		{
			var noExpLabel = document.getElementById("noExpLabel");
			noExpLabel.style.display = "none";

        		var expButton = document.getElementById("expButton");
			expButton.style.display = "none";

			var expLabelName = document.getElementById("expNameLabel");
			expLabelName.style.display = "none";

			var expNameBox = document.getElementById("expNameBox");
			expNameBox.style.display = "none";

			if(currentRootFolderId > 0)
			{
				var rootButton = document.getElementById("rootButton");
				rootButton.style.display = "none";	

				FillRoot()
				.then(function() {
					resolve();
				});
			}
		        else
        		{
        		    	var rootButton = document.getElementById("rootButton");
    				rootButton.style.display = "initial";
				resolve();
        		}
		}
		else
		{
			var rootButton = document.getElementById("rootButton");
			rootButton.style.display = "none";
			resolve();
		}
	});
}

function FillRoot() {
	return new Promise(function(resolve, reject) {
		var experimentHeaderText = document.getElementById("experimentHeaderText");
		experimentHeaderText.style.display = "initial";		
		experimentHeaderText.innerHTML += " " + currentDatasetName;	
		var experimentHeader = document.getElementById("experimentHeader");	
		experimentHeader.src = DJANGO_STATIC_URL + "TreeView/images/folder_image16.png";
		
		GetFileInformation(currentRootFolderId)
		.then(function(rootInfoJson) {
			var rootInfo = JSON.parse(rootInfoJson);
			rootNodeId = CreateRootNode(currentRootFolderId);
			FillSubItems(rootInfo, rootNodeId)
			.then(function() {
				resolve();		
			});
		});
	});
}

function FolderRenamed(data) {
	return new Promise(function(resolve, reject) {
		var downloading = (data.node.original.attr.downloading == true);
		if(downloading == true)
		{
			resolve(); //don't change file name while downloading!
			return;
		}
		var id = parseInt(data.node.original.attr.fileId);
		if(isNaN(id))
		{
			resolve();
			return;
		}
	
		if(id <= 0)
		{
			//create new folder at server with given name
			if(data.node.parents.length <= 0)
			{
				resolve();
				return;
			}
		
			var parentNode = data.instance.get_node(data.node.parent);
			var parentId = parseInt(parentNode.original.attr.fileId);
		
			if(isNaN(parentId))
			{
				resolve();
				return;
			}
			CreateFolderAtServer(parentId, data.text)
			.then(function(newFolderId) {
				data.node.original.attr.fileId = newFolderId;
				resolve();
			});		
		}
		else
		{
			//rename folde at server
			RenameFileAtServer(id, data.text)
			.then(function(id) {
				resolve();
			});
		}
	});
}

function DownloadFile(obj)
{
  //var supportStreamSaver = getStreamSupport();
  //if(supportStreamSaver == false)
  //{
	//  alert("Your browser did not support 'StreamSaver'. Please use another browser or try to update your browser.);
	//	return;
  //}
	var selectedNodeID = obj.id;
	$("#treeViewRootDiv").jstree(true).set_icon(selectedNodeID, DJANGO_STATIC_URL + "TreeView/images/Spinner_10Bluedots_16x.gif");
	var nodeText = $("#treeViewRootDiv").jstree(true).get_text(selectedNodeID);
	var fileId = obj.original.attr.fileId;
	obj.original.attr.downloading = true;
	download(fileId, selectedNodeID, nodeText)
	.then(function() {
		$("#treeViewRootDiv").jstree(true).set_icon(selectedNodeID, DJANGO_STATIC_URL + "TreeView/images/FigureCaptionTag_16x.png");
		$("#treeViewRootDiv").jstree(true).rename_node(selectedNodeID, nodeText);
		obj.original.attr.downloading = false;
	})
	.catch(function(err) {
		$("#treeViewRootDiv").jstree(true).set_icon(selectedNodeID, DJANGO_STATIC_URL + "TreeView/images/FigureCaptionTag_16x.png");
		$("#treeViewRootDiv").jstree(true).rename_node(selectedNodeID, nodeText);
		obj.original.attr.downloading = false;
		alert("Error while downloading file: \n" + err);
	});
}

function download(fileId, selectedNodeID, nodeText)
{
	return new Promise(function(resolve, reject) {
		GetFileInformation(fileId)
		.then(function(fileInfoJson) {
			var fileInfo = JSON.parse(fileInfoJson);
			var fileSize = fileInfo.size;
			var fileType = fileInfo.fileType;
			var fileName = fileInfo.name;

			if(fileType != 'ReceptorLightFile')
				reject(new Error("for now only receptor-light files could be downloaded!\nPlease use Thumbnail view to download images."));
			CloseFile(fileId);
			OpenFile(fileId)
			.then(function() {
				var fileStream = streamSaver.createWriteStream(fileName, fileSize);
				var writer = fileStream.getWriter();
				ReadFileDataSubPart(fileId, fileSize, fileSize, writer, selectedNodeID, nodeText)
				.then(function() {
					CloseFile(fileId)
					.then(function() {
						writer.close();
						resolve();
						return;
					})
					.catch(function(err) {
						writer.abort("[CloseFile] -> " + err);
						reject("[CloseFile] -> " + err);
					});
				})
				.catch(function(err) {
					CloseFile(fileId)
					.then(function() { 
						writer.abort("[ReadFileDataSubPart] -> " + err);
						reject("[ReadFileDataSubPart] -> " + err);
					})
					.catch(function(err) {
						writer.abort("[CloseFile] -> " + err);
						reject("[CloseFile] -> " + err);
					});
				});
			})
			.catch(function(err) {
				reject("[OpenFile] -> " + err);
			});
		})
		.catch(function(err) {
			reject("[GetFileInformation] -> " + err);
		});
	});
}

function OpenFile(fileId)
{
	return new Promise(function(resolve, reject) {
		var params = "fileId=" + fileId;
		var fileInfoRequest = new XMLHttpRequest();
		fileInfoRequest.onload = function () {
			if (this.status === 200)
			{
				if(this.response == fileId.toString())
				{
					console.log('Open file (%d).', fileId);
					resolve(); //openFile don't has a return value. 
				} else {
					console.log('Error  at [OpenFile(%d)]. Status: %d', fileId, this.status);
					reject(new Error(this.statusText));
				}
			} else {
				reject(new Error("[OpenFile] -> " + this.statusText));
			}
		}
		fileInfoRequest.open("POST", urlGetOpenFile);
		fileInfoRequest.setRequestHeader("X-CSRFToken", csrftoken);
		fileInfoRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		fileInfoRequest.send(params);
	});
}

function CloseFile(fileId)
{
	return new Promise(function(resolve, reject) {
		var params = "fileId=" + fileId;
		var fileInfoRequest = new XMLHttpRequest();
		fileInfoRequest.onload = function () {
			if (this.status === 200) {
				console.log('CloseFile(%d).', fileId);
				resolve(); //closeFile don't has a return value. 
			} else {
				console.log('Error  at [CloseFile(%d)]. Status: %d', fileId, this.status);
				reject(new Error("[CloseFile] -> " + this.statusText));
			}
		}
		fileInfoRequest.open("POST", urlGetCloseFile);
		fileInfoRequest.setRequestHeader("X-CSRFToken", csrftoken);
		fileInfoRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		fileInfoRequest.send(params);
	});
}

function ReadFileDataSubPart(fileId, dataLength, fileSize, writer, selectedNodeID, nodeText)
{	
	return new Promise(function(resolve, reject) {
		if (dataLength <= 0)
		{
			resolve();
			return;
		}
		var p = Math.ceil(100.0 * ((fileSize - dataLength) / fileSize));
		$("#treeViewRootDiv").jstree(true).rename_node(selectedNodeID, "[ " + p + "% ] " + nodeText);
		var MaxPackageLength = 1024 * 1024; //max 64k per package
		var tmpSize = (dataLength > MaxPackageLength) ? MaxPackageLength : dataLength;
		ReadFileDataPart(fileId, tmpSize)
		.then(function(data) {
			var arr = new Uint8Array(data);
			writer.write(arr);
			if(tmpSize != arr.length)			
			{
				console.log(tmpSize + " != " + arr.length);
			}
			ReadFileDataSubPart(fileId, dataLength - tmpSize, fileSize, writer, selectedNodeID, nodeText)
			.then(function() { 
				resolve();
			})
			.catch(function(err) {
				reject("[ReadFileDataSubPart] -> " + err);
			});
		})
		.catch(function(err) {
			reject("[ReadFileDataPart] -> " + err);
		});
	});
}

function ReadFileDataPart(fileId, dataLength)
{
	return new Promise(function(resolve, reject) {
		var params = "fileId=" + fileId;
		params += "&dataLength=" + dataLength;
		var fileInfoRequest = new XMLHttpRequest();
		fileInfoRequest.onload = function () {
			if (this.status === 200) {
				resolve(this.response);
			} else {
				console.log('Error  at [ReadFileDataPart(%d,%d)]. Status: %d', fileId, dataLength, this.status);
				reject(new Error("[ReadFileDataPart] -> " + this.statusText));
			}
		}
		fileInfoRequest.open("POST", urlGetReadFileData);
		fileInfoRequest.setRequestHeader("X-CSRFToken", csrftoken);
		fileInfoRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		fileInfoRequest.responseType = "arraybuffer";
		fileInfoRequest.send(params);
	});
}

function CreateRootNode(fileId){
	var id = CreateNode("#", "Root", fileId, "Folder");
	$('#treeViewRootDiv').jstree(true).select_node(id);
	return id;
}

function CreateFolder(obj)
{
	var id = CreateNode(obj.id, "unnamed", -1, "Folder");		
	$('#treeViewRootDiv').jstree(true).edit(id);
}

function AddExistingUserFile(obj)
{
	return new Promise(function(resolve, reject) {
		var selectedNodeID = obj.id;
		var parentId = obj.original.attr.fileId;
		GetUserFilesFromServer()
		.then(function(files) {
			ShowImageSelectPopup(files.files)
			.then(function(selectedIds) {
				var fileIds = [];
				var fileNames = [];
				for(var f = 0; f < files.files.length; f++)
				{
					var uid = parseInt(files.files[f].id);
					for(var k = 0; k < selectedIds.length; k++)
					{
						if(uid == parseInt(selectedIds[k]))
						{							
							fileIds.push(files.files[f].id);
							fileNames.push(files.files[f].name);
						}
					}					
				}
				AddUserFilesToFolder(parentId, selectedNodeID, 0, fileIds, fileNames)
				.then(function() {
					resolve();
				});
			});
		});
	});
}

function AddExistingOmeroFile(obj)
{
	return new Promise(function(resolve, reject) {
		var selectedNodeID = obj.id;
		var parentId = obj.original.attr.fileId;
		GetOmeroFilesFromServer(currentDatasetId)
		.then(function(images ) {
			ShowImageSelectPopup(images.images)
			.then(function(selectedIds) {
				var fileIds = [];
				var fileNames = [];
				for(var i = 0; i < images.images.length; i++)
				{
					var omeroId = parseInt(images.images[i].id);
					for(var k = 0; k < selectedIds.length; k++)
					{
						if(omeroId == parseInt(selectedIds[k]))
						{
							fileIds.push(images.images[i].id);
							fileNames.push(images.images[i].name);
						}
					}					
				}
				CreateOmeroFilesAtServer(parentId, selectedNodeID, 0, fileIds, fileNames)
				.then(function() {
					resolve();
				});
			});
		});
	});
}

function AddUserFilesToFolder(parentId, selectedNodeID, idx, fileIds, fileNames)
{
	return new Promise(function(resolve, reject) {
		if(idx < fileIds.length)
		{
			AddUserFileToFolder(parentId, fileIds[idx])
			.then(function(id) {
				CreateNode(selectedNodeID, fileNames[idx], fileIds[idx], "ReceptorLightFile");
				AddUserFilesToFolder(parentId, selectedNodeID, idx + 1, fileIds, fileNames)
				.then(function() {
					resolve();
				});
			});
		}
		else
		{
			resolve();
		}
	});	
}

function AddUserFileToFolder(parentId, fileId)
{
	return new Promise(function(resolve, reject) {
		var params = "parentId=" + parentId;
		params += "&fileId=" + fileId;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				var id = parseInt(this.responseText);
				console.log('Add file (%d) to folder (%d)', fileId, parentId);
				resolve(id);
			} else {
				console.log('Error at [AddUserFileToFolder(%d,%d)] (status:%d)', parentId, fileId, this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlAddUserFileToFolder);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function RemoveFile(obj)
{
	return new Promise(function(resolve, reject) {
		var selectedNodeID = obj.id;
		var fileId = obj.original.attr.fileId;
		var parentNodeId = $('#treeViewRootDiv').jstree(true).get_parent(obj);
		var parentNode = $('#treeViewRootDiv').jstree(true).get_node(parentNodeId);
		var parentId = parentNode.original.attr.fileId;
		RemoveFileAtServer(parentId, fileId)
		.then(function(id) {
			$('#treeViewRootDiv').jstree(true).delete_node(selectedNodeID);
			resolve();
		});
	});
}

function RenameFolder(obj)
{
	$('#treeViewRootDiv').jstree(true).edit(obj.id);
}

function CreateNode(parentNodeId, name, fileId, fileType)
{	
	var icon = "";
	if(fileType == "Folder")
		icon = DJANGO_STATIC_URL + "TreeView/images/Folder_16x.png";
	else
		icon = DJANGO_STATIC_URL + "TreeView/images/FigureCaptionTag_16x.png";

	var id = $('#treeViewRootDiv').jstree('create_node', parentNodeId, {attr: {fileId: fileId, fileType: fileType, downloading: false}, text: name, icon: icon});
	
	return id;
}

function IsFolder(obj)
{
	return IsItemFolder(obj.id);
}

function IsRlFile(obj)
{
	return IsItemRlFile(obj.id);
}

function IsOmeroFile(obj)
{
	return IsItemOmeroFile(obj.id);
}

function IsItemFolder(itemId)
{
	var node = $('#treeViewRootDiv').jstree(true).get_node(itemId);
	var fileType = node.original.attr.fileType;
	return (fileType == "Folder");
}

function IsItemRlFile(itemId)
{
	var node = $('#treeViewRootDiv').jstree(true).get_node(itemId);
	var fileType = node.original.attr.fileType;
	return (fileType == "ReceptorLightFile");
}

function IsItemOmeroFile(itemId)
{
	var node = $('#treeViewRootDiv').jstree(true).get_node(itemId);
	var fileType = node.original.attr.fileType;
	return (fileType == "OmeroFile");
}

function getElementByAttribute(attr, value, root) {
    root = root || document.body;
    if(root.hasAttribute(attr) && root.getAttribute(attr) == value) {
        return root;
    }
    var children = root.children, 
        element;
    for(var i = children.length; i--; ) {
        element = getElementByAttribute(attr, value, children[i]);
        if(element) {
            return element;
        }
    }
    return null;
}

function GetTreeViewNode(data)
{
	var inst = $.jstree.reference(data.reference);
	var obj = inst.get_node(data.reference);
	return obj;
}

function CreateContext(node) {
	var tree = $("#tree_1").jstree(true);
	var context = {
		CreateFolder: {
			"label": "Create new folder",
			"action": function (obj) {
				CreateFolder(GetTreeViewNode(obj));
			},
			"_disabled" : function (obj) {
				return !IsFolder(GetTreeViewNode(obj));
            }
		},
		DownloadFile: {
			"label": "Download",
			"action": function (obj) {
				DownloadFile(GetTreeViewNode(obj));
			},
			"_disabled" : function (obj) { 
				return IsFolder(GetTreeViewNode(obj));
            }
		},
		RenameFile: {
			"label": "Rename",
			"action": function (obj) {
				RenameFolder(GetTreeViewNode(obj));
			},
			"_disabled" : function (obj) { 
				return IsOmeroFile(GetTreeViewNode(obj));
            }
		},
		AddExistingUserFile: {
			"label": "Add existing user file",
			"action": function (obj) {
				AddExistingUserFile(GetTreeViewNode(obj));
			},
			"_disabled" : function (obj) { 
				return !IsFolder(GetTreeViewNode(obj));
            }
		},
		AddExistingOmeroFile: {
			"label": "Add existing OMERO file",
			"action": function (obj) {
				AddExistingOmeroFile(GetTreeViewNode(obj));
			},
			"_disabled" : function (obj) { 
				return !IsFolder(GetTreeViewNode(obj));
            }
		},
		Remove: {
			"label": "Remove",
			"action": function (obj) {
				RemoveFile(GetTreeViewNode(obj));
			},
			"_disabled" : function (obj) { 
				return false;
            }
		}
	};

	return context;
}

function CreateRootAtServer() {
	return new Promise(function(resolve, reject) {
		var params = "experimentId=" + currentExperimentId;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				currentRootFolderId = parseInt(this.responseText);
				StartUp()
				.then(function() {
					console.log('CreateRootAtServer().');
					resolve(this.responseText);
				});
			} else {
				console.log('Error  at [CreateRootAtServer()]. Status: %d', this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlCreateRoot);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function CreateExperimentAtServer() {
	return new Promise(function(resolve, reject) {
		var expNameBox = document.getElementById("expNameBox");
	
		if(expNameBox.value === "")
		{
			alert("Experiment name must not be empty!");
			currentExperimentId = 0;
			currentRootFolderId = 0;
			resolve(0);
		}
		var params = "datasetId=" + currentDatasetId;
        	params += "&experimentName=" + expNameBox.value;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				currentExperimentId = parseInt(this.responseText);
				currentRootFolderId = 0;
				StartUp()
				.then(function() {
					console.log('CreateExperimentAtServer().');
					resolve(this.responseText);
				});
			} else {
				console.log('Error  at [CreateExperimentAtServer()]. Status: %d', this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlCreateExperiment);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function CreateFolderAtServer(parentId, folderName)
{
	return new Promise(function(resolve, reject) {
		var params = "parentFolderId=" + parentId;
		params += "&folderName=" + folderName;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				var newId = parseInt(this.responseText);
				console.log('CreateFolderAtServer(%d,%s).', parentId, folderName);
				resolve(newId);
			} else {
				console.log('Error  at [CreateFolderAtServer(%d,%s)]. Status: %d', parentId, folderName, this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlCreateFolder);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function CreateOmeroFilesAtServer(parentId, selectedNodeID, idx, fileIds, fileNames)
{
	return new Promise(function(resolve, reject) {
		if(idx < fileIds.length)
		{
			CreateOmeroFileAtServer(parentId, fileNames[idx], fileIds[idx])
			.then(function(data) {
				CreateNode(selectedNodeID, data[1], data[0], "OmeroFile");
				CreateOmeroFilesAtServer(parentId, selectedNodeID, idx + 1, fileIds, fileNames)
				.then(function() {
					resolve();
				});
			});
		}
		else
		{
			resolve();
		}
	});
}

function CreateOmeroFileAtServer(parentId, fileName, omeroFileId)
{
	return new Promise(function(resolve, reject) {
		var params = "parentFolderId=" + parentId;
		params += "&fileName=" + fileName;
		params += "&omeroFileId=" + omeroFileId;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				var newId = parseInt(this.responseText);
				console.log('CreateOmeroFileAtServer(%d,%s,%d).', parentId, fileName, omeroFileId);
				resolve([newId, fileName]);
			} else {
				console.log('Error  at [CreateOmeroFileAtServer(%d,%s,%d)]. Status: %d', parentId, fileName, omeroFileId, this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlCreateOmeroFile);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function CreateRlFileAtServer(parentId, fileName)
{
	return new Promise(function(resolve, reject) {
		var params = "parentFolderId=" + parentId;
		params += "&fileName=" + fileName;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				var newId = parseInt(this.responseText);
				console.log('CreateRlFileAtServer(%d,%s).', parentId, fileName);
				resolve(newId);
			} else {
				console.log('Error  at [CreateRlFileAtServer(%d,%s)]. Status: %d', parentId, fileName, this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlCreateRlFile);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function RemoveFileAtServer(parentId, fileId)
{
	return new Promise(function(resolve, reject) {
		var params = "parentId=" + parentId;
		params += "&fileId=" + fileId;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				var id = parseInt(this.responseText);
				console.log('RemoveFileAtServer(%d,%d).', parentId, fileId);
				resolve(id);
			} else {
				console.log('Error  at [RemoveFileAtServer(%d,%d)]. Status: %d', parentId, fileId, this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlRemoveFile);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function RenameFileAtServer(fileId, newName)
{
	return new Promise(function(resolve, reject) {
		var params = "fileId=" + fileId;
		params += "&newName=" + newName;
		var createRequest = new XMLHttpRequest();
		createRequest.onload = function () {
			if (this.status === 200) {
				var id = parseInt(this.responseText);
				console.log('RenameFileAtServer(%d,%s).', fileId, newName);
				resolve(id);
			} else {
				console.log('Error  at [RenameFileAtServer(%d,%s)]. Status: %d', fileId, newName, this.status);
				reject(new Error(this.statusText));
			}
		}
		createRequest.open("POST", urlRenameFile);
		createRequest.setRequestHeader("X-CSRFToken", csrftoken);
		createRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		createRequest.send(params);
	});	
}

function FillSubItems(parentInfo, parentItemId){
	return new Promise(function(resolve, reject) {
		var index = 0;
		for(index = 0; index < parentInfo.subFileIds.length; index++)
		{
			var id = parseInt(parentInfo.subFileIds[index]);
			GetFileInformation(id)
			.then(function(fileInfoJson) {
				var fileInfo = JSON.parse(fileInfoJson);
				var itemId = CreateNode(parentItemId, fileInfo.name, fileInfo.id, fileInfo.fileType);

				FillSubItems(fileInfo, itemId)
				.then(function() {				
				});
			});
		}
		resolve();
	});
}

function GetFileInformation(fileId){
	return new Promise(function(resolve, reject) {
		var params = "fileId=" + fileId;
		var fileInfoRequest = new XMLHttpRequest();
		fileInfoRequest.onload = function () {
			if (this.status === 200) {
				resolve(this.responseText);
			} else {
				console.log('Error  at [GetFileInformation(%d)]. Status: %d', fileId, this.status);
				reject(new Error(this.statusText));
			}
		}
		fileInfoRequest.open("POST", urlGetFileInfo);
		fileInfoRequest.setRequestHeader("X-CSRFToken", csrftoken);
		fileInfoRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		fileInfoRequest.send(params);
	});
}

function GetOmeroFilesFromServer(datasetId){
	return new Promise(function(resolve, reject) {
		var params = "datasetId=" + datasetId;
		var fileInfoRequest = new XMLHttpRequest();
		fileInfoRequest.onload = function () {
			if (this.status === 200) {
				var images = JSON.parse(this.responseText);
				resolve(images);
			} else {
				console.log('Error  at [GetOmeroFilesFromServer(%d)]. Status: %d', datasetId, this.status);
				reject(new Error(this.statusText));
			}
		}
		fileInfoRequest.open("POST", urlGetOmeroFiles);
		fileInfoRequest.setRequestHeader("X-CSRFToken", csrftoken);
		fileInfoRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		fileInfoRequest.send(params);
	});
}

function GetUserFilesFromServer(){
	return new Promise(function(resolve, reject) {
		var userFilesRequest = new XMLHttpRequest();
		userFilesRequest.onload = function () {
			if (this.status === 200) {
				var files = JSON.parse(this.responseText);
				resolve(files);
			} else {
				console.log('Error  at [GetUserFilesFromServer()]. Status: %d', this.status);
				reject(new Error(this.statusText));
			}
		}
		userFilesRequest.open("POST", urlGetUserFiles);
		userFilesRequest.setRequestHeader("X-CSRFToken", csrftoken);
		userFilesRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		userFilesRequest.send(null);
	});
}


function CreateImageSelectPopupContent(data)
{
	var title = 'Select Images';
	var result = '<html><head><title>' + title + '</title></head>';
	result += '<style>.footer { position: fixed; left: 0; bottom: 0; width: 100%;}</style>';
	result += '<body><h2>Select Images</h2>';
	result += '<p>Sort by</p>';
	result += '<select onchange="sortTable()" id="tableSort">';
	result += '<option value="Name">Name</option><option value="NameReverse">Name reverse</option>';
	result += '<option value="ImportDate">Import date</option><option value="ImportDateReverse">Import date reverse</option>';
	result += '<option value="AcquisitionDate">Acquisition date</option><option value="AcquisitionDateReverse">Acquisition date reverse</option>';
	result += '</select>';
	result+= '<table id="imageTable" style="width:100%">';

	result += "<tr><th align='left'>Name</th><th align='right'>Import Date</th><th align='right'>Acquisition Date</th></tr>";
	
	for (i = 0; i < data.length; i++)
	{
		result += "<tr>";
		result += "<td><label><input name='imagecheckbox' type='checkbox' value='" + data[i].id + "'>" + data[i].name + "</label></td>";
		result += "<td align='right'>" + data[i].importDate + "</td>";
		result += "<td align='right'>" + data[i].acqusitionDate + "</td>";
		result += "</tr>"
	}
	
	result += '</table>';
	result += '<h1></h1>';
	result += '<div class="footer"><button type="button" onclick="window.close()">OK</button></div>';
	result += '<script>';
	result += 'function sortTable() {';
	result += '  var selectionType = document.getElementById("tableSort").value;';
	result += '  var selectionIdx = 0;';
	result += '  var sortReverse = false;';
	
	result += '  if(selectionType.startsWith("Name"))';
	result += '    selectionIdx = 0;';
	result += '  else if(selectionType.startsWith("Import")) ';
	result += '    selectionIdx = 1;';
	result += '  else if(selectionType.startsWith("Acquisition")) ';
	result += '    selectionIdx = 2;';
	
	result += '  if (typeof selectionType.includes === "function")';
	result += '    sortReverse = selectionType.includes("Reverse");';
	result += '  else';
	result += '    sortReverse = selectionType.contains("Reverse");';
	
	result += '  var table, rows, switching, i, x, y, shouldSwitch;';
	result += '  table = document.getElementById("imageTable");';
	result += '  switching = true;';
	result += '  while (switching) {';
	result += '    switching = false;';
	result += '    rows = table.getElementsByTagName("TR");';
	result += '    for (i = 1; i < (rows.length - 1); i++) {';
	result += '      shouldSwitch = false;';
	result += '      x = rows[i].getElementsByTagName("TD")[selectionIdx];';
	result += '      y = rows[i + 1].getElementsByTagName("TD")[selectionIdx];';
	result += '      if(!sortReverse) {';
	result += '        if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {';
	result += '          shouldSwitch = true;';
	result += '          break;';
	result += '        }';
	result += '      }';
	result += '      else {';
	result += '        if (x.textContent.toLowerCase() < y.textContent.toLowerCase()) {';
	result += '          shouldSwitch = true;';
	result += '          break;';
	result += '        }';
	result += '      }';
	result += '    }';
	result += '    if (shouldSwitch) {';
	result += '      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);';
	result += '      switching = true;';
	result += '    }';
	result += '  }';
	result += '}';
	result += 'sortTable();';
	result += '</script>';
	result += '</body></html>'
	return result;
}

var selectImagesResolveDelegate;

function ShowImageSelectPopup(data)
{
	return new Promise(function(resolve, reject) {
		w = screen.availWidth / 2;
		h = screen.availHeight * 2 / 3;
		x = screen.availWidth / 2 - w / 2;
		y = screen.availHeight / 2 - h / 2;
		imageSelectPopup = window.open('', '', 'width=' + w + ',height=' + h + ',left=' + x + ',top=' + y + ',screenX=' + x + ',screenY=' + y + ',scrollbars=1' );
		
		var content = CreateImageSelectPopupContent(data);
		selectImagesResolveDelegate = resolve;
		
		imageSelectPopup.document.write(content);
		imageSelectPopup.onbeforeunload = ImageSelectPopupClosed;		
	});		
}

function ImageSelectPopupClosed()
{
	var ids = [];
	var table = imageSelectPopup.document.getElementById('imageTable');
	if(table != null)
	{
		var allCheckBoxes = imageSelectPopup.document.getElementsByName('imagecheckbox');
		for (i = 0; i < allCheckBoxes.length; i++)
		{ 
			if(allCheckBoxes[i].checked == true)
				ids.push(allCheckBoxes[i].value);
		}
	}

	selectImagesResolveDelegate(ids);
}

