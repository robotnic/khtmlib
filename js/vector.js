khtml.maplib.Vector=function(line){
	this.lineArray=new Array();
	this.dropCount=0;
	this.stopit=false;
	this.backend="canvas";
	this.boundsSouth=90;
	this.boundsNorth=-90;
	this.boundsWest=180;;
	this.boundsEast=-180;;

	if(line){
		this.lineArray.push(line);
		this.makeBounds(line);
	}
	this.init=function(themap){
		this.themap=themap;
		switch(this.backend){
			case "canvas":
				this.vectorEl=document.createElement("canvas");	
				this.ctx=this.vectorEl.getContext("2d");
				break;
			case "svg":
				this.vectorEl=document.createElementNS("http://www.w3.org/2000/svg","svg");	
				break;
                        case "vml":
                                if(document.namespaces['v'] == null) {
                                        var stl = document.createStyleSheet();
                                        stl.addRule("v\\:*", "behavior: url(#default#VML);");
                                        document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
                                }
                                this.vectorEl=document.createElement("v:group");
				break;
			default:
				alert("error: unknown vector backend");

		}
		this.vectorEl.style.width=themap.mapsize.width+"px";
		this.vectorEl.style.height=themap.mapsize.height+"px";
		this.vectorEl.setAttribute("height",themap.mapsize.height+"px");
		this.vectorEl.setAttribute("width",themap.mapsize.width+"px");
		this.vectorEl.style.position="absolute";
		themap.mapParent.appendChild(this.vectorEl);
	}
	this.addline=function(line,style){
		var geo=new Object();
		geo.line=line;
		geo.style=style;
		//this.lineArray.push(geo);
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
			//console.log("canceled");
				while(this.vectorEl.firstChild){
					this.vectorEl.removeChild(this.vectorEl.firstChild);
				}
				return;
			}
		}
		if(a==null){
			//console.log("new render"+a);
			switch(this.backend){
				case "canvas":
					this.clear();
					break;
				case "svg":
				case "vml":
					while(this.vectorEl.firstChild){
						this.vectorEl.removeChild(this.vectorEl.firstChild);
					}
					break;
			}
			var a=this.lineArray.length -1;
		}
		if(a < 0){
			//console.log("fertig");
			 return;
		}

			
			this.dropped=null;
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
					if(style.width){
						path.setAttribute("stroke-width",strokeWidth);
					}
					path.setAttribute("fill",fill);
					break;
				case "vml":
					this.path=document.createElement("v:polyline");
					this.path.setAttribute("fillcolor",fill);
					this.path.setAttribute("stroked",stroke);


			}
			for(var i=0;i < l.length;i++){
			//	if(!l[i])continue;
				//var lng=l[i].lng();
				//var lat=l[i].lat();
				//console.log(lat,lng);
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
									d+=" L"+p["x"]+","+p["y"];
                                                                }
								d+=" L"+p["x"]+","+p["y"];
                                                        }
                                                }
						break;
				}
				//console.log(p["x"],p["y"]);
			//ctx.arc(x, y, r, 0, Math.PI*2, true); 
			}
			//this.ctx.closePath();
			/*
			if(this.backend=="canvas"){
				//this.ctx.stroke();
				if(style.close){
					//this.ctx.fill();
				}
			}
			*/
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
			}	
			//this works perfect and is cancelable but is too slow
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
	this.bounds=function(){
		var sw=new khtml.maplib.Point(this.boundsSouth,this.boundsWest);
		var ne=new khtml.maplib.Point(this.boundsNorth,this.boundsEast);
		var b=new khtml.maplib.Bounds(sw,ne);
		return(b);	
	}
	this.clear=function(){
		this.ctx.clearRect ( 0 , 0 , this.themap.mapsize.width , this.themap.mapsize.height );
	}
	
}
