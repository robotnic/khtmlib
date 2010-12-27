<html xmlns="http://www.w3.org/1999/html" width="1000px" height="600px" >
<head>
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
			text.setAttribute("x",24);
			text.setAttribute("y",-10*i-2);
			text.setAttribute("text-anchor","end");
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
	var y=m ;	
	var h=190-y;
	target.setAttribute("y",y);
	target.setAttribute("height",h);
//	document.getElementById("y").textContent=y;
}

</script>
</head>
<body onload="init()">
<svg id="svg" xmlns="http://www.w3.org/2000/svg" width="1000px" height="600px" >
<g onmousedown="zoom(event)" onmousemove="zoom(event)" onload="init()">
<rect id="zoominger" x="0" y="140" width="30" height="50" fill="yellow" strok="black" opacity="1" />
<rect x="0" y="0" width="30" height="220" fill="black" stroke="none"  opacity="0.05" />
<g id="steps" transform="translate(0,220)">

</g>
</g>

</svg>
</body>
</html>

