<?php

$oneUnixDay = 86400;

function roundDownToNearestDay($timestamp)
{
    if(isset($timestamp))
    {
        return $timestamp - ($timestamp % 86400); // Why do I get division by 0 errors when I use $oneUnixDay?
    }
    else
    {
        return 0;
    }
}

// For fetching photos from local xml cache.
// This timestamp will become the alt text for the image
function formatTimestamp($timestamp)
{
	return gmdate("YmdHis", $timestamp);
}

// For saving a journal entry to the server.
// This timestamp will be the <h3> for the entry. 
function formatTimestampForDisplay($timestamp)
{
	return gmdate("m/d/Y", $timestamp);
}

?>