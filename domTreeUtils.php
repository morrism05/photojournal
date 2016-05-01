<?php

require_once('timestampUtils.php');

// For fetching photos from local xml cache:
// Delete this DOM node and all child nodes.
function deleteNode($node) {
    deleteChildren($node);
    $parent = $node->parentNode;
    $oldnode = $parent->removeChild($node);
}

// For fetching photos from local xml cache:
// Recursively delete all child nodes of this DOM node.
function deleteChildren($node) {
    while (isset($node->firstChild)) {
        deleteChildren($node->firstChild);
        $node->removeChild($node->firstChild);
    }
}

// For fetching photos from local xml cache:
// Gets the Google timestamp of a photo (DOM element) in the cache.
// NOTE: The Google timestamp will not match the EXIF timestamp at all times.
// I have found it to be off by 7 or 8 hours (diff of GMT to California?) for
// some of my photos.
function getEntryTimestamp($domEntryElement)
{
	foreach($domEntryElement->childNodes as $domEntryChild)
	{
		if("gphoto:timestamp" == $domEntryChild->nodeName)
		{
			return $domEntryChild->nodeValue/1000;
		}
	}
	return 0;
}

// // For fetching photos from local xml cache:
// // Gets the EXIF timestamp of a photo (DOM element) in the cache.
// function getEntryTimestamp($domEntryElement)
// {
	// foreach($domEntryElement->childNodes as $domEntryChild)
	// {
		// if("exif:tags" == $domEntryChild->nodeName)
		// {        
            // foreach($domEntryChild->childNodes as $domChildChild)
            // {
                // if("exif:time" == $domChildChild->nodeName)
                // {
                    // return $domChildChild->nodeValue/1000;
                // }
            // }
		// }
	// }
	// return 0;
// }

// For fetching photos from local xml cache:
// Gets the formatted timestamp of a photo (DOM element) in the cache.
function getEntryTimestampFormatted($domEntryElement)
{
	$timestamp = getEntryTimestamp($domEntryElement);
	if(0 < $timestamp)
		return formatTimestamp($timestamp);
	else
		return 0;
}

?>