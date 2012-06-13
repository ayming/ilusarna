

var Param = {
	vectorX: 10,
	vectorY: 5,
	vectorRight: 0,
	vectorDown: 0,
	topPadding: 50,
	init: function() {
		this.vectorRight = new Point(this.vectorX, this.vectorY);
		this.vectorDown = new Point(-(this.vectorX), this.vectorY);
	}
};
Param.init();


var Field = {
	width: 50,
	field: null,
	top: null,
	right: null,
	bottom: null,
	left: null,
	grid: null,
	
	init: function() {
		this.field = new Path();

		this.top = new Point(view.center.x, Param.topPadding);
		this.right = new Point(view.center.x+this.width*Param.vectorX, this.width*Param.vectorY + Param.topPadding);
		this.bottom = new Point(view.center.x, this.width*Param.vectorX + Param.topPadding);
		this.left = new Point(view.center.x-this.width*Param.vectorX, this.width*Param.vectorY + Param.topPadding);
		
		this.field.add(this.top);
		this.field.add(this.right);
		this.field.add(this.bottom);
		this.field.add(this.left);
		
		this.field.closed = true;

		this.field.style = {
			strokeColor: '#000',
			fillColor: '#12b407',
			strokeWidth: 0.5
		};
		
		this.showGrid();
	},
	
	showGrid: function() {
		grid = new Group();
		var line = new Path(this.top,this.left);
		line.style = {
			strokeColor: '#93d58f',
			strokeWidth: 0.5
		};
		var sLine = new Symbol(line);
		for(var i=1; i<this.width; i++){
			var pLine = sLine.place(this.left);
			pLine.position += Param.vectorRight * i - Param.vectorDown * this.width / 2;
			grid.addChild(pLine);
		}
		var line = new Path(this.top,this.right);
		line.style = {
			strokeColor: '#93d58f',
			strokeWidth: 0.5
		};
		var sLine = new Symbol(line);
		for(var i=1; i<this.width; i++){
			var pLine = sLine.place(this.right);
			pLine.position += Param.vectorDown * i - Param.vectorRight * this.width / 2;
			grid.addChild(pLine);
		}
	},
	
	zoom: function(z) {
		var amount = z / 10;
		if ((view.zoom + amount >= 0.5) && (view.zoom + amount < 2.5)) {
			view.zoom += z / 10;
		}
	}
};
Field.init();


var Item = {
	group: new Group(),
	img: new Array(),
	imgs: new Group(),
	errors: new Group(),
	gotError: null,
	placed: new Array(),
	origine: null,
	selected: null,
	isSelected: null,
	
	draw: function(x,y,w,img){
		var pt1 = Field.top+Param.vectorRight*x+Param.vectorDown*y;
		var item = new Path(pt1, pt1+Param.vectorRight*w, pt1+Param.vectorRight*w+Param.vectorDown*w, pt1+Param.vectorDown*w);
		item.closed = true;
		item.style = {
			strokeColor: '#000',
			fillColor: '#008080',
			strokeWidth: 0.2
		};
		
		
		var img = new Raster(img);
		img.scale(0.5);
		img.position = pt1;
		img.position.y += item.bounds.bottom - img.bounds.bottom;
		this.img[item.id] = img;

		this.group.addChild(item);
		this.imgs.addChild(this.img[item.id]);

		this.place(x,y,w,true);
	},
	
	place: function(x,y,w,ad){
		for (var i=y; i<w+y; i++) {
			for (var j=x; j<w+x; j++) {
				this.placed[j+'-'+i] = ad;
			}
		}
	},
	
	move: function(item, to) {
		item.item.position = Field.top + (Param.vectorRight*to[0]) + (Param.vectorDown*to[1]) + (Param.vectorRight*(to[2]/2) + Param.vectorDown*(to[2]/2));
		this.errors.removeChildren();
		this.img[item.item.id].position = item.item.position;
		this.img[item.item.id].position.y += item.item.bounds.bottom - this.img[item.item.id].bounds.bottom;
		this.gotError = false;
		this.unselect();
	},
	
	error: function(x,y,index){
		var pt1 = Field.top+Param.vectorRight*x+Param.vectorDown*y;
		var err = new Path(pt1, pt1+Param.vectorRight, pt1+Param.vectorRight+Param.vectorDown, pt1+Param.vectorDown);
		err.closed = true;
		err.style = {
			strokeColor: '#111',
			fillColor: '#A52A2A',
			strokeWidth: 0.1
		};
		this.errors.addChild(err);
	},
	
	info: function(item){
		var topPos = this.getPositionWithPx(item.segments[0].point.x,item.segments[0].point.y);
		var rightPos = this.getPositionWithPx(item.segments[1].point.x,item.segments[1].point.y);
		return topPos.concat(rightPos[0] - topPos[0]);
	},
	
	getPositionWithPx: function(x,y){
		var tx = (x - Field.top.x) / Param.vectorX;
		var ty = (y - Field.top.y) / Param.vectorY;
		return [((ty + tx) / 2), ((ty - tx) / 2)];
	},
	
	unselect: function(){
		if (this.selected && !this.gotError) {
			var infos = this.info(this.selected.item);
			this.place(infos[0],infos[1],infos[2],true);
			this.img[this.selected.item.id].opacity = 1;
			
			this.selected.item.fillColor = '#008080';
			Item.selected = false;
			Item.isSelected = false;
			pxLeftX = pxLeftY = 0;
		} else if (this.selected) {
			this.move(this.selected, this.origine);
		}
	}
	
};

Item.draw(0,0,3,'house3');
Item.draw(10,5,4,'house4');
Item.draw(4,20,6,'house6');
Item.draw(30,12,2,'house2');
project.activeLayer.appendTop(Item.errors);


var hitOptions = {
	stroke: true,
	fill: true,
	tolerance: 0
};

// event mouse down
var mapCenter = null;
function onMouseDown(event) {
	mapCenter = event;
	var hitResultTmp = Item.group.hitTest(event.point, hitOptions);
	if (!hitResultTmp) { Item.unselect(); return; }
	if (!Item.isSelected) {
		Item.origine = Item.info(hitResultTmp.item);
		Item.place(Item.origine[0],Item.origine[1],Item.origine[2],false);
	}
	
	if (!Item.isSelected || hitResultTmp.item.id == Item.selected.item.id) {
		Item.selected = hitResultTmp;
		Item.img[Item.selected.item.id].opacity = 0.6;
		Item.imgs.appendTop(Item.img[Item.selected.item.id]);
	} else if (Item.selected) {
		Item.unselect();
	}

}

// event mouse up
function onMouseUp(event) {
	if (Item.group.hitTest(event.point, hitOptions) && Item.selected && Item.group.hitTest(event.point, hitOptions).item == Item.selected.item) {
		Item.group.addChild(Item.selected.item);
		Item.selected.item.fillColor = new RgbColor(0.8, 0.8, 1, 0.6);
		
		Item.isSelected = true;
	}
}

// element is dragged
var pxLeftX = pxLeftY = spareMoveX = spareMoveY = 0;
function onMouseDrag(event) {
	
	if (Item.isSelected){
		
		var movedNumberX = Math.floor((event.delta.x + pxLeftX) / Param.vectorRight.x);
		pxLeftX = (event.delta.x + pxLeftX) - movedNumberX * Param.vectorRight.x;
		
		var movedNumberY = Math.floor((event.delta.y + pxLeftY) / Param.vectorRight.y);
		pxLeftY = (event.delta.y + pxLeftY) - movedNumberY * Param.vectorRight.y;
		
		spareMoveX += movedNumberX;
		spareMoveY += movedNumberY;
		
		// Move
		if ((spareMoveY != 0 || spareMoveX != 0) && (Math.abs(spareMoveX + spareMoveY)%2) != 1) {
			var diff = (spareMoveX - spareMoveY) / 2;
			var item = Item.selected.item;
			var pos = (Param.vectorRight * (spareMoveY + diff)) - (Param.vectorDown * diff);
			item.position += pos;
			Item.img[item.id].position += pos;
			
			spareMoveY = spareMoveX = 0;
			Item.gotError = false;
			
			// Check if correct under
			var infos = Item.info(item);
			Item.errors.removeChildren();
			for (var y=infos[1]; y<infos[2]+infos[1]; y++) {
				for (var x=infos[0]; x<infos[2]+infos[0]; x++) {
					if (Item.placed[x+'-'+y] || x<0 || y<0 || x>=Field.width || y>=Field.width) {
						Item.error(x,y,item.index);
						Item.gotError = true;
					}
				}
			}
		}
	} else {
		view.center += new Point(mapCenter.event.x-event.event.x, mapCenter.event.y-event.event.y);
		mapCenter = event;
		if (Item.selected) {
			Item.unselect();
		}
	}
}

/*function onMouseMove(event) {
	console.log(event.event.x +' '+ event.event.y);
}*/


function onKeyUp(event) {
	switch (event.key) {
	case '+':
		Field.zoom(1);
		break;
	case '-':
		Field.zoom(-1);
		break;
	}
	
}

window.addEventListener('mousewheel', function(e){ Field.zoom(e.wheelDeltaY<0?-1:1); }, false);










