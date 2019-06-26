from django.http import (HttpResponse, HttpResponseNotAllowed,
                         HttpResponseBadRequest)

from omeroweb.webclient.decorators import login_required
from django.shortcuts import render

import omero
import os

import logging
logger = logging.getLogger(__name__)

@login_required(setGroupContext=True)
def getTreeViewView(request, conn=None, **kwargs):
	try:
		datasetId = request.POST.get("datasetId", 0)
		dataset = conn.getObject("Dataset", datasetId)
		datasetName = 'Unnamed'
		experimentId = -1
		experimentName = 'no experiment'
		rootFolderId = -1

		if dataset is not None:
			datasetName = dataset.getName()		
			rlService = conn.getReceptorLightService()
		
			if rlService is not None:
				experiment = rlService.getExperimentByDatasetId(int(datasetId))
				if experiment is not None:
					experimentId = experiment.getUId().getValue()
					experimentName = experiment.getName().getValue()
					rootFolderId = experiment.getRootFolderId().getValue()

		return render(request, 'TreeView/index.html',
			{'userName':conn.getUser().getName(),
			'datasetId':datasetId,
			'datasetName':datasetName,
			'experimentId':experimentId,
			'experimentName':experimentName,
			'rootFolderId':rootFolderId
			})
	except:
		raise

@login_required(setGroupContext=True)
def getCreateRootFolder(request, conn=None, **kwargs):
	try:
		expId = request.POST.get("experimentId", 0)
		rlService = conn.getReceptorLightService()
		fileService = conn.getReceptorLightFileManager()
		rootId = -1

		if rlService is not None:
			if fileService is not None:
				experiment = rlService.getExperiment(int(expId))
				if experiment is not None:
					rootId = fileService.createFile("Root")
					if rootId > 0:
						experiment.setRootFolderId(omero.rtypes.rint(rootId))
						rlService.saveExperiment(experiment)
						#root must be a folder
						fileInfo = fileService.getFileInformation(rootId)
						if fileInfo is not None:
							ft = fileInfo.getFileType()
							ft.setValue(omero.rtypes.rstring("Folder"))
							fileInfo.setFileType(ft)
							fileService.setFileInformation(rootId, fileInfo)
	
		return HttpResponse(rootId)
	except:
		raise

@login_required(setGroupContext=True)
def getCreateExperiment(request, conn=None, **kwargs):
	try:
		datasetId = request.POST.get("datasetId", 0)
		experimentName = request.POST.get("experimentName", 0)
		rlService = conn.getReceptorLightService()
		expId = -1

		if rlService is not None:
			experiment = rlService.createExperiment(experimentName)
			if experiment is not None:
				expId = experiment.getUId().getValue()
				experiment.setDatasetId(omero.rtypes.rint(int(datasetId)))
				rlService.saveExperiment(experiment)
	
		return HttpResponse(expId)
	except:
		raise

@login_required(setGroupContext=True)
def getFileInforamtion(request, conn=None, **kwargs):
	try:
		fileId = request.POST.get("fileId", 0)
		fileService = conn.getReceptorLightFileManager()
		result = "NO FILE"

		if fileService is not None:
			fileInfo = fileService.getFileInformation(int(fileId))
			if fileInfo is not None:
				fName = str(fileInfo.getName().getValue())
				fSize = str(fileInfo.getSize().getValue())
				fFileType = str(fileInfo.getFileType().getValue().getValue())
				fOmeroId = str(fileInfo.getOmeroId().getValue())
				fsfi = fileInfo.getSubFileIds()._getValues()
				fSubFileIds = "["
				l = len(fsfi)
				i = 0
				while i < l:
					v = fsfi[i].getValue().getValue()
					fSubFileIds += str(v)
					if (i + 1) < l:
						fSubFileIds += ", "
					i += 1

				fSubFileIds += "]"

				result = '{ '
				result += '"name" : "' + fName + '", '
				result += '"id"  : ' + fileId + ', '
				result += '"fileType" : "' + fFileType + '", '
				result += '"subFileIds" : ' + fSubFileIds + ', '
				result += '"omeroId" : ' + fOmeroId + ', '
				result += '"size" : ' + fSize + ' }'

		return HttpResponse(result)
	except:
		raise

@login_required(setGroupContext=True)
def getCreateFolder(request, conn=None, **kwargs):
	try:
		parentId = request.POST.get("parentFolderId", 0)
		folderName = request.POST.get("folderName")
		fileService = conn.getReceptorLightFileManager()
		newFolderId = -1

		if fileService is not None:
			parentFileInfo = fileService.getFileInformation(int(parentId))
			if parentFileInfo is not None:
				newFolderId = fileService.createFile(folderName)
				if newFolderId > 0:
					newFolderFileInfo = fileService.getFileInformation(newFolderId)
					if newFolderFileInfo is not None:
						ft = newFolderFileInfo.getFileType()
						ft.setValue(omero.rtypes.rstring("Folder"))
						newFolderFileInfo.setFileType(ft)
						fileService.setFileInformation(newFolderId, newFolderFileInfo)

						oId = omero.model.IntValueI(1)
						oId.Value = omero.rtypes.rint(newFolderId)

						parentFileInfo.getSubFileIds()._getValues().append(oId)

						fileService.setFileInformation(int(parentId), parentFileInfo)
	
		return HttpResponse(newFolderId)
	except:
		raise

@login_required(setGroupContext=True)
def getCreateOmeroFile(request, conn=None, **kwargs):
	try:
		parentId = request.POST.get("parentFolderId", 0)
		fileName = request.POST.get("fileName")
		omeroFileId = request.POST.get("omeroFileId")
		fileService = conn.getReceptorLightFileManager()
		newFileId = -1

		if fileService is not None:
			parentFileInfo = fileService.getFileInformation(int(parentId))
			if parentFileInfo is not None:
				newFileId = fileService.createFile(fileName)
				if newFileId > 0:
					newFolderFileInfo = fileService.getFileInformation(newFileId)
					if newFolderFileInfo is not None:
						ft = newFolderFileInfo.getFileType()
						ft.setValue(omero.rtypes.rstring("OmeroFile"))
						newFolderFileInfo.setFileType(ft)
						newFolderFileInfo.setOmeroId(omero.rtypes.rint(int(omeroFileId)))

						fileService.setFileInformation(newFileId, newFolderFileInfo)

						oId = omero.model.IntValueI(1)
						oId.Value = omero.rtypes.rint(newFileId)

						parentFileInfo.getSubFileIds()._getValues().append(oId)

						fileService.setFileInformation(int(parentId), parentFileInfo)
	
		return HttpResponse(newFileId)
	except:
		raise

@login_required(setGroupContext=True)
def getCreateRlFile(request, conn=None, **kwargs):
	try:
		parentId = request.POST.get("parentFolderId", 0)
		fileName = request.POST.get("fileName")
		fileService = conn.getReceptorLightFileManager()
		newFileId = -1

		if fileService is not None:
			parentFileInfo = fileService.getFileInformation(int(parentId))
			if parentFileInfo is not None:
				newFileId = fileService.createFile(fileName)
				if newFileId > 0:
					newFolderFileInfo = fileService.getFileInformation(newFileId)
					if newFolderFileInfo is not None:
						ft = newFolderFileInfo.getFileType()
						ft.setValue(omero.rtypes.rstring("ReceptorLightFile"))
						newFolderFileInfo.setFileType(ft)
						fileService.setFileInformation(newFileId, newFolderFileInfo)

						oId = omero.model.IntValueI(1)
						oId.Value = omero.rtypes.rint(newFileId)

						parentFileInfo.getSubFileIds()._getValues().append(oId)

						fileService.setFileInformation(int(parentId), parentFileInfo)
	
		return HttpResponse(newFileId)
	except:
		raise

@login_required(setGroupContext=True)
def getRenameFile(request, conn=None, **kwargs):
	try:
		fileId = request.POST.get("fileId", 0)
		newFileName = request.POST.get("newName")
		fileService = conn.getReceptorLightFileManager()

		if fileService is not None:
			fileInfo = fileService.getFileInformation(int(fileId))
			if fileInfo is not None:
				oldFileName = fileInfo.getName().getValue()
				fileInfo.setName(omero.rtypes.rstring(newFileName))
				fileService.setFileInformation(int(fileId), fileInfo)
				fFileType = str(fileInfo.getFileType().getValue().getValue())
				if fFileType == "ReceptorLightFile":
					homePath = os.path.expanduser("~")
					oldTargetName = homePath + '/OMERO.data/RL_FILES/' + str(fileId) + '_' + oldFileName
					newTargetName = homePath + '/OMERO.data/RL_FILES/' + str(fileId) + '_' + newFileName
					os.rename(oldTargetName, newTargetName)
	
		return HttpResponse(fileId)
	except:
		raise

@login_required(setGroupContext=True)
def getRemoveFile(request, conn=None, **kwargs):
	try:
		parentId = request.POST.get("parentId", 0)
		fileId = request.POST.get("fileId", 0)
		fileService = conn.getReceptorLightFileManager()
		l = -1

		if fileService is not None:
			fileInfo = fileService.getFileInformation(int(parentId))
			if fileInfo is not None:
				subIds = fileInfo.getSubFileIds()._getValues()
				i = 0			
				for id in subIds:				
					if id.getValue().getValue() == int(fileId):
						l = i
					i = i + 1
				if l > -1:
					del fileInfo.getSubFileIds()._getValues()[l]

				fileService.setFileInformation(int(parentId), fileInfo)
			
		fileService.deleteFile(int(fileId))
	
		return HttpResponse(l)
	except:
		raise

@login_required(setGroupContext=True)
def getOmeroFiles(request, conn=None, **kwargs):
	try:
		datasetId = request.POST.get("datasetId", 0)
		dataset = conn.getObject("Dataset", datasetId)

		result = '{ "images" : [ '

		if dataset is not None:
			images = list(dataset.listChildren())
			length = len(images)
			i = 0
			while i < length:
				image = images[i]
				result += ' { '
				result += '"name" : "' + image.getName() + '", '
				result += '"id"  : ' + str(image.getId()) + ', '
				result += '"acqusitionDate" : "' + str(image.getAcquisitionDate()) + '", '
				result += '"importDate" : "' + str(image.getAcquisitionDate()) + '"'
				result += ' } '
				if (i + 1) < length:
					result += ', '
				i += 1

		result += ' ] }'
		return HttpResponse(result)
	except:
		raise

@login_required(setGroupContext=True)
def getUserFiles(request, conn=None, **kwargs):
	try:
		fileService = conn.getReceptorLightFileManager()
		result = '{ "files" : [ '

		if fileService is not None:
			files = list(fileService.getFiles())
			length = len(files)
			i = 0
			isFirst = True
			while i < length:
				fil = files[i]
				typ = str(fil.getFileType().getValue().getValue())
				if typ == 'ReceptorLightFile':
					if isFirst != True :
						result += ', '
					isFirst = False
					result += ' { '
					result += '"name" : "' + fil.getName().getValue() + '", '
					result += '"id"  : ' + str(fil.getUId().getValue()) + ', '
					result += '"acqusitionDate" : "-", '
					result += '"importDate" : "' + fil.getCreationDateTime().getValue() + '", '
					result += '"type"  : "' + typ + '"'
					result += ' } '
				i += 1

		result += ' ] }'

		return HttpResponse(result)
	except:
		raise

@login_required(setGroupContext=True)
def addUserFileToFolder(request, conn=None, **kwargs):
	try:
		parentId = request.POST.get("parentId", 0)
		fileId = request.POST.get("fileId", 0)
		fileService = conn.getReceptorLightFileManager()
		l = -1

		if fileService is not None:
			fileInfo = fileService.getFileInformation(int(parentId))
			if fileInfo is not None:
				l = fileId
				v = omero.model.IntValueI()
				v.setValue(omero.rtypes.rint(fileId))
				fileInfo.getSubFileIds().addIntValue(v);
				fileService.setFileInformation(int(parentId), fileInfo)
	
		return HttpResponse(l)
	except:
		raise

@login_required(setGroupContext=True)
def getOpenFile(request, conn=None, **kwargs):
	try:
		fileId = request.POST.get("fileId", 0)
		fileService = conn.getReceptorLightFileManager()
		fid = -1;

		if fileService is not None:
			fileService.openFile(int(fileId), False)
			fid = fileId
		else:
			fileId = -1
	
		return HttpResponse(fid)
	except:
		raise

@login_required(setGroupContext=True)
def getCloseFile(request, conn=None, **kwargs):
	try:
		fileId = request.POST.get("fileId", 0)
		fileService = conn.getReceptorLightFileManager()

		if fileService is not None:
			fileService.closeFile(int(fileId))
		else:
			fileId = -1
	
		return HttpResponse(fileId)
	except:
		raise

@login_required(setGroupContext=True)
def getReadFileData(request, conn=None, **kwargs):
	try:
		fileId = request.POST.get("fileId", 0)
		dataLength = request.POST.get("dataLength", 0)
		fileService = conn.getReceptorLightFileManager()
		data = []

		if fileService is not None:
			data = fileService.readFileData(int(fileId), int(dataLength))
	
		return HttpResponse(data)
	except:
		raise
