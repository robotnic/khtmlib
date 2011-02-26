

khtml.maplib.Map.prototype.keydown=function(evt){
		//alert(evt.keyCode);
		switch(evt.keyCode){
			case 37:
				this.moveit(30,0);	
				break;

			case 38:
				this.moveit(0,30);	
				break;

			case 39:
				this.moveit(-30,0);	
				break;
			case 40:
				this.moveit(0,-30);	
				break;
			case 187: //plus
			case 61: //plus
				var dz=Math.ceil(this.getZoom() + 0.01) - this.getZoom();
				this.autoZoomIn(this.mapsize.width/2,this.mapsize.height/2,dz);
				break;
			case 189: //minus
			case 109: //minus
				var dz=Math.floor(this.getZoom() - 0.01) - this.getZoom();
				this.autoZoomIn(this.mapsize.width/2,this.mapsize.height/2,dz);
				break;
		}	
}                 

khtml.maplib.Map.prototype.keyup=function(evt){
//	alert(77);
}

khtml.maplib.Map.prototype.moveit=function(x,y){
	var steps=20;
	var dx=x/steps;
	var dy=y/steps;
	for(var i=0; i < steps;i++){
		var f=Math.cos(3*(-steps/2+i)/steps)*20;
		this.moveitexec(dx*f,dy*f,i);
	}
}

khtml.maplib.Map.prototype.moveitexec=function(dx,dy,i){

		var that=this;
		var tempFunc=function(){
			that.moveXY(dx,dy);
		}
		setTimeout(tempFunc,20*i);
		
}
