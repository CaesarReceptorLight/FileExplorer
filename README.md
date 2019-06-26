# FileExplorer
A web plugin for viewing and managing files and images. It allowes more than the two OMERO build-in hierarchies.

**Requirements**

An installed OMERO server with CAESAR extension.

**Installation**

1.	Copy the folder 'TreeView' to:

    /home/omero/OMERO.server/lib/python/omeroweb/

2.	Add FileExplorer to the known web apps

    /home/omero/OMERO.server/bin/omero config append omero.web.apps '"TreeView"'

3.	Add the FileExplorer plugin the the center area

    /home/omero/OMERO.server/bin/omero config append omero.web.ui.right_plugins '["Explorer", "TreeView/tree_view_init.js.html", "tree_view_panel"]'

4.  Restart the web server

    /home/omero/OMERO.server/bin/omero web restart
