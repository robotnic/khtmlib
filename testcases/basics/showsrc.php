<?php
//header("Content-type:text/xml");
$dom=domDocument::loadHTMLFile($_GET["file"]);
$xslt=domDocument::load("style.xslt");
$proc=new XSLTProcessor();
$proc->importStylesheet($xslt);
$html=$proc->transformToDoc($dom);
echo $html->saveXML();
?>
