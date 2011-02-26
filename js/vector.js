khtml.maplib.Vector=function(){
	this.lineArray=new Array();
	this.dropCount=0;
	this.stopit=false;
	this.backend="svg";
	if (navigator.userAgent.indexOf("MSIE") != -1) {
		if(getInternetExplorerVersion() < 9){
			this.backend="vml";
		}
	}

	this.boundsSouth=90;
	this.boundsNorth=-90;
	this.boundsWest=180;
	this.boundsEast=-180;

	this.renderbackend=function(render){
		this.backend=render;
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
		var style=this.lineArray[a].style;
		var close=this.lineArray[a].close;
		if(style.stroke){
			var stroke=style.stroke;
		}else{
			var stroke="black";
		}
		if(style.fill){
			var fill=style.fill;
		}else{
			var fill="none";
		}
			if(style.strokeWidth){
			var strokeWidth=style.strokeWidth;
		}else{
			var strokeWidth=1;
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
					path.style[name]=this.lineArray[a].style[prop];
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
			if(close){
				d=d+" z";
			}
			//holes
			for(var k=0; k < this.lineArray[a].holes.length;k++){
				var hole=this.lineArray[a].holes[k];
				for( var m=0; m < hole.length;m++){
					var p=this.themap.latlngToXY(hole[m]);
					var x=Math.round(p["x"]);
					var y=Math.round(p["y"]);
					
					if(m==0){
						d+=" M"+x+","+y;
					}else{
						d+=" L"+x+","+y;
					}
				}
				if(close){
					d=d+" z";
				}
			}

		//show path
		switch(this.backend){
			case "canvas":
				if(style.cutout){
					this.ctx.globalCompositeOperation = 'destination-out';
				}else{
					this.ctx.globalCompositeOperation = 'source-over';
				}
				if(style.close){
					this.ctx.closePath();
					this.ctx.fill();
				}
				this.ctx.globalCompositeOperation = 'source-over';
				this.ctx.stroke();
				break;	
			case "svg":
				if(style.close){
					//d=d+" z";
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
			if((this.oldPoint["x"] > this.themap.mapsize.width)&&(p["x"]>this.themap.mapsize.width0)){
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
}
