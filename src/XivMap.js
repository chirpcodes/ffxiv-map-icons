// Global

const fs = require("fs");

const {createCanvas, loadImage} = require("canvas");

// Class

class XivMap {
	constructor(path, opts={}) {
		if (!path)
			throw "No file path specified for map image.";
		this._path = path;

		this.opts = Object.assign({
			sizeFactor: 100,
			iconScale: 1
		}, opts);

		// Canvas

		this.canvas = createCanvas(2048, 2048);
		this.ctx = this.canvas.getContext("2d");
	}

	// Conversion

	pixelToCoord(...args) {
		if (args.length == 1) {
			const c = this.opts.sizeFactor / 100,
				v = c * args[0];
			return (41 / c) * (v / 2048) + 1;
		} else {
			return {
				x: this.pixelToCoord(args[0]),
				y: this.pixelToCoord(args[1])
			};
		}
	}

	coordToPixel(...args) {
		if (args.length == 1) {
			const c = this.opts.sizeFactor / 100,
				v = args[0] - 1;
			return (v * 2048) / (41 / c);
		} else {
			return {
				x: this.coordToPixel(args[0]),
				y: this.coordToPixel(args[1])
			};
		}
	}

	// Draw

	async drawIcon(file, x=0, y) {
		if (!file)
			throw "No file path specified for icon image.";
		
		if (x != undefined && y == undefined)
			var {x, y} = x;
		
		// Canvas
		
		const ctx = this.ctx,
			scale = 64*this.opts.iconScale,
			off = scale/2;

		// Icon

		const img = await loadImage(file);
		ctx.drawImage(img, x-off, y-off, scale, scale);
		
		// Return

		return this;
	}

	async drawText(text="", x, y, orient=0, opts={}) {
		opts = Object.assign({
			size: 18,
			strokeWidth: 1,
			strokeStyle: "black",
			fillStyle: "white",
			italic: false
		}, opts);

		if (x != undefined && y == undefined)
			var {x, y} = x;
		
		// Canvas

		const ctx = this.ctx;

		// Font

		ctx.font = `100 ${opts.italic?"italic":""} ${opts.size}px Arial`;

		// Offset

		let xOff = 0,
			yOff = 0;
		
		const {width, emHeightAscent} = ctx.measureText(text);
		xOff -= width/2;
		yOff += emHeightAscent;

		switch (orient) {
			case 1: // Left
				xOff = -width - 16;
				yOff = yOff / 2;
				break;
			case 2: // Right
				xOff = 16;
				yOff = yOff / 2;
				break;
			case 3: // Down
				yOff += 28;
				break;
			case 4: // Up
				yOff -= 38;
				break;
		}

		// Text

		ctx.shadowColor = "black";
		ctx.shadowBlur = 1;

		ctx.strokeStyle = opts.strokeStyle;
		ctx.lineWidth = opts.strokeWidth;
		ctx.miterLimit = 2;
		ctx.strokeText(text, x+xOff, y+yOff);
		
		ctx.fillStyle = opts.fillStyle;
		ctx.fillText(text, x+xOff, y+yOff);

		// Return

		return this;
	}

	async draw() {
		// Canvas

		const ctx = this.ctx;
		
		// Map

		const bg = await loadImage(this._path);
		ctx.drawImage(bg, 0, 0);

		// Return

		return this;
	}

	// Write

	write(path) {
		if (!path)
			throw "No path specified.";
		if (!this.canvas)
			throw "No canvas to draw off. Please use XivMap.draw() at least once.";
		
		return new Promise(res=>{
			const out = fs.createWriteStream(path),
				stream = this.canvas.createPNGStream();
			stream.pipe(out);
			out.on("finish", ()=>res());
		});
	}
}

// Export

module.exports = XivMap;