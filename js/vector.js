khtml.maplib.Vector=function(){
	this.lineArray=new Array();
	this.dropCount=0;
	this.stopit=false;
	this.backend="canvas";
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
                                        var stl = document.createStyleSheet();
                                        stl.addRule("v\\:*", "behavior: url(#default#VML);");
                                        document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                                }
                                vectorEl=document.createElement("v:group");
				break;
			default:
				alert("error: unknown vector backend");

		}
		vectorEl.style.width=themap.mapsize.width+"px";
		vectorEl.style.height=themap.mapsize.height+"px";
		vectorEl.setAttribute("height",themap.mapsize.height+"px");
		vectorEl.setAttribute("width",themap.mapsize.width+"px");
		vectorEl.style.position="absolute";
		return vectorEl;	
	}
	this.init=function(themap){
		this.themap=themap;
		this.vectorEl=this.createVectorElement(themap);
		themap.overlayDiv.appendChild(this.vectorEl);
	}
	this.addline=function(line,style){
		var geo=new Object();
		geo.line=line;
		geo.style=style;
		this.lineArray.splice(0,0,geo);
		this.makeBounds(line);
	}
	this.cancel=function(){
		this.stopit = true;
	}
	this.render=function(a){
		if(this.stopit){
			//stop rendering vectors
			this.stopit=false;
			if(a!=null){
				if(this.oldVectorEl && this.oldVectorEl.parentNode){
					
					//draw not finished - go back to old version (move)
					this.vectorEl=this.createVectorElement(this.themap);
					this.themap.overlayDiv.appendChild(this.vectorEl);
					this.themap.overlayDiv.removeChild(this.oldVectorEl);
				}
				return;
			}
		}
		if(a==null){
			if(this.oldZoom==this.themap.zoom()){
				//this.oldVectorEl=this.vectorEl;
				//this.vectorEl=this.createVectorElement(this.themap);
				var dx=(this.themap.moveX - this.lastMoveX)*this.themap.faktor*this.themap.sc;
				var dy=(this.themap.moveY - this.lastMoveY)*this.themap.faktor*this.themap.sc;
				this.vectorEl.style.top=dy+"px";
				this.vectorEl.style.left=dx+"px";
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
				return;
			}
			 return;
		}

		
		this.lastMoveX=this.themap.moveX;
		this.lastMoveY=this.themap.moveY;

		this.dropped=null;

		//set styles
		var l=this.lineArray[a].line;
		var style=this.lineArray[a].style;
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
				path.setAttribute("stroke",stroke);
				path.setAttribute("stroke-width",strokeWidth);
				path.setAttribute("fill",fill);
				break;
			case "vml":
				this.path=document.createElement("v:polyline");
				this.path.setAttribute("fillcolor",fill);
				this.path.setAttribute("strokecolor",stroke);
				this.path.setAttribute("strokeweight",strokeWidth);


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
						d="M"+p["x"]+","+p["y"];
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
					if(i==0){
                                                d=" "+p["x"]+"px,"+p["y"]+"px";
                                        }else{
                                                var dropped=this.dropped;
                                                if(this.deside(p) || i==l.length -1){
                                                        if(dropped && i!=l.length -1){
                                                                d+=" "+dropped["x"]+"px,"+dropped["y"]+"px";
                                                        }
                                                        d+=" "+p["x"]+"px,"+p["y"]+"px";
                                                }
                                        }
                                        break;
	
					
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
					d=d+" z";
				}
				if(style.cutout){
					if(this.lastpath){	
						var d=this.lastpath.getAttribute("d")+" "+d;
						this.lastpath.setAttribute("d",d);
						this.lastpath.setAttribute("fill-rule","evenodd");
					}else{
						alert("cutout not possible");
					}
				}else{
					path.setAttribute("d",d);
					this.vectorEl.appendChild(path);
					this.lastpath=path;
				}
				break;	
			case "vml":
				this.path.setAttribute("filled",style.close);
                                if(style.cutout){
                                        if(this.lastpath){
						this.path.setAttribute("clip-rule","nonzero");	
                                        }else{
                                                alert("cutout not possible");
                                        }
                                }else{
					this.path.points.value=d;
                                        this.vectorEl.appendChild(path);
                                        this.lastpath=path;
                                }
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
