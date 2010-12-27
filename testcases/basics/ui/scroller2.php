<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>scroller</title>
<style type="text/css">
#svg{
position:absolute;
top:0px;
left:0px;
}

</style>
<script type="text/javascript">

var svgns="http://www.w3.org/2000/svg";
function init(){
	for(var i=0; i < 22;i++){
		var rect=document.createElementNS(svgns,"rect");
		if(i/5==Math.floor(i/5)){
			width=25;
			var t=i;
			var text=document.createElementNS(svgns,"text");
			text.appendChild(document.createTextNode(i ));
			document.getElementById("steps").appendChild(text);
			text.setAttribute("x",8);
			text.setAttribute("y",-10*i-4);
		}else{
			width=5;
			var t="";
		}
		rect.setAttribute("width",width);
		rect.setAttribute("height",1);
		rect.setAttribute("y",-10 *i);
		document.getElementById("steps").appendChild(rect);

	}


}

function zoom(evt){
	var target=document.getElementById("zoominger");
	var m=evt.clientY ;
	var y=m -67;	
	var h=210-y;
	target.setAttribute("y",y);
	target.setAttribute("height",h);
}

</script>
</head>
<body onload="init()">
<svg id="svg" xmlns="http://www.w3.org/2000/svg" width="1000px" height="600px">
<rect x="30" y="20" width="5" height="190" fill="none" stroke="black"/>
<g id="steps" transform="translate(36,210)">

</g>
<g onmousedown="zoom(event)" onmousemove="zoom(event)">
<rect x="30" y="20" width="30" height="190" fill="black" stroke="none"  opacity="0.05" />
<rect id="zoominger" x="30" y="160" width="30" height="50" fill="black" strok="black" opacity="0.1" />
</g>
</svg>


</body>
</html>
