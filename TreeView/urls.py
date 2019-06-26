from django.conf.urls import *
from TreeView import views

urlpatterns = patterns(
    'django.views.generic.simple',

    url(r'^getTreeViewView/$',
        views.getTreeViewView,
        name="TreeView_getTreeViewView"),

    url(r'^getCreateExperiment/$',
        views.getCreateExperiment,
        name="TreeView_getCreateExperiment"),

    url(r'^getCreateRootFolder/$',
        views.getCreateRootFolder,
        name="TreeView_getCreateRootFolder"),

    url(r'^getFileInforamtion/$',
        views.getFileInforamtion,
        name="TreeView_getFileInforamtion"),

    url(r'^getOpenFile/$',
        views.getOpenFile,
        name="TreeView_getOpenFile"),

    url(r'^getCloseFile/$',
        views.getCloseFile,
        name="TreeView_getCloseFile"),

    url(r'^getReadFileData/$',
        views.getReadFileData,
        name="TreeView_getReadFileData"),

    url(r'^getCreateFolder/$',
        views.getCreateFolder,
        name="TreeView_getCreateFolder"),

    url(r'^getCreateRlFile/$',
        views.getCreateRlFile,
        name="TreeView_getCreateRlFile"),
    
    url(r'^getCreateOmeroFile/$',
        views.getCreateOmeroFile,
        name="TreeView_getCreateOmeroFile"),

    url(r'^getRenameFile/$',
        views.getRenameFile,
        name="TreeView_getRenameFile"),

    url(r'^getRemoveFile/$',
        views.getRemoveFile,
        name="TreeView_getRemoveFile"),

    url(r'^getOmeroFiles/$',
        views.getOmeroFiles,
        name="TreeView_getOmeroFiles"),

    url(r'^getUserFiles/$',
        views.getUserFiles,
        name="TreeView_getUserFiles"),

    url(r'^addUserFileToFolder/$',
        views.addUserFileToFolder,
        name="TreeView_addUserFileToFolder"),
)
