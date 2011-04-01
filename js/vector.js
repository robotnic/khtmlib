khtml.maplib.Vector=function(){
	this.lineArray=new Array();
	this.dropCount=0;
	this.stopit=false;
	this.backend="svg";
	if (navigator.userAgent.indexOf("Android") != -1) {
		this.backend="canvas";
	}
	this.svgStyleInterface=false;
	if (navigator.userAgent.indexOf("MSIE") != -1) {
		if(getInternetExplorerVersion() < 9){
			this.backend="vml";
		}
	}
	this.canvasClassStyles=new Array();

	this.boundsSouth=90;
	this.boundsNorth=-90;
	this.boundsWest=180;
	this.boundsEast=-180;

	this.renderbackend=function(render){

		this.backend=render;

		this.themap.overlayDiv.removeChild(this.vectorEl);
		this.vectorEl=this.createVectorElement(this.themap);
		this.themap.overlayDiv.appendChild(this.vectorEl);

		this.render();
	}

	//create a svg, canvas or vml element
	this.createVectorElement=function(themap){
		switch(this.backend){
			case "canvas":
				vectorEl=document.createElement("canvas");	
				this.ctx=vectorEl.getContext("2d");
				break;
			case "svg":
				vectorEl=document.createElementNS("http://www.w3.org/2000/svg","svg");	
				break;
                        case "vml":
                                if(document.namespaces['v'] == null) {
                                        document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                                        var stl = document.createStyleSheet();
                                        stl.addRule("v\\:group", "behavior: url(#default#VML);");
                                        stl.addRule("v\\:polyline", "behavior: url(#default#VML);");
                                }
                                //vectorEl=document.createElement("v:group");
                                vectorEl=document.createElement("div");
				//document.body.appendChild(vectorEl);
				//vectorEl.style.display="none";
				break;
			default:
				alert("error: unknown vector backend");

		}
		vectorEl.style.width=themap.mapsize.width+"px";
		vectorEl.style.height=themap.mapsize.height+"px";
		vectorEl.setAttribute("height",themap.mapsize.height+"px");
		vectorEl.setAttribute("width",themap.mapsize.width+"px");
		vectorEl.style.position="absolute";
		vectorEl.style.top="0";
		vectorEl.style.left="0";
		return vectorEl;	
	}
	this.init=function(themap){
		this.themap=themap;
		this.vectorEl=this.createVectorElement(themap);
		themap.overlayDiv.appendChild(this.vectorEl);
	}
	this.createPolyline=function(pointArray){

                var polyline=new Object;
                polyline.style=new Object;
                polyline.events=new Object;
                polyline.tags=new Array;
                polyline.className=null;
                polyline.close=false;
                polyline.id=null;
                polyline.holes=new Array;
		polyline.cutout=function(points){
			var holePoints=parseLine(points);
			//console.log(holePoints.length);
			polyline.holes.push(holePoints);
			return polyline.holes[polyline.holes.length -1];
		}
                polyline.points=parseLine(pointArray);
                
                this.lineArray.unshift(polyline);
		this.makeBounds(polyline.points);
                return polyline;

	}

	function parseLine(pointArray){
                if(pointArray){
                        if(typeof(pointArray)=="string"){
                                points=new Array();
                                var pa=pointArray.split(" ");
                                for(var i=0; i < pa.length;i++){
                                        var point=pa[i].split(",");
					if(point.length !=2) continue;
                                        point[0]=parseFloat(point[0]);
                                        point[1]=parseFloat(point[1]);
                                        points.push(new khtml.maplib.Point(point[0],point[1]));
                                }
                        }
                        if(typeof(pointArray)=="object"){
                                points=pointArray;
                        }
                }else{
                        points=new Array();
                }
		return points;
	}

	this.cancel=function(){
		this.stopit = true;
	}
	this.render=function(a){
		var intZoom=Math.floor(this.themap.zoom());
		this.vectorEl.setAttribute("class","z"+intZoom);
		if(this.stopit){
			//stop rendering vectors
			this.stopit=false;
			if(a!=null){
				if(this.oldVectorEl && this.oldVectorEl.parentNode){
					//draw not finished - go back to old version (move)
					try{  //ie workaround
						this.oldVectorEl.parentNode.removeChild(this.oldVectorEl);
						this.vectorEl=this.createVectorElement(this.themap);
						this.themap.overlayDiv.appendChild(this.vectorEl);
					}catch(e){
						alert(this.oldVectorEl.tagName);
						alert(this.oldVectorEl.parentNode.tagName);

					}
				}
				return;
			}
		}
		if(a==null){
			if(this.oldZoom==this.themap.zoom() &&(this.themap.moveX!=this.lastMoveX || this.themap.moveY!=this.lastMoveY)){
				//this.oldVectorEl=this.vectorEl;
				//this.vectorEl=this.createVectorElement(this.themap);
				var dx=Math.round((this.themap.moveX - this.lastMoveX)*this.themap.faktor*this.themap.sc);
				var dy=Math.round((this.themap.moveY - this.lastMoveY)*this.themap.faktor*this.themap.sc);
			
				this.vectorEl.style.top=dy+"px";
				this.vectorEl.style.left=dx+"px";
				//alert(this.vectorEl.style.top);
				
				if(!this.themap.finalDraw){
					return;
				}
				this.oldVectorEl=this.vectorEl;
				this.vectorEl=this.createVectorElement(this.themap);
			}
			this.oldZoom=this.themap.zoom();
			this.clear();
			var a=this.lineArray.length -1;
		}
		if(a < 0){
			if(this.oldVectorEl && this.oldVectorEl.parentNode ){
				this.oldVectorEl.parentNode.replaceChild(this.vectorEl,this.oldVectorEl);
				this.vectorEl.style.display="";
				return;
			}
			 return;
		}

		
		this.lastMoveX=this.themap.moveX;
		this.lastMoveY=this.themap.moveY;

		this.dropped=null;

		//set styles
		var l=this.lineArray[a].points;
		var className=this.lineArray[a].className;
		if(this.backend=="canvas"){
			if(!className)className="khtmlDummyClassname9483";  //hopefully nobody will use this classname
			if(!this.canvasClassStyles[className]){
				this.canvasClassStyles[className]=getCssStyles(className);
			}

			var style=this.lineArray[a].style;
			var close=this.lineArray[a].close;
			if(style.opacity){
				var opacity=style.opacity;
			}else{
				var opacity=this.canvasClassStyles[className].opacity;
			}
			if(style.fillOpacity){
				var fillOpacity=style.fillOpacity;
			}else{
				var fillOpacity=this.canvasClassStyles[className].fillOpacity;
			}
			if(style.strokeOpacity){
				var strokeOpacity=style.strokeOpacity;
			}else{
				var strokeOpacity=this.canvasClassStyles[className].strokeOpacity;
			}
			if(style.stroke){
				var stroke=hex2rgba(style.stroke,opacity*strokeOpacity);
			}else{
				var stroke=this.canvasClassStyles[className].stroke;
			}
			if(style.fill){
				var fill=hex2rgba(style.fill,opacity*fillOpacity);
			}else{
				var fill=this.canvasClassStyles[className].fill;
			}
			if(fill!="none"){
				close=true;
			}
			if(style.strokeWidth){
				var strokeWidth=style.strokeWidth;
			}else{
				var strokeWidth=this.canvasClassStyles[className].strokeWidth;
			}
		}



		//initialize the polyline 
		switch(this.backend){
			case "canvas":
				this.ctx.beginPath();
				this.ctx.strokeStyle = stroke;
				this.ctx.fillStyle = fill;
				this.ctx.lineWidth = strokeWidth;
				break;
			case "svg":
				var path=document.createElementNS("http://www.w3.org/2000/svg","path");
				if(this.lineArray[a].className!=null){
					path.setAttribute("class",this.lineArray[a].className);
					path.polyline=this.lineArray[a];
				}
				if(this.lineArray[a].id!=null){
					path.setAttribute("id",this.lineArray[a].id);
				}
				for(var ev in this.lineArray[a].events){
					Event.attach(path, ev, this.lineArray[a].events[ev], this, false);
				}
				var ffStyleString="";
				for(var prop in this.lineArray[a].style){
					var name="";
					for(var w=0;w < prop.length;w++){
						var chr=prop[w];
						if(chr.match(/[A-Z]/)){
							name=name+"-"+chr.toLowerCase();
						}else{
							name=name+chr;
						}
					}
					//path.setAttribute(name,this.lineArray[a].style[prop]);
					if(this.svgStyleInterface){
						path.style[name]=this.lineArray[a].style[prop];
					}else{
						ffStyleString=ffStyleString+name+":"+this.lineArray[a].style[prop]+";";
					}
				}
				if(!this.svgStyleInterface){
					if(ffStyleString!=""){
						path.setAttribute("style",ffStyleString);
					}
				}
				/*
				path.setAttribute("stroke",stroke);
				path.setAttribute("stroke-width",strokeWidth);
				path.setAttribute("fill",fill);
				*/
				break;
			case "vml":
				var path=document.createElement("v:polyline");
				path.setAttribute("fillcolor",fill);
				path.setAttribute("strokecolor",stroke);
				path.setAttribute("strokeweight",strokeWidth +"px");
				break;


		}

		//calculate polyline path
		for(var i=0;i < l.length;i++){
			var p=this.themap.latlngToXY(l[i]);	
			
			switch(this.backend){
				case "canvas":
					//this.ctx.globalCompositeOperation = 'source-over';
					if(i==0){
						this.ctx.moveTo(p["x"],p["y"]);
					}else{
						var dropped=this.dropped;
						if(this.deside(p) || i==l.length -1){
							if(dropped && i!=l.length -1){
								this.ctx.lineTo(dropped["x"],dropped["y"]);
							}
							this.ctx.lineTo(p["x"],p["y"]);
						}
					}
					break;
				case "svg":
					if(i==0){
						var d="M"+p["x"]+","+p["y"];
					}else{
						var dropped=this.dropped;
						if(this.deside(p) || i==l.length -1){
							if(dropped && i!=l.length -1){
								d+=" L"+dropped["x"]+","+dropped["y"];
							}
							d+=" L"+p["x"]+","+p["y"];
						}
					}
					break;
				case "vml":
					var x=Math.round(p["x"]);
					var y=Math.round(p["y"]);
					if(i==0){
                                                //var d=" "+x+"px,"+y+"px ";
                                                var d=" "+x+","+y+" ";
                                        }else{
                                                var dropped=this.dropped;
                                                if(this.deside(p) || i==l.length -1){
                                                        if(dropped && i!=l.length -1){
                                                                //d+=" "+parseInt(dropped["x"])+"px,"+parseInt(dropped["y"])+"px ";
                                                                d+=" "+Math.round(dropped["x"])+","+Math.round(dropped["y"])+" ";
                                                        }
                                                        d+=" "+x+","+y+" ";
                                                        //d+=" "+x+"px,"+y+"px ";
                                                }
                                        }
                                        break;
	
					
			}
		}
			if(this.lineArray[a].close){
				d=d+" z";
			}
		if(this.backend=="canvas"){
			this.ctx.globalCompositeOperation = 'source-over';
			if(close){
				this.ctx.closePath();
				this.ctx.fill();
			}
			this.ctx.stroke();
		}

			//holes
			for(var k=0; k < this.lineArray[a].holes.length;k++){
				var hole=this.lineArray[a].holes[k];
				if(this.backend=="canvas"){
					this.ctx.beginPath();
					this.ctx.fillStyle = "#000000";
					this.ctx.globalCompositeOperation = 'destination-out';
				}
				for( var m=0; m < hole.length;m++){
					var p=this.themap.latlngToXY(hole[m]);
					var x=Math.round(p["x"]);
					var y=Math.round(p["y"]);
					
					switch(this.backend){
						case "canvas":
							if(m==0){
								this.ctx.moveTo(p["x"],p["y"]);
							}else{
								this.ctx.lineTo(p["x"],p["y"]);
							}

						case "svg":
							if(m==0){
								d+=" M"+x+","+y;
							}else{
								d+=" L"+x+","+y;
							}
						break;
					}
				}
				if(this.backend=="canvas"){
					this.ctx.fill();
					this.ctx.globalCompositeOperation = 'source-over';
					this.ctx.closePath();
					this.ctx.stroke();
				}
				d=d+" z";
			}

		//show path
		switch(this.backend){
			case "canvas":
				/*
				//this.ctx.globalCompositeOperation = 'source-over';
				this.ctx.closePath();
				this.ctx.fill();
				this.ctx.stroke();
				*/
				break;	
			case "svg":
				if(this.lineArray[a].close){
					d=d+" z";
				}
				if(this.lineArray[a].holes.length >1000){
					if(this.lastpath){	
						var d=this.lastpath.getAttribute("d")+" "+d;
						this.lastpath.setAttribute("d",d);
						this.lastpath.setAttribute("fill-rule","evenodd");
					}else{
						alert("cutout not possible");
					}
				}else{
					path.setAttribute("d",d);
					if(this.lineArray[a].holes.length >0){
						path.setAttribute("fill-rule","evenodd");
					}
					this.vectorEl.appendChild(path);
					this.lastpath=path;
				}
				break;	
			case "vml":
				path.setAttribute("filled",style.close);
                                //if(style.cutout){
					/* do the holes
                                        if(this.lastpath){
						this.lastpath.setAttribute("clip-rule","nonzero");	
                                        }else{
                                                alert("cutout not possible");
                                        }
					*/
                                //}else{
                                        this.vectorEl.appendChild(path);
//					alert(this.vectorEl.childNodes.length);
					//path.style.position="absolute";
					//alert(d);	
					if(!path.points){
						path.setAttribute("points",d);
					}else{
						path.points.value=d;
					}
                                        this.lastpath=path;
					//alert(d+" ---- "+path.points.value);
				/*
				alert(path.points.value);
				alert(path.strokecolor);
				alert(path.fillcolor);
				alert(path.strokeweight);
				*/
                                //}
                                break;
	
		}	

		//cancel able after mod 100 lines
		if(a/100 ==Math.floor(a/100)){
			var that=this;
			var tempFunction=function(){
				that.render(a -1);
			}
			setTimeout(tempFunction,0);
		}else{
			this.render(a -1);
		}
	}

	//draw only visible parts of polyline
	this.deside=function(p){
		if(this.oldPoint){
			this.dropped=p;
			if((Math.abs(this.oldPoint["x"] - p["x"]) <1)&&(Math.abs(this.oldPoint["y"] - p["y"]) <1)) {
				return false
			}
			if((this.oldPoint["x"] < 0)&&(p["x"]<0)){
				return false
			}
			if((this.oldPoint["y"] < 0)&&(p["y"]<0)){
				return false
			}
			if((this.oldPoint["x"] > this.themap.mapsize.width)&&(p["x"]>this.themap.mapsize.width)){
				return false
			}
			if((this.oldPoint["y"] > this.themap.mapsize.height)&&(p["y"]>this.themap.mapsize.height)){
				return false
			}
		}
		this.dropped=null;
		this.oldPoint=p;
		return true;	
	}

	//calculate the extend of the polyline
	this.makeBounds=function(line){
		for(var i=0;i < line.length;i++){
			var lng=line[i].lng();
			var lat=line[i].lat();
			if(lat > this.boundsNorth){
				this.boundsNorth=lat;
			}	
			if(lat < this.boundsSouth){
				this.boundsSouth=lat;
			}	
			if(lng > this.boundsEast){
				this.boundsEast=lng;
			}	
			if(lng < this.boundsWest){
				this.boundsWest=lng;
			}	
			//console.log("s: ",this.boundsSouth,"n: ",this.boundsNorth,"w: ",this.boundsWest,"e: ",this.boundsEast);
		}

	}

	//readonly return bounds
	this.bounds=function(){
		var sw=new khtml.maplib.Point(this.boundsSouth,this.boundsWest);
		var ne=new khtml.maplib.Point(this.boundsNorth,this.boundsEast);
		var b=new khtml.maplib.Bounds(sw,ne);
		return(b);	
	}

	//remove polyline
	this.clear=function(){
		if(this.ctx){
			this.ctx.clearRect ( 0 , 0 , this.themap.mapsize.width , this.themap.mapsize.height );
		}

		while(this.vectorEl.firstChild){
			this.vectorEl.removeChild(this.vectorEl.firstChild);
		}

	}

	function getInternetExplorerVersion() {
            var rv = -1; // Return value assumes failure.
            if (navigator.appName == 'Microsoft Internet Explorer') {
                var ua = navigator.userAgent;
                var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                if (re.exec(ua) != null)
                    rv = parseFloat(RegExp.$1);
            }
            return rv;
        }	

	//styling canvas with css

	function getCssStyles(klass){
		var styleObj=new Object;
		styleObj.stroke="black";
		styleObj.strokeWidth=1;
		styleObj.fill="none";
		styleObj.opacity=1;
		styleObj.fillOpacity=1;
		styleObj.strokeOpacity=1;

		for(var i=0; i< document.styleSheets.length;i++){
			var list=document.styleSheets[i];
			if (list.cssRules){
				var rules = list.cssRules;
			}else{
				var rules = list.rules;
			}
			for (r = 0; r < rules.length; r++)
			{
				var csstext=rules[r].style.cssText;
				selectorText = rules[r].selectorText;
				if(selectorText!="."+klass)continue

				var cssAr=csstext.split(";");
				for(var j=0;j<cssAr.length;j++){
					var stAr=cssAr[j].split(":");
					if(stAr.length==2){
						var name=stAr[0].replace(/^\s/, '');
						var value=stAr[1].replace(/^\s/, '');
						if(name=="stroke"){
							styleObj.stroke=value;

						}
						if(name=="fill"){
							styleObj.fill=value;
						}
						if(name=="stroke-width"){
							styleObj.strokeWidth=parseFloat(value);
						}
						if(name=="opacity"){
							styleObj.opacity=parseFloat(value);
						}
						if(name=="fill-opacity"){
							styleObj.fillOpacity=parseFloat(value);
						}
						if(name=="stroke-opacity"){
							styleObj.strokeOpacity=parseFloat(value);
						}
					
					}
				}
			}
		}

		if(styleObj.stroke!="none"){
			styleObj.stroke=hex2rgba(styleObj.stroke,styleObj.opacity*styleObj.strokeOpacity);
		}
		if(styleObj.fill!="none"){
			styleObj.fill=hex2rgba(styleObj.fill,styleObj.opacity*styleObj.fillOpacity);
		}
		//console.log(styleObj.fill);
		return styleObj;
	}

 var hexArr = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
 function hex2rgba(color,opacity) {
	if(color[0]!="#"){
		if(color=="none"){
			return "none";
		}else{
			color="#"+colors[color];
		}
	}
        var return_rgbval = "rgba(";
        if (color.charAt(0) == "#") color = color.substr(1); // Removes the '#' at the start if it's present
        // Originally color.charAt(0) was written color[0], however this didn't work out in IE
        if (color.length == 3) color = color.charAt(0)+color.charAt(0)+color.charAt(1)+color.charAt(1)+color.charAt(2)+color.charAt(2);
        color = color.toUpperCase(); // To be compared with the hexArr array the color string have to be in uppercase
        var temp_val = 0;
        for (i=0;i<color.length;i++) {
               var temp_val2;
               for (j=0;j<hexArr.length;j++) {
                     if (color.charAt(i) == hexArr[j]) {temp_val2 = j;break;}
               }
               if (i%2 == 0) {temp_val = temp_val2*16}
               else {
                    	temp_val += temp_val2;
                    	return_rgbval += (i==(color.length-1)) ? temp_val+","+opacity+")" : temp_val+", ";
               }


        }
        return return_rgbval;
 }

    var colors = {
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '00ffff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000000',
        blanchedalmond: 'ffebcd',
        blue: '0000ff',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '00ffff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dodgerblue: '1e90ff',
        feldspar: 'd19275',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'ff00ff',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred : 'cd5c5c',
        indigo : '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3',
        lightgreen: '90ee90',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslateblue: '8470ff',
        lightslategray: '778899',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '00ff00',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'ff00ff',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370d8',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'd87093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        red: 'ff0000',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        violetred: 'd02090',
        wheat: 'f5deb3',
        white: 'ffffff',
        whitesmoke: 'f5f5f5',
        yellow: 'ffff00',
        yellowgreen: '9acd32'
    };

}
